from django.db import transaction
from django.urls import reverse
from django.utils import timezone
from rest_framework import serializers

from .models import Category, DosageForm, Manufacturer, Medicine, MedicineImage


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "name_dari", "slug", "parent_id")


class NamedSerializer(serializers.ModelSerializer):
    class Meta:
        fields = ("id", "name")


class ManufacturerSerializer(NamedSerializer):
    class Meta(NamedSerializer.Meta):
        model = Manufacturer


class DosageFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = DosageForm
        fields = ("id", "code", "name", "name_dari")


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
            "generic_name",
            "manufacturer",
            "category",
            "dosage_form",
            "strength",
            "pack_size",
            "description",
            "description_dari",
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
                    is_active=True,
                    expiry_date__gt=timezone.localdate(),
                    available_quantity__gt=0,
                    branch__status="ACTIVE",
                ).order_by("expiry_date")
            )
            obj._eligible_batch_cache = cache
        return cache

    def get_price(self, obj) -> str | None:
        batches = self.eligible_batches(obj)
        return f"{batches[0].selling_price:.2f}" if batches else None

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
