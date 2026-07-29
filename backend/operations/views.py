from rest_framework import filters, response, viewsets
from rest_framework.decorators import action

from .models import PurchaseOrder, Supplier
from .permissions import IsOperationsStaff
from .serializers import PurchaseOrderSerializer, SupplierSerializer
from .services import transition_purchase_order


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
