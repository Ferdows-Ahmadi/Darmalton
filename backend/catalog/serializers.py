from django.db import transaction
from django.db.models import Q
from django.urls import reverse
from django.utils import timezone
from rest_framework import serializers

from .models import (
    Category,
    DosageForm,
    InventoryBatch,
    Manufacturer,
    Medicine,
    MedicineImage,
    MedicineImportJob,
)


class CategorySerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = (
            "id",
            "name",
            "name_dari",
            "name_pashto",
            "slug",
            "parent_id",
            "image_url",
            "display_order",
        )

    def get_image_url(self, obj: Category) -> str:
        if not obj.image:
            return ""
        view = self.context.get("view")
        basename = getattr(view, "basename", "category")
        route = "staff-category-image" if basename == "staff-category" else "category-image"
        path = reverse(route, kwargs={"pk": obj.pk})
        request = self.context.get("request")
        return request.build_absolute_uri(path) if request else path


class StaffCategorySerializer(CategorySerializer):
    class Meta(CategorySerializer.Meta):
        fields = CategorySerializer.Meta.fields + ("image", "status", "created_at", "updated_at")
        extra_kwargs = {"image": {"write_only": True, "required": False}}
        read_only_fields = ("id", "image_url", "created_at", "updated_at")

    def update(self, instance, validated_data):
        old_image = instance.image
        replacing = "image" in validated_data
        updated = super().update(instance, validated_data)
        if replacing and old_image and old_image.name != updated.image.name:
            old_image.storage.delete(old_image.name)
        return updated


class NamedSerializer(serializers.ModelSerializer):
    class Meta:
        fields = ("id", "name")


class ManufacturerSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()
    product_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Manufacturer
        fields = (
            "id",
            "name",
            "name_dari",
            "name_pashto",
            "country_code",
            "website",
            "logo_url",
            "display_order",
            "product_count",
        )

    def get_logo_url(self, obj: Manufacturer) -> str:
        if not obj.logo:
            return ""
        view = self.context.get("view")
        basename = getattr(view, "basename", "manufacturer")
        route = (
            "staff-manufacturer-logo" if basename == "staff-manufacturer" else "manufacturer-logo"
        )
        path = reverse(route, kwargs={"pk": obj.pk})
        request = self.context.get("request")
        return request.build_absolute_uri(path) if request else path


class StaffManufacturerSerializer(ManufacturerSerializer):
    class Meta(ManufacturerSerializer.Meta):
        fields = ManufacturerSerializer.Meta.fields + (
            "logo",
            "status",
            "created_at",
            "updated_at",
        )
        extra_kwargs = {"logo": {"write_only": True, "required": False}}
        read_only_fields = ("id", "logo_url", "created_at", "updated_at")

    def validate_country_code(self, value):
        normalized = value.strip().upper()
        if normalized and (len(normalized) != 2 or not normalized.isalpha()):
            raise serializers.ValidationError("Use a two-letter country code.")
        return normalized

    def update(self, instance, validated_data):
        old_logo = instance.logo
        replacing = "logo" in validated_data
        updated = super().update(instance, validated_data)
        if replacing and old_logo and old_logo.name != updated.logo.name:
            old_logo.storage.delete(old_logo.name)
        return updated


class DosageFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = DosageForm
        fields = ("id", "code", "name", "name_dari", "name_pashto")


