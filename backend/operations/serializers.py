import re

from rest_framework import serializers

from catalog.models import InventoryBatch, Medicine, PharmacyBranch
from commerce.models import Order, OrderItem

from .models import (
    InventoryQualityInspection,
    InventoryTransaction,
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseOrderStatusHistory,
    ReturnItem,
    ReturnRequest,
    ReturnStatusHistory,
    StorageLocation,
    Supplier,
    Warehouse,
)
from .services import (
    create_purchase_order,
    create_return_request,
    receive_purchase_order,
)


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


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = (
            "id",
            "branch",
            "code",
            "name",
            "address",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_code(self, value):
        return value.strip().upper()


class StorageLocationSerializer(serializers.ModelSerializer):
    warehouse_code = serializers.CharField(source="warehouse.code", read_only=True)
    branch_id = serializers.UUIDField(source="warehouse.branch.id", read_only=True)

    class Meta:
        model = StorageLocation
        fields = (
            "id",
            "warehouse",
            "warehouse_code",
            "branch_id",
            "code",
            "name",
            "rack",
            "shelf",
            "temperature_zone",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "warehouse_code",
            "branch_id",
            "created_at",
            "updated_at",
        )

    def validate_code(self, value):
        return value.strip().upper()


class InventoryQualityInspectionSerializer(serializers.ModelSerializer):
    inspected_by_email = serializers.EmailField(source="inspected_by.email", read_only=True)

    class Meta:
        model = InventoryQualityInspection
        fields = (
            "id",
            "from_status",
            "to_status",
            "inspected_by_email",
            "notes",
            "created_at",
        )


class InventoryBatchOperationsSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source="medicine.brand_name", read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    storage_location_code = serializers.CharField(
        source="storage_location.code",
        allow_null=True,
        read_only=True,
    )
    quality_inspections = InventoryQualityInspectionSerializer(many=True, read_only=True)

    class Meta:
        model = InventoryBatch
        fields = (
            "id",
            "medicine",
            "medicine_name",
            "branch",
            "branch_name",
            "storage_location",
            "storage_location_code",
            "batch_number",
            "expiry_date",
            "available_quantity",
            "purchase_price",
            "selling_price",
            "quality_status",
            "inspection_notes",
            "inspected_by",
            "inspected_at",
            "verified_by",
            "verified_at",
            "is_active",
            "quality_inspections",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class InventoryTransactionSerializer(serializers.ModelSerializer):
    medicine_id = serializers.UUIDField(source="batch.medicine.id", read_only=True)
    batch_number = serializers.CharField(source="batch.batch_number", read_only=True)
    performed_by_email = serializers.EmailField(
        source="performed_by.email",
        allow_null=True,
        read_only=True,
    )

    class Meta:
        model = InventoryTransaction
        fields = (
            "id",
            "batch",
            "batch_number",
            "medicine_id",
            "transaction_type",
            "direction",
            "quantity",
            "previous_quantity",
            "resulting_quantity",
            "unit_cost",
            "purchase_order",
            "order",
            "reference",
            "performed_by_email",
            "verified_by",
            "notes",
            "created_at",
        )
        read_only_fields = fields


class PurchaseReceiptItemSerializer(serializers.Serializer):
    purchase_order_item_id = serializers.PrimaryKeyRelatedField(
        source="purchase_order_item",
        queryset=PurchaseOrderItem.objects.all(),
    )
    quantity = serializers.IntegerField(min_value=1)
    batch_number = serializers.CharField(max_length=100)
    expiry_date = serializers.DateField()
    selling_price = serializers.DecimalField(max_digits=14, decimal_places=2, min_value=0)
    storage_location_id = serializers.PrimaryKeyRelatedField(
        source="storage_location",
        queryset=StorageLocation.objects.select_related("warehouse").all(),
    )
    quality_status = serializers.ChoiceField(
        choices=InventoryBatch.QualityStatus.choices,
    )
    inspection_notes = serializers.CharField(required=False, allow_blank=True)


class PurchaseReceiptSerializer(serializers.Serializer):
    invoice_number = serializers.CharField(max_length=100, required=False, allow_blank=True)
    items = PurchaseReceiptItemSerializer(many=True)

    def create(self, validated_data):
        return receive_purchase_order(
            purchase_order=self.context["purchase_order"],
            actor=self.context["request"].user,
            receipt_items=validated_data["items"],
            invoice_number=validated_data.get("invoice_number", ""),
        )


class QualityInspectionInputSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=InventoryBatch.QualityStatus.choices)
    notes = serializers.CharField(required=False, allow_blank=True)


class StockVerificationInputSerializer(serializers.Serializer):
    physical_quantity = serializers.IntegerField(min_value=0)
    notes = serializers.CharField(required=False, allow_blank=True)


class InventoryAdjustmentInputSerializer(serializers.Serializer):
    transaction_type = serializers.ChoiceField(
        choices=(
            InventoryTransaction.TransactionType.EXPIRY,
            InventoryTransaction.TransactionType.DAMAGE,
            InventoryTransaction.TransactionType.ADJUSTMENT,
        )
    )
    direction = serializers.ChoiceField(
        choices=(
            InventoryTransaction.Direction.ADDITION,
            InventoryTransaction.Direction.DEDUCTION,
        )
    )
    quantity = serializers.IntegerField(min_value=1)
    reference = serializers.CharField(max_length=120, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class ReturnItemSerializer(serializers.ModelSerializer):
    order_item_id = serializers.UUIDField(source="order_item.id", read_only=True)
    medicine_name = serializers.CharField(
        source="order_item.medicine_name",
        read_only=True,
    )
    unit_price = serializers.DecimalField(
        source="order_item.unit_price",
        max_digits=14,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = ReturnItem
        fields = (
            "id",
            "order_item_id",
            "medicine_name",
            "unit_price",
            "quantity_requested",
            "quantity_approved",
            "quantity_received",
            "condition",
            "restock_eligible",
            "verification_notes",
        )


class ReturnStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_email = serializers.EmailField(
        source="changed_by.email",
        allow_null=True,
        read_only=True,
    )

    class Meta:
        model = ReturnStatusHistory
        fields = (
            "id",
            "from_status",
            "to_status",
            "changed_by_email",
            "note",
            "created_at",
        )


class ReturnRequestCustomerSerializer(serializers.ModelSerializer):
    order_id = serializers.UUIDField(source="order.id", read_only=True)
    items = ReturnItemSerializer(many=True, read_only=True)
    status_history = ReturnStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = ReturnRequest
        fields = (
            "id",
            "return_number",
            "order_id",
            "reason",
            "customer_notes",
            "status",
            "pickup_status",
            "pickup_scheduled_at",
            "refund_status",
            "currency_code",
            "requested_refund_amount",
            "approved_refund_amount",
            "items",
            "status_history",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class ReturnItemCreateSerializer(serializers.Serializer):
    order_item_id = serializers.PrimaryKeyRelatedField(
        source="order_item",
        queryset=OrderItem.objects.all(),
    )
    quantity = serializers.IntegerField(min_value=1)


class ReturnRequestCreateSerializer(serializers.Serializer):
    order_id = serializers.PrimaryKeyRelatedField(
        source="order",
        queryset=Order.objects.all(),
    )
    reason = serializers.CharField(max_length=240)
    customer_notes = serializers.CharField(required=False, allow_blank=True)
    pickup_required = serializers.BooleanField(default=False)
    items = ReturnItemCreateSerializer(many=True)

    def create(self, validated_data):
        return create_return_request(
            customer=self.context["request"].user,
            order=validated_data["order"],
            reason=validated_data["reason"],
            notes=validated_data.get("customer_notes", ""),
            pickup_required=validated_data.get("pickup_required", False),
            items=validated_data["items"],
        )


class ReturnRequestStaffSerializer(ReturnRequestCustomerSerializer):
    customer_id = serializers.UUIDField(source="customer.id", read_only=True)
    customer_email = serializers.EmailField(source="customer.email", read_only=True)
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
    verified_by_id = serializers.UUIDField(
        source="verified_by.id",
        allow_null=True,
        read_only=True,
    )
    refund_processed_by_id = serializers.UUIDField(
        source="refund_processed_by.id",
        allow_null=True,
        read_only=True,
    )

    class Meta(ReturnRequestCustomerSerializer.Meta):
        fields = ReturnRequestCustomerSerializer.Meta.fields + (
            "customer_id",
            "customer_email",
            "admin_notes",
            "refund_reference",
            "approved_by_id",
            "received_by_id",
            "verified_by_id",
            "refund_processed_by_id",
            "approved_at",
            "received_at",
            "verified_at",
            "refunded_at",
            "inventory_transactions",
        )
        read_only_fields = fields

    inventory_transactions = InventoryTransactionSerializer(many=True, read_only=True)


class ReturnApprovalItemSerializer(serializers.Serializer):
    return_item_id = serializers.PrimaryKeyRelatedField(
        source="return_item",
        queryset=ReturnItem.objects.all(),
    )
    quantity_approved = serializers.IntegerField(min_value=0)


class ReturnApprovalSerializer(serializers.Serializer):
    items = ReturnApprovalItemSerializer(many=True)
    note = serializers.CharField(required=False, allow_blank=True)


class ReturnNoteSerializer(serializers.Serializer):
    note = serializers.CharField(required=False, allow_blank=True)


class ReturnRejectionSerializer(serializers.Serializer):
    note = serializers.CharField()


class ReturnPickupSerializer(serializers.Serializer):
    scheduled_at = serializers.DateTimeField()
    note = serializers.CharField(required=False, allow_blank=True)


class ReturnReceivedItemSerializer(serializers.Serializer):
    return_item_id = serializers.PrimaryKeyRelatedField(
        source="return_item",
        queryset=ReturnItem.objects.all(),
    )
    quantity_received = serializers.IntegerField(min_value=0)


class ReturnReceiptSerializer(serializers.Serializer):
    items = ReturnReceivedItemSerializer(many=True)
    note = serializers.CharField(required=False, allow_blank=True)


class ReturnVerificationItemSerializer(serializers.Serializer):
    return_item_id = serializers.PrimaryKeyRelatedField(
        source="return_item",
        queryset=ReturnItem.objects.all(),
    )
    condition = serializers.ChoiceField(choices=ReturnItem.Condition.choices)
    restock_eligible = serializers.BooleanField(default=False)
    notes = serializers.CharField(required=False, allow_blank=True)


class ReturnVerificationSerializer(serializers.Serializer):
    items = ReturnVerificationItemSerializer(many=True)
    note = serializers.CharField(required=False, allow_blank=True)


class ReturnRefundSerializer(serializers.Serializer):
    reference = serializers.CharField(max_length=120)
    note = serializers.CharField(required=False, allow_blank=True)
