from django.db.models import Sum
from django.utils import timezone
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from catalog.models import InventoryBatch, Medicine
from catalog.serializers import MedicineSerializer
from prescriptions.models import Prescription
from prescriptions.services import validate_prescription_authorization

from .models import Cart, CartItem, CustomerAddress, Order, OrderItem, OrderStatusHistory
from .services import create_order


def medicine_stock(medicine, branch):
    return (
        InventoryBatch.objects.filter(
            medicine=medicine,
            branch=branch,
            is_active=True,
            quality_status=InventoryBatch.QualityStatus.APPROVED,
            expiry_date__gt=timezone.localdate(),
        ).aggregate(total=Sum("available_quantity"))["total"]
        or 0
    )


def medicine_price(medicine, branch):
    batch = (
        InventoryBatch.objects.filter(
            medicine=medicine,
            branch=branch,
            is_active=True,
            quality_status=InventoryBatch.QualityStatus.APPROVED,
            expiry_date__gt=timezone.localdate(),
            available_quantity__gt=0,
        )
        .order_by("expiry_date")
        .first()
    )
    return batch.selling_price if batch else None


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerAddress
        exclude = ("user",)
        read_only_fields = ("id", "created_at", "updated_at")

    def create(self, validated_data):
        user = self.context["request"].user
        if validated_data.get("is_default"):
            user.addresses.update(is_default=False)
        return CustomerAddress.objects.create(user=user, **validated_data)

    def update(self, instance, validated_data):
        if validated_data.get("is_default"):
            instance.user.addresses.exclude(pk=instance.pk).update(is_default=False)
        return super().update(instance, validated_data)


class CartItemSerializer(serializers.ModelSerializer):
    medicine = MedicineSerializer(read_only=True)
    medicine_id = serializers.PrimaryKeyRelatedField(
        source="medicine", queryset=Medicine.objects.all(), write_only=True
    )
    prescription = serializers.UUIDField(source="prescription.id", allow_null=True, read_only=True)
    prescription_id = serializers.PrimaryKeyRelatedField(
        source="prescription",
        queryset=Prescription.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )
    unit_price = serializers.SerializerMethodField()
    line_total = serializers.SerializerMethodField()
    available_quantity = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = (
            "id",
            "medicine",
            "medicine_id",
            "prescription",
            "prescription_id",
            "quantity",
            "unit_price",
            "line_total",
            "available_quantity",
        )
        read_only_fields = ("id",)

    def _cart(self):
        return self.context.get("cart") or getattr(self.instance, "cart", None)

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than zero.")
        return value

    def validate(self, attrs):
        medicine = attrs.get("medicine") or getattr(self.instance, "medicine", None)
        prescription = attrs.get("prescription", getattr(self.instance, "prescription", None))
        cart = self._cart()
        if medicine and medicine.status != Medicine.Status.ACTIVE:
            raise serializers.ValidationError({"medicine_id": "This medicine is inactive."})
        if medicine and medicine.prescription_required:
            if not prescription:
                raise serializers.ValidationError(
                    {"prescription_id": "برای این دوا نسخه تأییدشده لازم است."}
                )
            if cart:
                validate_prescription_authorization(
                    prescription=prescription,
                    customer=cart.customer,
                    medicine=medicine,
                    quantity=attrs.get("quantity", getattr(self.instance, "quantity", 0)),
                )
        elif prescription:
            raise serializers.ValidationError({"prescription_id": "این دوا به نسخه نیاز ندارد."})
        if medicine and cart:
            available = medicine_stock(medicine, cart.branch)
            if attrs.get("quantity", getattr(self.instance, "quantity", 0)) > available:
                raise serializers.ValidationError(
                    {"quantity": f"Only {available} units are available."}
                )
        return attrs

    @extend_schema_field(serializers.DecimalField(max_digits=12, decimal_places=2, allow_null=True))
    def get_unit_price(self, obj):
        price = medicine_price(obj.medicine, obj.cart.branch)
        return f"{price:.2f}" if price is not None else None

    @extend_schema_field(serializers.DecimalField(max_digits=12, decimal_places=2, allow_null=True))
    def get_line_total(self, obj):
        price = medicine_price(obj.medicine, obj.cart.branch)
        return f"{price * obj.quantity:.2f}" if price is not None else None

    @extend_schema_field(serializers.IntegerField(min_value=0))
    def get_available_quantity(self, obj):
        return medicine_stock(obj.medicine, obj.cart.branch)


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    item_count = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ("id", "branch_id", "items", "item_count", "subtotal")

    @extend_schema_field(serializers.IntegerField(min_value=0))
    def get_item_count(self, obj):
        return sum(item.quantity for item in obj.items.all())

    @extend_schema_field(serializers.DecimalField(max_digits=12, decimal_places=2))
    def get_subtotal(self, obj):
        total = sum(
            (medicine_price(item.medicine, obj.branch) or 0) * item.quantity
            for item in obj.items.all()
        )
        return f"{total:.2f}"


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusHistory
        fields = ("id", "from_status", "to_status", "note", "created_at")


class OrderItemSerializer(serializers.ModelSerializer):
    medicine_id = serializers.UUIDField(source="medicine.id", allow_null=True, read_only=True)

    class Meta:
        model = OrderItem
        fields = (
            "id",
            "medicine_id",
            "medicine_name",
            "strength",
            "dosage_form",
            "quantity",
            "unit_price",
            "line_total",
        )


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    prescription_id = serializers.UUIDField(
        source="prescription.id", allow_null=True, read_only=True
    )

    class Meta:
        model = Order
        fields = (
            "id",
            "order_number",
            "status",
            "payment_method",
            "payment_status",
            "currency_code",
            "subtotal",
            "delivery_fee",
            "discount_total",
            "grand_total",
            "delivery_address",
            "prescription_id",
            "prescription_status_snapshot",
            "prescription_expires_at_snapshot",
            "items",
            "status_history",
            "placed_at",
        )


class StaffOrderSerializer(OrderSerializer):
    customer_id = serializers.UUIDField(source="customer.id", read_only=True)
    customer_email = serializers.EmailField(source="customer.email", read_only=True)
    customer_phone = serializers.CharField(source="customer.phone", allow_null=True, read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta(OrderSerializer.Meta):
        fields = OrderSerializer.Meta.fields + (
            "customer_id",
            "customer_email",
            "customer_phone",
            "branch_name",
        )


class CheckoutSerializer(serializers.Serializer):
    address_id = serializers.PrimaryKeyRelatedField(
        source="address", queryset=CustomerAddress.objects.none()
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            self.fields["address_id"].queryset = request.user.addresses.all()

    def create(self, validated_data):
        return create_order(
            customer=self.context["request"].user,
            address=validated_data["address"],
        )
