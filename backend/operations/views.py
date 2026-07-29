from rest_framework import filters, viewsets

from .models import Supplier
from .permissions import IsOperationsStaff
from .serializers import SupplierSerializer


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
