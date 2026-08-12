from django.db.models import Count, Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import filters, mixins, response, status, viewsets
from rest_framework.decorators import action

from catalog.models import InventoryBatch, PharmacyBranch

from .models import (
    InventoryTransaction,
    PurchaseOrder,
    ReturnRequest,
    StorageLocation,
    Supplier,
    Warehouse,
)
from .permissions import IsOperationsStaff
from .serializers import (
    InventoryAdjustmentInputSerializer,
    InventoryBatchOperationsSerializer,
    InventoryTransactionSerializer,
    PharmacyBranchOperationsSerializer,
    PurchaseOrderSerializer,
    PurchaseReceiptSerializer,
    QualityInspectionInputSerializer,
    ReturnApprovalSerializer,
    ReturnNoteSerializer,
    ReturnPickupSerializer,
    ReturnReceiptSerializer,
    ReturnRefundSerializer,
    ReturnRejectionSerializer,
    ReturnRequestCreateSerializer,
    ReturnRequestCustomerSerializer,
    ReturnRequestStaffSerializer,
    ReturnVerificationSerializer,
    StockVerificationInputSerializer,
    StorageLocationSerializer,
    SupplierSerializer,
    WarehouseSerializer,
)
from .services import (
    approve_return_request,
    cancel_return_request,
    complete_return_refund,
    inspect_inventory_batch,
    mark_return_picked_up,
    receive_return_request,
    record_inventory_change,
    reject_return_request,
    schedule_return_pickup,
    transition_purchase_order,
    verify_inventory_count,
    verify_return_request,
)


class SupplierViewSet(viewsets.ModelViewSet):
    http_method_names = ("get", "post", "put", "patch", "head", "options")
    permission_classes = (IsOperationsStaff,)
    serializer_class = SupplierSerializer
    queryset = Supplier.objects.all()
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = (
        "code",
        "company_name",
        "contact_name",
        "email",
        "primary_phone",
        "pharmacy_license_number",
    )
    ordering_fields = ("code", "company_name", "rating", "created_at", "updated_at")
    ordering = ("company_name", "code")

    def get_queryset(self):
        queryset = super().get_queryset()
        for field in ("is_active", "is_verified"):
            value = self.request.query_params.get(field)
            if value is not None:
                normalized = value.strip().lower()
                if normalized in {"true", "1"}:
                    queryset = queryset.filter(**{field: True})
                elif normalized in {"false", "0"}:
                    queryset = queryset.filter(**{field: False})
        return queryset


class PharmacyBranchOperationsViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = (IsOperationsStaff,)
    serializer_class = PharmacyBranchOperationsSerializer
    pagination_class = None
    queryset = PharmacyBranch.objects.select_related("pharmacy").order_by("name")


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    http_method_names = ("get", "post", "put", "patch", "head", "options")
    permission_classes = (IsOperationsStaff,)
    serializer_class = PurchaseOrderSerializer
    queryset = PurchaseOrder.objects.all()
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = (
        "purchase_order_number",
        "invoice_number",
        "supplier__code",
        "supplier__company_name",
        "ordered_by__email",
    )
    ordering_fields = (
        "created_at",
        "updated_at",
        "expected_delivery_on",
        "received_delivery_on",
        "net_total",
    )
    ordering = ("-created_at",)

    def get_queryset(self):
        queryset = (
            super()
            .get_queryset()
            .select_related(
                "supplier",
                "branch",
                "ordered_by",
                "approved_by",
                "received_by",
            )
            .prefetch_related("items__medicine", "status_history__changed_by")
        )
        for field in ("status", "payment_status", "supplier", "branch"):
            value = self.request.query_params.get(field)
            if value:
                queryset = queryset.filter(**{field: value})
        return queryset

    def _transition(self, request, purchase_order, new_status):
        note = str(request.data.get("note", "")).strip()
        updated = transition_purchase_order(
            purchase_order=purchase_order,
            new_status=new_status,
            actor=request.user,
            note=note,
        )
        return response.Response(self.get_serializer(updated).data)

    @action(detail=True, methods=("post",))
    def submit(self, request, pk=None):
        return self._transition(
            request,
            self.get_object(),
            PurchaseOrder.Status.SUBMITTED,
        )

    @action(detail=True, methods=("post",))
    def approve(self, request, pk=None):
        return self._transition(
            request,
            self.get_object(),
            PurchaseOrder.Status.APPROVED,
        )

    @action(detail=True, methods=("post",))
    def cancel(self, request, pk=None):
        return self._transition(
            request,
            self.get_object(),
            PurchaseOrder.Status.CANCELLED,
        )

    @action(detail=True, methods=("post",))
    def receive(self, request, pk=None):
        purchase_order = self.get_object()
        serializer = PurchaseReceiptSerializer(
            data=request.data,
            context={
                "request": request,
                "purchase_order": purchase_order,
            },
        )
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        return response.Response(
            self.get_serializer(updated).data,
            status=status.HTTP_200_OK,
        )


