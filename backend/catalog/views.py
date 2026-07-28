import hashlib
import mimetypes
from uuid import UUID

from django.conf import settings
from django.db.models import Q
from django.http import FileResponse, HttpResponseNotModified
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser

from accounts.models import User

from .models import Category, Medicine, MedicineImage, RecordStatus
from .serializers import CategorySerializer, MedicineImageSerializer, MedicineSerializer


class CanManageMedicineImages(permissions.BasePermission):
    message = "Only pharmacy staff can manage medicine images."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_staff or user.role in {User.Role.STAFF, User.Role.ADMIN})
        )


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
                | Q(brand_name_dari__icontains=search)
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


class MedicineImageViewSet(viewsets.ModelViewSet):
    serializer_class = MedicineImageSerializer
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = (CanManageMedicineImages,)
    queryset = MedicineImage.objects.select_related("medicine")
    pagination_class = None

    def get_permissions(self):
        if self.action == "content":
            return [permissions.AllowAny()]
        return super().get_permissions()

    @action(detail=True, methods=("get",), url_path="content")
    def content(self, request, pk=None):
        instance = self.get_object()
        if not instance.image:
            fallback = settings.BASE_DIR / "static" / "medicine-fallback.svg"
            return FileResponse(
                fallback.open("rb"),
                content_type="image/svg+xml",
            )

        storage = instance.image.storage
        size = storage.size(instance.image.name)
        etag = hashlib.sha256(
            f"{instance.pk}:{instance.updated_at.timestamp()}:{size}".encode()
        ).hexdigest()
        if request.headers.get("If-None-Match", "").strip('"') == etag:
            return HttpResponseNotModified()

        content_type = mimetypes.guess_type(instance.image.name)[0] or "application/octet-stream"
        response = FileResponse(storage.open(instance.image.name, "rb"), content_type=content_type)
        response["Cache-Control"] = "public, max-age=3600, stale-while-revalidate=86400"
        response["ETag"] = f'"{etag}"'
        response["X-Content-Type-Options"] = "nosniff"
        return response

    def perform_destroy(self, instance):
        medicine = instance.medicine
        was_primary = instance.is_primary
        image = instance.image
        super().perform_destroy(instance)
        if image:
            image.storage.delete(image.name)
        if was_primary:
            replacement = medicine.images.order_by("created_at").first()
            if replacement:
                replacement.is_primary = True
                replacement.save(update_fields=("is_primary", "updated_at"))
