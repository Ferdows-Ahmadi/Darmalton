import re

from rest_framework import serializers

from catalog.models import Medicine, PharmacyBranch

from .models import (
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseOrderStatusHistory,
    Supplier,
)
from .services import create_purchase_order


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


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    medicine_id = serializers.PrimaryKeyRelatedField(
        source="medicine",
        queryset=Medicine.objects.all(),
    )
    medicine_name = serializers.CharField(source="medicine.brand_name", read_only=True)

    class Meta:
        model = PurchaseOrderItem
        fields = (
            "id",
            "medicine_id",
            "medicine_name",
            "quantity_ordered",
            "quantity_received",
            "unit_cost",
            "line_total",
        )
        read_only_fields = ("id", "quantity_received", "line_total")


class PurchaseOrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_email = serializers.EmailField(source="changed_by.email", read_only=True)

    class Meta:
        model = PurchaseOrderStatusHistory
        fields = (
            "id",
            "from_status",
            "to_status",
            "changed_by_email",
            "note",
            "created_at",
        )


class PurchaseOrderSerializer(serializers.ModelSerializer):
    supplier = SupplierSerializer(read_only=True)
    supplier_id = serializers.PrimaryKeyRelatedField(
        source="supplier",
        queryset=Supplier.objects.all(),
        write_only=True,
    )
    branch_id = serializers.PrimaryKeyRelatedField(
        source="branch",
        queryset=PharmacyBranch.objects.all(),
    )
    ordered_by_id = serializers.UUIDField(source="ordered_by.id", read_only=True)
    approved_by_id = serializers.UUIDField(
        source="approved_by.id",
        allow_null=True,
        read_only=True,
    )
    received_by_id = serializers.UUIDField(
        source="received_by.id",
        allow_null=True,
        read_only=True,
    )
    items = PurchaseOrderItemSerializer(many=True)
    status_history = PurchaseOrderStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = (
            "id",
            "purchase_order_number",
            "supplier",
            "supplier_id",
            "branch_id",
            "ordered_by_id",
            "approved_by_id",
            "received_by_id",
            "status",
            "payment_status",
            "expected_delivery_on",
            "received_delivery_on",
            "invoice_number",
            "currency_code",
            "subtotal",
            "discount_total",
            "net_total",
            "payment_due_on",
            "payment_paid_on",
            "notes",
            "terms",
            "submitted_at",
            "approved_at",
            "items",
            "status_history",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "purchase_order_number",
            "ordered_by_id",
            "approved_by_id",
            "received_by_id",
            "status",
            "received_delivery_on",
            "subtotal",
            "net_total",
            "submitted_at",
            "approved_at",
            "status_history",
            "created_at",
            "updated_at",
        )

    def validate(self, attrs):
        instance = self.instance
        if instance and instance.status != PurchaseOrder.Status.DRAFT:
            immutable = {
                "supplier",
                "branch",
                "expected_delivery_on",
                "discount_total",
                "items",
            }
            attempted = immutable.intersection(attrs)
            if attempted:
                raise serializers.ValidationError(
                    "Supplier, branch, delivery, totals, and items are immutable after submission."
                )
        if attrs.get("payment_status") == PurchaseOrder.PaymentStatus.PAID and not attrs.get(
            "payment_paid_on",
            getattr(instance, "payment_paid_on", None),
        ):
            raise serializers.ValidationError(
                {"payment_paid_on": "Record the payment date when marking an order paid."}
            )
        return attrs

    def create(self, validated_data):
        items = validated_data.pop("items")
        return create_purchase_order(
            ordered_by=self.context["request"].user,
            items=items,
            **validated_data,
        )

    def update(self, instance, validated_data):
        validated_data.pop("items", None)
        return super().update(instance, validated_data)