class WarehouseViewSet(viewsets.ModelViewSet):
    http_method_names = ("get", "post", "put", "patch", "head", "options")
    permission_classes = (IsOperationsStaff,)
    serializer_class = WarehouseSerializer
    queryset = Warehouse.objects.select_related("branch").annotate(
        location_count=Count("locations", distinct=True),
        stock_quantity=Coalesce(Sum("locations__batches__available_quantity"), 0),
    )
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ("code", "name", "branch__name", "address")
    ordering_fields = ("code", "name", "created_at")
    ordering = ("branch__name", "code")

    def get_queryset(self):
        queryset = super().get_queryset()
        branch = self.request.query_params.get("branch")
        is_active = self.request.query_params.get("is_active")
        if branch:
            queryset = queryset.filter(branch=branch)
        if is_active and is_active.lower() in {"true", "false"}:
            queryset = queryset.filter(is_active=is_active.lower() == "true")
        return queryset


class StorageLocationViewSet(viewsets.ModelViewSet):
    http_method_names = ("get", "post", "put", "patch", "head", "options")
    permission_classes = (IsOperationsStaff,)
    serializer_class = StorageLocationSerializer
    queryset = StorageLocation.objects.select_related(
        "warehouse", "warehouse__branch"
    ).annotate(
        batch_count=Count("batches", distinct=True),
        stock_quantity=Coalesce(Sum("batches__available_quantity"), 0),
    )
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ("code", "name", "rack", "shelf", "warehouse__code")
    ordering_fields = ("code", "rack", "shelf", "created_at")
    ordering = ("warehouse__code", "rack", "shelf")

    def get_queryset(self):
        queryset = super().get_queryset()
        warehouse = self.request.query_params.get("warehouse")
        branch = self.request.query_params.get("branch")
        if warehouse:
            queryset = queryset.filter(warehouse=warehouse)
        if branch:
            queryset = queryset.filter(warehouse__branch=branch)
        is_active = self.request.query_params.get("is_active")
        if is_active and is_active.lower() in {"true", "false"}:
            queryset = queryset.filter(is_active=is_active.lower() == "true")
        return queryset


class InventoryBatchOperationsViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = (IsOperationsStaff,)
    serializer_class = InventoryBatchOperationsSerializer
    queryset = InventoryBatch.objects.all()
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ("batch_number", "medicine__sku", "medicine__brand_name")
    ordering_fields = ("expiry_date", "available_quantity", "created_at", "updated_at")
    ordering = ("expiry_date", "created_at")

    def get_queryset(self):
        queryset = (
            super()
            .get_queryset()
            .select_related(
                "medicine",
                "branch",
                "storage_location",
                "inspected_by",
                "verified_by",
            )
            .prefetch_related("quality_inspections__inspected_by")
        )
        for field in ("branch", "storage_location", "quality_status", "is_active"):
            value = self.request.query_params.get(field)
            if value:
                queryset = queryset.filter(**{field: value})
        warehouse = self.request.query_params.get("warehouse")
        if warehouse:
            queryset = queryset.filter(storage_location__warehouse=warehouse)
        expiry_before = self.request.query_params.get("expiry_before")
        if expiry_before:
            queryset = queryset.filter(expiry_date__lte=expiry_before)
        stock = self.request.query_params.get("stock")
        if stock == "out":
            queryset = queryset.filter(available_quantity=0)
        elif stock == "low":
            queryset = queryset.filter(available_quantity__gt=0, available_quantity__lte=10)
        elif stock == "available":
            queryset = queryset.filter(available_quantity__gt=0)
        expiry = self.request.query_params.get("expiry")
        if expiry == "expired":
            queryset = queryset.filter(expiry_date__lte=timezone.localdate())
        return queryset

    @action(detail=True, methods=("post",))
    def inspect(self, request, pk=None):
        serializer = QualityInspectionInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        inspect_inventory_batch(
            batch=self.get_object(),
            decision=serializer.validated_data["decision"],
            actor=request.user,
            notes=serializer.validated_data.get("notes", ""),
        )
        return response.Response(self.get_serializer(self.get_object()).data)

    @action(detail=True, methods=("post",))
    def verify(self, request, pk=None):
        serializer = StockVerificationInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        inventory_transaction = verify_inventory_count(
            batch=self.get_object(),
            physical_quantity=serializer.validated_data["physical_quantity"],
            actor=request.user,
            notes=serializer.validated_data.get("notes", ""),
        )
        return response.Response(InventoryTransactionSerializer(inventory_transaction).data)

    @action(detail=True, methods=("post",))
    def adjust(self, request, pk=None):
        serializer = InventoryAdjustmentInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        inventory_transaction = record_inventory_change(
            batch=self.get_object(),
            actor=request.user,
            **serializer.validated_data,
        )
        return response.Response(
            InventoryTransactionSerializer(inventory_transaction).data,
            status=status.HTTP_201_CREATED,
        )


class InventoryTransactionViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = (IsOperationsStaff,)
    serializer_class = InventoryTransactionSerializer
    queryset = InventoryTransaction.objects.all()
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = (
        "batch__batch_number",
        "batch__medicine__sku",
        "batch__medicine__brand_name",
        "reference",
        "performed_by__email",
    )
    ordering_fields = ("created_at", "quantity")
    ordering = ("-created_at",)

    def get_queryset(self):
        queryset = (
            super()
            .get_queryset()
            .select_related(
                "batch",
                "batch__medicine",
                "performed_by",
                "verified_by",
                "purchase_order",
                "order",
            )
        )
        for field in (
            "batch",
            "transaction_type",
            "direction",
            "purchase_order",
            "order",
        ):
            value = self.request.query_params.get(field)
            if value:
                queryset = queryset.filter(**{field: value})
        return queryset


class ReturnRequestViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ReturnRequestCustomerSerializer
    queryset = ReturnRequest.objects.none()

    def get_queryset(self):
        return (
            ReturnRequest.objects.filter(customer=self.request.user)
            .select_related("order")
            .prefetch_related(
                "items__order_item",
                "status_history__changed_by",
            )
        )

    def create(self, request, *args, **kwargs):
        input_serializer = ReturnRequestCreateSerializer(
            data=request.data,
            context={"request": request},
        )
        input_serializer.is_valid(raise_exception=True)
        return_request = input_serializer.save()
        return response.Response(
            self.get_serializer(return_request).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=("post",))
    def cancel(self, request, pk=None):
        updated = cancel_return_request(
            return_request=self.get_object(),
            customer=request.user,
        )
        return response.Response(self.get_serializer(updated).data)


class StaffReturnRequestViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = (IsOperationsStaff,)
    serializer_class = ReturnRequestStaffSerializer
    queryset = ReturnRequest.objects.all()
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = (
        "return_number",
        "order__order_number",
        "customer__email",
        "customer__phone",
        "reason",
        "refund_reference",
    )
    ordering_fields = ("created_at", "updated_at", "approved_refund_amount")
    ordering = ("-created_at",)

    def get_queryset(self):
        queryset = (
            super()
            .get_queryset()
            .select_related(
                "order",
                "customer",
                "approved_by",
                "received_by",
                "verified_by",
                "refund_processed_by",
            )
            .prefetch_related(
                "items__order_item",
                "status_history__changed_by",
                "inventory_transactions__batch",
            )
        )
        for field in ("status", "refund_status", "pickup_status", "customer"):
            value = self.request.query_params.get(field)
            if value:
                queryset = queryset.filter(**{field: value})
        return queryset

    @action(detail=True, methods=("post",))
    def approve(self, request, pk=None):
        serializer = ReturnApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = approve_return_request(
            return_request=self.get_object(),
            approved_items=serializer.validated_data["items"],
            actor=request.user,
            note=serializer.validated_data.get("note", ""),
        )
        return response.Response(self.get_serializer(updated).data)

    @action(detail=True, methods=("post",))
    def reject(self, request, pk=None):
        serializer = ReturnRejectionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = reject_return_request(
            return_request=self.get_object(),
            actor=request.user,
            note=serializer.validated_data["note"],
        )
        return response.Response(self.get_serializer(updated).data)

    @action(detail=True, methods=("post",), url_path="schedule-pickup")
    def schedule_pickup(self, request, pk=None):
        serializer = ReturnPickupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = schedule_return_pickup(
            return_request=self.get_object(),
            scheduled_at=serializer.validated_data["scheduled_at"],
            actor=request.user,
            note=serializer.validated_data.get("note", ""),
        )
        return response.Response(self.get_serializer(updated).data)

    @action(detail=True, methods=("post",), url_path="mark-picked-up")
    def mark_picked_up(self, request, pk=None):
        serializer = ReturnNoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = mark_return_picked_up(
            return_request=self.get_object(),
            actor=request.user,
            note=serializer.validated_data.get("note", ""),
        )
        return response.Response(self.get_serializer(updated).data)

    @action(detail=True, methods=("post",))
    def receive(self, request, pk=None):
        serializer = ReturnReceiptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = receive_return_request(
            return_request=self.get_object(),
            received_items=serializer.validated_data["items"],
            actor=request.user,
            note=serializer.validated_data.get("note", ""),
        )
        return response.Response(self.get_serializer(updated).data)

    @action(detail=True, methods=("post",))
    def verify(self, request, pk=None):
        serializer = ReturnVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = verify_return_request(
            return_request=self.get_object(),
            verified_items=serializer.validated_data["items"],
            actor=request.user,
            note=serializer.validated_data.get("note", ""),
        )
        return response.Response(self.get_serializer(updated).data)

    @action(detail=True, methods=("post",), url_path="complete-refund")
    def complete_refund(self, request, pk=None):
        serializer = ReturnRefundSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = complete_return_refund(
            return_request=self.get_object(),
            actor=request.user,
            reference=serializer.validated_data["reference"],
            note=serializer.validated_data.get("note", ""),
        )
        return response.Response(self.get_serializer(updated).data)
