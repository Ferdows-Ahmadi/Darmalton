from django.conf import settings
from django.core.validators import (
    MaxValueValidator,
    MinValueValidator,
    RegexValidator,
)
from django.db import models

from catalog.models import Medicine, PharmacyBranch
from common.models import TimeStampedUUIDModel


class Supplier(TimeStampedUUIDModel):
    code = models.CharField(
        max_length=32,
        unique=True,
        validators=[
            RegexValidator(
                regex=r"^[A-Z0-9][A-Z0-9_-]*$",
                message="Use uppercase letters, numbers, hyphens, or underscores.",
            )
        ],
    )
    company_name = models.CharField(max_length=200)
    contact_name = models.CharField(max_length=160)
    email = models.EmailField(blank=True)
    primary_phone = models.CharField(max_length=32)
    secondary_phone = models.CharField(max_length=32, blank=True)
    address = models.TextField()
    pharmacy_license_number = models.CharField(max_length=100, blank=True)
    pharmacy_license_expires_on = models.DateField(null=True, blank=True)
    payment_terms_days = models.PositiveSmallIntegerField(default=0)
    payment_terms_notes = models.CharField(max_length=240, blank=True)
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
    )
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("company_name", "code")
        indexes = [
            models.Index(fields=("is_active", "company_name")),
            models.Index(fields=("is_verified", "is_active")),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(rating__gte=0, rating__lte=5),
                name="supplier_rating_between_zero_and_five",
            )
        ]

    def save(self, *args, **kwargs):
        self.code = self.code.strip().upper()
        self.company_name = self.company_name.strip()
        self.contact_name = self.contact_name.strip()
        self.email = self.email.strip().lower()
        self.primary_phone = self.primary_phone.strip()
        self.secondary_phone = self.secondary_phone.strip()
        self.pharmacy_license_number = self.pharmacy_license_number.strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.code} - {self.company_name}"


class PurchaseOrder(TimeStampedUUIDModel):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SUBMITTED = "SUBMITTED", "Submitted"
        APPROVED = "APPROVED", "Approved"
        PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED", "Partially received"
        RECEIVED = "RECEIVED", "Received"
        CANCELLED = "CANCELLED", "Cancelled"

    class PaymentStatus(models.TextChoices):
        UNPAID = "UNPAID", "Unpaid"
        PARTIALLY_PAID = "PARTIALLY_PAID", "Partially paid"
        PAID = "PAID", "Paid"
        OVERDUE = "OVERDUE", "Overdue"

    purchase_order_number = models.CharField(max_length=32, unique=True)
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.RESTRICT,
        related_name="purchase_orders",
    )
    branch = models.ForeignKey(
        PharmacyBranch,
        on_delete=models.RESTRICT,
        related_name="purchase_orders",
    )
    ordered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name="purchase_orders_created",
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.RESTRICT,
        related_name="purchase_orders_approved",
    )
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.RESTRICT,
        related_name="purchase_orders_received",
    )
    status = models.CharField(
        max_length=24,
        choices=Status.choices,
        default=Status.DRAFT,
    )
    payment_status = models.CharField(
        max_length=24,
        choices=PaymentStatus.choices,
        default=PaymentStatus.UNPAID,
    )
    expected_delivery_on = models.DateField()
    received_delivery_on = models.DateField(null=True, blank=True)
    invoice_number = models.CharField(max_length=100, blank=True)
    currency_code = models.CharField(max_length=3, default="AFN")
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    discount_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    net_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    payment_due_on = models.DateField(null=True, blank=True)
    payment_paid_on = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    terms = models.TextField(blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=("status", "expected_delivery_on")),
            models.Index(fields=("supplier", "-created_at")),
            models.Index(fields=("branch", "status")),
            models.Index(fields=("payment_status", "payment_due_on")),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(subtotal__gte=0),
                name="purchase_order_subtotal_nonnegative",
            ),
            models.CheckConstraint(
                condition=models.Q(discount_total__gte=0),
                name="purchase_order_discount_nonnegative",
            ),
            models.CheckConstraint(
                condition=models.Q(net_total__gte=0),
                name="purchase_order_net_total_nonnegative",
            ),
        ]

    def __str__(self):
        return self.purchase_order_number


class PurchaseOrderItem(TimeStampedUUIDModel):
    purchase_order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.RESTRICT,
        related_name="items",
    )
    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.RESTRICT,
        related_name="purchase_order_items",
    )
    quantity_ordered = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    quantity_received = models.PositiveIntegerField(default=0)
    unit_cost = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    line_total = models.DecimalField(max_digits=14, decimal_places=2)

    class Meta:
        ordering = ("created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=("purchase_order", "medicine"),
                name="unique_medicine_per_purchase_order",
            ),
            models.CheckConstraint(
                condition=models.Q(quantity_ordered__gt=0),
                name="purchase_item_ordered_quantity_positive",
            ),
            models.CheckConstraint(
                condition=models.Q(quantity_received__gte=0)
                & models.Q(quantity_received__lte=models.F("quantity_ordered")),
                name="purchase_item_received_not_above_ordered",
            ),
            models.CheckConstraint(
                condition=models.Q(unit_cost__gte=0),
                name="purchase_item_unit_cost_nonnegative",
            ),
            models.CheckConstraint(
                condition=models.Q(line_total__gte=0),
                name="purchase_item_line_total_nonnegative",
            ),
        ]

    def __str__(self):
        return f"{self.purchase_order.purchase_order_number} / {self.medicine}"


class PurchaseOrderStatusHistory(models.Model):
    id = models.BigAutoField(primary_key=True)
    purchase_order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.RESTRICT,
        related_name="status_history",
    )
    from_status = models.CharField(max_length=24, blank=True)
    to_status = models.CharField(max_length=24, choices=PurchaseOrder.Status.choices)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        on_delete=models.SET_NULL,
        related_name="purchase_order_status_changes",
    )
    note = models.CharField(max_length=240, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("created_at", "id")
        indexes = [models.Index(fields=("purchase_order", "created_at"))]

    def __str__(self):
        return (
            f"{self.purchase_order.purchase_order_number}: "
            f"{self.from_status or 'NEW'} -> {self.to_status}"
        )
