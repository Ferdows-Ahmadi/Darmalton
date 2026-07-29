from rest_framework import filters, mixins, response, status, viewsets
from rest_framework.decorators import action

from catalog.models import InventoryBatch

from .models import (
    InventoryTransaction,
    PurchaseOrder,
    StorageLocation,
    Supplier,
    Warehouse,
)
from .permissions import IsOperationsStaff
from .serializers import (
    InventoryAdjustmentInputSerializer,
    InventoryBatchOperationsSerializer,
    InventoryTransactionSerializer,
    PurchaseOrderSerializer,
    PurchaseReceiptSerializer,
    QualityInspectionInputSerializer,
    StockVerificationInputSerializer,
    StorageLocationSerializer,
    SupplierSerializer,
    WarehouseSerializer,
)
from .services import (
    inspect_inventory_batch,
    record_inventory_change,
    transition_purchase_order,
    verify_inventory_count,
)


class SupplierViewSet(viewsets.ModelViewSet):
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


class PurchaseOrderViewSet(viewsets.ModelViewSet):
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
    permission_classes = (IsOperationsStaff,)
    serializer_class = WarehouseSerializer
    queryset = Warehouse.objects.select_related("branch")
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
    permission_classes = (IsOperationsStaff,)
    serializer_class = StorageLocationSerializer
    queryset = StorageLocation.objects.select_related("warehouse", "warehouse__branch")
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
