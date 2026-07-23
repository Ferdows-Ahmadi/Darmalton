from django.utils import timezone
from rest_framework import serializers

from .models import Category, DosageForm, Manufacturer, Medicine


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "parent_id")


class NamedSerializer(serializers.ModelSerializer):
    class Meta:
        fields = ("id", "name")


class ManufacturerSerializer(NamedSerializer):
    class Meta(NamedSerializer.Meta):
        model = Manufacturer


class DosageFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = DosageForm
        fields = ("id", "code", "name")


class MedicineSerializer(serializers.ModelSerializer):
    manufacturer = ManufacturerSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    dosage_form = DosageFormSerializer(read_only=True)
    image_url = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    available_quantity = serializers.SerializerMethodField()
    in_stock = serializers.SerializerMethodField()

    class Meta:
        model = Medicine
        fields = (
            "id",
            "sku",
            "brand_name",
            "generic_name",
            "manufacturer",
            "category",
            "dosage_form",
            "strength",
            "pack_size",
            "description",
            "prescription_required",
            "image_url",
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
            request = self.context.get("request")
            return request.build_absolute_uri(primary.image.url) if request else primary.image.url
        request = self.context.get("request")
        path = "/static/medicine-placeholder.svg"
        return request.build_absolute_uri(path) if request else path
