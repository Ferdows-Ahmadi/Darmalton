import re

from rest_framework import serializers

from .models import Supplier


class SupplierSerializer(serializers.ModelSerializer):
    code = serializers.CharField(max_length=32)

    class Meta:
        model = Supplier
        fields = (
            "id",
            "code",
            "company_name",
            "contact_name",
            "email",
            "primary_phone",
            "secondary_phone",
            "address",
            "pharmacy_license_number",
            "pharmacy_license_expires_on",
            "payment_terms_days",
            "payment_terms_notes",
            "rating",
            "is_verified",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_code(self, value):
        normalized = value.strip().upper()
        if not re.fullmatch(r"[A-Z0-9][A-Z0-9_-]*", normalized):
            raise serializers.ValidationError(
                "Use letters, numbers, hyphens, or underscores."
            )
        queryset = Supplier.objects.filter(code=normalized)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("A supplier with this code already exists.")
        return normalized

    def validate(self, attrs):
        license_number = attrs.get(
            "pharmacy_license_number",
            getattr(self.instance, "pharmacy_license_number", ""),
        )
        license_expiry = attrs.get(
            "pharmacy_license_expires_on",
            getattr(self.instance, "pharmacy_license_expires_on", None),
        )
        is_verified = attrs.get(
            "is_verified",
            getattr(self.instance, "is_verified", False),
        )
        if license_expiry and not license_number:
            raise serializers.ValidationError(
                {
                    "pharmacy_license_number": (
                        "A pharmacy license number is required when an expiry date is provided."
                    )
                }
            )
        if is_verified and not license_number:
            raise serializers.ValidationError(
                {
                    "is_verified": (
                        "A supplier cannot be verified without a pharmacy license number."
                    )
                }
            )
        return attrs