class MedicineImageSerializer(serializers.ModelSerializer):
    medicine_id = serializers.PrimaryKeyRelatedField(
        source="medicine",
        queryset=Medicine.objects.all(),
    )
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = MedicineImage
        fields = (
            "id",
            "medicine_id",
            "image",
            "image_url",
            "alt_text",
            "is_primary",
            "created_at",
            "updated_at",
        )
        extra_kwargs = {"image": {"write_only": True}}
        read_only_fields = ("id", "image_url", "created_at", "updated_at")

    def get_image_url(self, obj) -> str:
        path = reverse("medicine-image-content", kwargs={"pk": obj.pk})
        request = self.context.get("request")
        return request.build_absolute_uri(path) if request else path

    def validate_image(self, value):
        if getattr(value, "content_type", "") not in {
            "image/jpeg",
            "image/png",
            "image/webp",
        }:
            raise serializers.ValidationError("Upload a JPEG, PNG, or WebP image.")
        return value

    def validate(self, attrs):
        if self.instance is None and not attrs.get("image"):
            raise serializers.ValidationError({"image": "A medicine image is required."})
        if (
            self.instance is not None
            and self.instance.is_primary
            and attrs.get("is_primary") is False
        ):
            raise serializers.ValidationError(
                {"is_primary": "Select another primary image before unsetting this one."}
            )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        medicine = Medicine.objects.select_for_update().get(pk=validated_data["medicine"].pk)
        validated_data["medicine"] = medicine
        if validated_data.get("is_primary") or not medicine.images.exists():
            medicine.images.filter(is_primary=True).update(is_primary=False)
            validated_data["is_primary"] = True
        return super().create(validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        Medicine.objects.select_for_update().get(pk=instance.medicine_id)
        old_image = instance.image
        replacing_image = "image" in validated_data
        if validated_data.get("is_primary"):
            instance.medicine.images.exclude(pk=instance.pk).filter(is_primary=True).update(
                is_primary=False
            )
        updated = super().update(instance, validated_data)
        if replacing_image and old_image and old_image.name != updated.image.name:
            old_image.storage.delete(old_image.name)
        return updated


class MedicineSerializer(serializers.ModelSerializer):
    manufacturer = ManufacturerSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    dosage_form = DosageFormSerializer(read_only=True)
    image_url = serializers.SerializerMethodField()
    images = MedicineImageSerializer(many=True, read_only=True)
    price = serializers.SerializerMethodField()
    available_quantity = serializers.SerializerMethodField()
    in_stock = serializers.SerializerMethodField()

    class Meta:
        model = Medicine
        fields = (
            "id",
            "sku",
            "brand_name",
            "brand_name_dari",
            "brand_name_pashto",
            "generic_name",
            "generic_name_dari",
            "generic_name_pashto",
            "manufacturer",
            "category",
            "dosage_form",
            "strength",
            "pack_size",
            "description",
            "description_dari",
            "description_pashto",
            "storage_instructions",
            "family_code",
            "shopper_category",
            "prescription_required",
            "image_url",
            "images",
            "price",
            "available_quantity",
            "in_stock",
        )

    def eligible_batches(self, obj):
        cache = getattr(obj, "_eligible_batch_cache", None)
        if cache is None:
            cache = list(
                obj.batches.filter(
                    Q(selling_price__isnull=False) | Q(medicine__list_price__isnull=False),
                    is_active=True,
                    quality_status=InventoryBatch.QualityStatus.APPROVED,
                    expiry_date__gt=timezone.localdate(),
                    available_quantity__gt=0,
                    branch__status="ACTIVE",
                ).order_by("expiry_date")
            )
            obj._eligible_batch_cache = cache
        return cache

    def get_price(self, obj) -> str | None:
        batches = self.eligible_batches(obj)
        value = batches[0].selling_price if batches else None
        value = value if value is not None else obj.list_price
        return f"{value:.2f}" if value is not None else None

    def get_available_quantity(self, obj) -> int:
        return sum(batch.available_quantity for batch in self.eligible_batches(obj))

    def get_in_stock(self, obj) -> bool:
        return bool(self.eligible_batches(obj))

    def get_image_url(self, obj) -> str:
        primary = obj.images.first()
        if primary and primary.image:
            return MedicineImageSerializer(primary, context=self.context).data["image_url"]
        request = self.context.get("request")
        path = "/static/medicine-fallback.svg"
        return request.build_absolute_uri(path) if request else path


class StaffMedicineSerializer(MedicineSerializer):
    manufacturer_id = serializers.PrimaryKeyRelatedField(
        source="manufacturer",
        queryset=Manufacturer.objects.all(),
        allow_null=True,
        required=False,
    )
    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        queryset=Category.objects.all(),
        allow_null=True,
        required=False,
    )
    dosage_form_id = serializers.PrimaryKeyRelatedField(
        source="dosage_form",
        queryset=DosageForm.objects.all(),
    )

    class Meta(MedicineSerializer.Meta):
        fields = MedicineSerializer.Meta.fields + (
            "manufacturer_id",
            "category_id",
            "dosage_form_id",
            "barcode",
            "status",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "manufacturer",
            "category",
            "dosage_form",
            "image_url",
            "images",
            "price",
            "available_quantity",
            "in_stock",
            "created_at",
            "updated_at",
        )


class MedicineImportJobSerializer(serializers.ModelSerializer):
    uploaded_by_email = serializers.EmailField(source="uploaded_by.email", read_only=True)

    class Meta:
        model = MedicineImportJob
        fields = (
            "id",
            "original_filename",
            "mode",
            "status",
            "validation_report",
            "result_report",
            "uploaded_by_email",
            "confirmed_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
