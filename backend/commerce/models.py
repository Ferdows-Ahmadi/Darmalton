from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q

from catalog.models import InventoryBatch, Medicine, PharmacyBranch
from common.models import TimeStampedUUIDModel


class CustomerAddress(TimeStampedUUIDModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="addresses"
    )
    label = models.CharField(max_length=50, blank=True)
    recipient_name = models.CharField(max_length=150)
    recipient_phone = models.CharField(max_length=32)
    country_code = models.CharField(max_length=2, default="AF")
    province = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    district = models.CharField(max_length=100, blank=True)
    street_address = models.TextField()
    landmark = models.TextField(blank=True)
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ("-is_default", "-created_at")
        indexes = [models.Index(fields=("user", "is_default"))]

    def __str__(self):
        return f"{self.user.email}: {self.label or self.city}"


class Cart(TimeStampedUUIDModel):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        CONVERTED = "CONVERTED", "Converted"
        ABANDONED = "ABANDONED", "Abandoned"

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="carts"
    )
    branch = models.ForeignKey(PharmacyBranch, on_delete=models.RESTRICT, related_name="carts")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("customer",),
                condition=Q(status="ACTIVE"),
                name="one_active_cart_per_customer",
            )
        ]


class CartItem(TimeStampedUUIDModel):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    medicine = models.ForeignKey(Medicine, on_delete=models.RESTRICT, related_name="cart_items")
    prescription = models.ForeignKey(
        "prescriptions.Prescription",
        null=True,
        blank=True,
        on_delete=models.RESTRICT,
        related_name="cart_items",
    )
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=("cart", "medicine"), name="unique_medicine_per_cart"),
            models.CheckConstraint(condition=Q(quantity__gt=0), name="cart_quantity_positive"),
        ]


class Order(TimeStampedUUIDModel):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CONFIRMED = "CONFIRMED", "Confirmed"
        PREPARING = "PREPARING", "Preparing"
        READY_FOR_DELIVERY = "READY_FOR_DELIVERY", "Ready for delivery"
        OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY", "Out for delivery"
        DELIVERED = "DELIVERED", "Delivered"
        CANCELLED = "CANCELLED", "Cancelled"
        REJECTED = "REJECTED", "Rejected"

    class PaymentMethod(models.TextChoices):
        CASH_ON_DELIVERY = "CASH_ON_DELIVERY", "Cash on delivery"

    class PaymentStatus(models.TextChoices):
        UNPAID = "UNPAID", "Unpaid"
        PENDING = "PENDING", "Pending"
        PAID = "PAID", "Paid"
        FAILED = "FAILED", "Failed"
        REFUNDED = "REFUNDED", "Refunded"

    order_number = models.CharField(max_length=32, unique=True)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.RESTRICT, related_name="orders"
    )
    branch = models.ForeignKey(PharmacyBranch, on_delete=models.RESTRICT, related_name="orders")
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.PENDING)
    payment_method = models.CharField(
        max_length=24, choices=PaymentMethod.choices, default=PaymentMethod.CASH_ON_DELIVERY
    )
    payment_status = models.CharField(
        max_length=16, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID
    )
    currency_code = models.CharField(max_length=3, default="AFN")
    subtotal = models.DecimalField(max_digits=14, decimal_places=2)
    delivery_fee = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    discount_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=14, decimal_places=2)
    delivery_address = models.JSONField()
    prescription = models.OneToOneField(
        "prescriptions.Prescription",
        null=True,
        blank=True,
        on_delete=models.RESTRICT,
        related_name="authorization_order",
    )
    prescription_status_snapshot = models.CharField(max_length=32, blank=True)
    prescription_expires_at_snapshot = models.DateTimeField(null=True, blank=True)
    placed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-placed_at",)
        indexes = [
            models.Index(fields=("customer", "-placed_at")),
            models.Index(fields=("branch", "status", "-placed_at")),
        ]

    def __str__(self):
        return self.order_number


class OrderItem(TimeStampedUUIDModel):
    order = models.ForeignKey(Order, on_delete=models.RESTRICT, related_name="items")
    medicine = models.ForeignKey(
        Medicine, null=True, on_delete=models.SET_NULL, related_name="order_items"
    )
    medicine_name = models.CharField(max_length=280)
    strength = models.CharField(max_length=100, blank=True)
    dosage_form = models.CharField(max_length=80, blank=True)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=14, decimal_places=2)
    line_total = models.DecimalField(max_digits=14, decimal_places=2)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(quantity__gt=0), name="order_item_quantity_positive"
            ),
            models.CheckConstraint(
                condition=Q(unit_price__gte=0), name="order_item_price_nonnegative"
            ),
        ]


class OrderItemAllocation(TimeStampedUUIDModel):
    order_item = models.ForeignKey(OrderItem, on_delete=models.RESTRICT, related_name="allocations")
    batch = models.ForeignKey(
        InventoryBatch, on_delete=models.RESTRICT, related_name="order_allocations"
    )
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("order_item", "batch"), name="unique_order_item_batch_allocation"
            ),
            models.CheckConstraint(
                condition=Q(quantity__gt=0), name="allocation_quantity_positive"
            ),
        ]


class OrderStatusHistory(models.Model):
    id = models.BigAutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.RESTRICT, related_name="status_history")
    from_status = models.CharField(max_length=24, blank=True)
    to_status = models.CharField(max_length=24, choices=Order.Status.choices)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        on_delete=models.SET_NULL,
        related_name="order_status_changes",
    )
    note = models.CharField(max_length=240, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("created_at", "id")
        indexes = [models.Index(fields=("order", "created_at"))]

    def __str__(self):
        return f"{self.order.order_number}: {self.from_status or 'NEW'} -> {self.to_status}"
