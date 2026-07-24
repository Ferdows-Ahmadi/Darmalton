from uuid import UUID

from django.db.models import Q
from rest_framework import permissions, viewsets

from .models import Category, Medicine, RecordStatus
from .serializers import CategorySerializer, MedicineSerializer


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]
    pagination_class = None
    serializer_class = CategorySerializer
    queryset = Category.objects.filter(status=RecordStatus.ACTIVE).select_related("parent")


class MedicineViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = MedicineSerializer
    queryset = (
        Medicine.objects.filter(status=Medicine.Status.ACTIVE)
        .select_related("manufacturer", "category", "dosage_form")
        .prefetch_related("images", "batches__branch")
    )

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get("search", "").strip()
        category = self.request.query_params.get("category", "").strip()
        if search:
            queryset = queryset.filter(
                Q(brand_name__icontains=search)
                | Q(generic_name__icontains=search)
                | Q(sku__icontains=search)
            )
        if category:
            try:
                category_id = UUID(category)
            except ValueError:
                queryset = queryset.filter(category__slug=category)
            else:
                queryset = queryset.filter(category_id=category_id)
        return queryset
