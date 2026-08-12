import hashlib
import mimetypes
from decimal import Decimal, InvalidOperation
from uuid import UUID

from django.conf import settings
from django.db.models import Exists, OuterRef, Q, Subquery
from django.http import FileResponse, HttpResponseNotModified
from django.utils import timezone
from rest_framework import filters, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from accounts.models import User
from operations.permissions import IsOperationsStaff

from .models import (
    Category,
    DosageForm,
    InventoryBatch,
    Manufacturer,
    Medicine,
    MedicineImage,
    RecordStatus,
)
from .serializers import (
    CategorySerializer,
    DosageFormSerializer,
    ManufacturerSerializer,
    MedicineImageSerializer,
    MedicineSerializer,
    StaffCategorySerializer,
    StaffMedicineSerializer,
)


class CanManageMedicineImages(permissions.BasePermission):
    message = "Only pharmacy staff can manage medicine images."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (
                user.is_staff
                or user.role in {User.Role.STAFF, User.Role.PHARMACIST, User.Role.ADMIN}
            )
        )


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]
    pagination_class = None
    serializer_class = CategorySerializer
    queryset = Category.objects.filter(status=RecordStatus.ACTIVE).select_related("parent")

    @action(detail=True, methods=("get",), url_path="image")
    def image(self, request, pk=None):
        instance = self.get_object()
        if not instance.image:
            fallback = settings.BASE_DIR / "static" / "medicine-fallback.svg"
            return FileResponse(fallback.open("rb"), content_type="image/svg+xml")
        content_type = mimetypes.guess_type(instance.image.name)[0] or "application/octet-stream"
        response = FileResponse(instance.image.open("rb"), content_type=content_type)
        response["Cache-Control"] = "public, max-age=3600, stale-while-revalidate=86400"
        response["X-Content-Type-Options"] = "nosniff"
        return response


class StaffCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = StaffCategorySerializer
    permission_classes = (IsOperationsStaff,)
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ("name", "name_dari", "slug")
    ordering_fields = ("display_order", "name", "created_at", "updated_at")
    ordering = ("display_order", "name")
    queryset = Category.objects.select_related("parent").all()

    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.query_params.get("status", "").strip()
        return queryset.filter(status=status) if status else queryset

    @action(detail=True, methods=("get",), url_path="image")
    def image(self, request, pk=None):
        instance = self.get_object()
        if not instance.image:
            fallback = settings.BASE_DIR / "static" / "medicine-fallback.svg"
            return FileResponse(fallback.open("rb"), content_type="image/svg+xml")
        content_type = mimetypes.guess_type(instance.image.name)[0] or "application/octet-stream"
        return FileResponse(instance.image.open("rb"), content_type=content_type)

    def perform_destroy(self, instance):
        image = instance.image
        if instance.children.exists() or instance.medicines.exists():
            raise ValidationError("Deactivate categories that are already in use.")
        super().perform_destroy(instance)
        if image:
            image.storage.delete(image.name)


class ManufacturerViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]
    pagination_class = None
    serializer_class = ManufacturerSerializer
    queryset = Manufacturer.objects.order_by("name")


class DosageFormViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]
    pagination_class = None
    serializer_class = DosageFormSerializer
    queryset = DosageForm.objects.order_by("name")


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

        manufacturer = self.request.query_params.get("manufacturer", "").strip()
        if manufacturer:
            try:
                manufacturer_id = UUID(manufacturer)
            except ValueError:
                queryset = queryset.filter(manufacturer__name__iexact=manufacturer)
            else:
                queryset = queryset.filter(manufacturer_id=manufacturer_id)

        prescription_required = self.request.query_params.get("prescription_required", "").strip()
        if prescription_required:
            queryset = queryset.filter(
                prescription_required=self._boolean_parameter(
                    "prescription_required", prescription_required
                )
            )

        eligible_batches = InventoryBatch.objects.filter(
            medicine=OuterRef("pk"),
            is_active=True,
            quality_status=InventoryBatch.QualityStatus.APPROVED,
            expiry_date__gt=timezone.localdate(),
            available_quantity__gt=0,
            branch__status="ACTIVE",
        )
        current_price = eligible_batches.order_by("expiry_date", "created_at").values(
            "selling_price"
        )[:1]
        queryset = queryset.annotate(
            catalogue_in_stock=Exists(eligible_batches),
            catalogue_price=Subquery(current_price),
        )

        in_stock = self.request.query_params.get("in_stock", "").strip()
        if in_stock:
            queryset = queryset.filter(
                catalogue_in_stock=self._boolean_parameter("in_stock", in_stock)
            )

        minimum = self._decimal_parameter("min_price")
        maximum = self._decimal_parameter("max_price")
        if minimum is not None and maximum is not None and minimum > maximum:
            raise ValidationError({"max_price": "Must be greater than or equal to min_price."})
        if minimum is not None:
            queryset = queryset.filter(catalogue_price__gte=minimum)
        if maximum is not None:
            queryset = queryset.filter(catalogue_price__lte=maximum)

        ordering = self.request.query_params.get("ordering", "name").strip()
        ordering_fields = {
            "name": "brand_name",
            "-name": "-brand_name",
            "price": "catalogue_price",
            "-price": "-catalogue_price",
        }
        if ordering not in ordering_fields:
            raise ValidationError({"ordering": "Use name, -name, price, or -price."})
        return queryset.order_by(ordering_fields[ordering], "id")

    def _boolean_parameter(self, name, value):
        normalized = value.lower()
        if normalized not in {"true", "false"}:
            raise ValidationError({name: "Use true or false."})
        return normalized == "true"

    def _decimal_parameter(self, name):
        value = self.request.query_params.get(name, "").strip()
        if not value:
            return None
        try:
            parsed = Decimal(value)
        except InvalidOperation as exc:
            raise ValidationError({name: "Enter a valid non-negative price."}) from exc
        if not parsed.is_finite() or parsed < 0:
            raise ValidationError({name: "Enter a valid non-negative price."})
        return parsed


class StaffMedicineViewSet(MedicineViewSet, viewsets.ModelViewSet):
    permission_classes = (IsOperationsStaff,)
    serializer_class = StaffMedicineSerializer
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ("brand_name", "brand_name_dari", "generic_name", "sku", "barcode")
    ordering_fields = ("brand_name", "sku", "created_at", "updated_at")
    ordering = ("brand_name",)
    http_method_names = ("get", "post", "patch", "put", "head", "options")
    queryset = (
        Medicine.objects.select_related("manufacturer", "category", "dosage_form")
        .prefetch_related("images", "batches__branch")
        .all()
    )

    def get_queryset(self):
        queryset = self.queryset
        status = self.request.query_params.get("status", "").strip()
        prescription_required = self.request.query_params.get("prescription_required", "").strip()
        if status:
            queryset = queryset.filter(status=status)
        if prescription_required:
            queryset = queryset.filter(
                prescription_required=self._boolean_parameter(
                    "prescription_required", prescription_required
                )
            )
        search = self.request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                Q(brand_name__icontains=search)
                | Q(brand_name_dari__icontains=search)
                | Q(generic_name__icontains=search)
                | Q(sku__icontains=search)
                | Q(barcode__icontains=search)
            )
        ordering = self.request.query_params.get("ordering", "brand_name").strip()
        allowed = {
            "brand_name",
            "-brand_name",
            "sku",
            "-sku",
            "created_at",
            "-created_at",
            "updated_at",
            "-updated_at",
        }
        if ordering not in allowed:
            raise ValidationError({"ordering": "Select a supported medicine ordering."})
        return queryset.order_by(ordering, "id")


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
