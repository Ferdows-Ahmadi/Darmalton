import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import (
    MaxValueValidator,
    MinValueValidator,
    RegexValidator,
)
from django.db import models

from catalog.models import InventoryBatch, Medicine, PharmacyBranch
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


class Warehouse(TimeStampedUUIDModel):
    branch = models.ForeignKey(
        PharmacyBranch,
        on_delete=models.RESTRICT,
        related_name="warehouses",
    )
    code = models.CharField(max_length=32)
    name = models.CharField(max_length=160)
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("branch__name", "code")
        constraints = [
            models.UniqueConstraint(
                fields=("branch", "code"),
                name="unique_warehouse_code_per_branch",
            )
        ]
        indexes = [models.Index(fields=("branch", "is_active"))]

    def save(self, *args, **kwargs):
        self.code = self.code.strip().upper()
        self.name = self.name.strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.branch} / {self.code}"


class StorageLocation(TimeStampedUUIDModel):
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.RESTRICT,
        related_name="locations",
    )
    code = models.CharField(max_length=40)
    name = models.CharField(max_length=160, blank=True)
    rack = models.CharField(max_length=40)
    shelf = models.CharField(max_length=40)
    temperature_zone = models.CharField(max_length=80, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("warehouse__code", "rack", "shelf", "code")
        constraints = [
            models.UniqueConstraint(
                fields=("warehouse", "code"),
                name="unique_storage_location_code_per_warehouse",
            ),
            models.UniqueConstraint(
                fields=("warehouse", "rack", "shelf"),
                name="unique_rack_shelf_per_warehouse",
            ),
        ]
        indexes = [models.Index(fields=("warehouse", "is_active"))]

    def save(self, *args, **kwargs):
        self.code = self.code.strip().upper()
        self.rack = self.rack.strip().upper()
        self.shelf = self.shelf.strip().upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.warehouse.code} / {self.rack} / {self.shelf}"


class InventoryTransaction(models.Model):
    class TransactionType(models.TextChoices):
        PURCHASE = "PURCHASE", "Purchase receipt"
        SALE = "SALE", "Sale"
        CUSTOMER_RETURN = "CUSTOMER_RETURN", "Customer return"
        SUPPLIER_RETURN = "SUPPLIER_RETURN", "Supplier return"
        EXPIRY = "EXPIRY", "Expiry"
        DAMAGE = "DAMAGE", "Damage"
        ADJUSTMENT = "ADJUSTMENT", "Adjustment"
        STOCK_VERIFICATION = "STOCK_VERIFICATION", "Stock verification"

    class Direction(models.TextChoices):
        ADDITION = "ADDITION", "Addition"
        DEDUCTION = "DEDUCTION", "Deduction"
        NONE = "NONE", "No quantity change"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch = models.ForeignKey(
        InventoryBatch,
        on_delete=models.RESTRICT,
        related_name="transactions",
    )
    transaction_type = models.CharField(max_length=24, choices=TransactionType.choices)
    direction = models.CharField(max_length=16, choices=Direction.choices)
    quantity = models.PositiveIntegerField()
    previous_quantity = models.PositiveIntegerField()
    resulting_quantity = models.PositiveIntegerField()
    unit_cost = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    purchase_order = models.ForeignKey(
        PurchaseOrder,
        null=True,
        blank=True,
        on_delete=models.RESTRICT,
        related_name="inventory_transactions",
    )
    order = models.ForeignKey(
        "commerce.Order",
        null=True,
        blank=True,
        on_delete=models.RESTRICT,
        related_name="inventory_transactions",
    )
    return_request = models.ForeignKey(
        "ReturnRequest",
        null=True,
        blank=True,
        on_delete=models.RESTRICT,
        related_name="inventory_transactions",
    )
    reference = models.CharField(max_length=120, blank=True)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        on_delete=models.SET_NULL,
        related_name="inventory_transactions_performed",
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="inventory_transactions_verified",
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=("batch", "-created_at")),
            models.Index(fields=("transaction_type", "-created_at")),
            models.Index(fields=("purchase_order", "-created_at")),
            models.Index(fields=("order", "-created_at")),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(
                    transaction_type="STOCK_VERIFICATION",
                    quantity__gte=0,
                )
                | models.Q(quantity__gt=0),
                name="inventory_transaction_quantity_valid",
            ),
            models.CheckConstraint(
                condition=models.Q(previous_quantity__gte=0),
                name="inventory_previous_quantity_nonnegative",
            ),
            models.CheckConstraint(
                condition=models.Q(resulting_quantity__gte=0),
                name="inventory_resulting_quantity_nonnegative",
            ),
        ]

    def __str__(self):
        return f"{self.transaction_type}: {self.batch} ({self.quantity})"

    def save(self, *args, **kwargs):
        if self.pk and type(self).objects.filter(pk=self.pk).exists():
            raise ValidationError("Inventory transactions are immutable.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("Inventory transactions cannot be deleted.")


class InventoryQualityInspection(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch = models.ForeignKey(
        InventoryBatch,
        on_delete=models.RESTRICT,
        related_name="quality_inspections",
    )
    from_status = models.CharField(max_length=16, choices=InventoryBatch.QualityStatus.choices)
    to_status = models.CharField(max_length=16, choices=InventoryBatch.QualityStatus.choices)
    inspected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name="inventory_quality_inspections",
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [models.Index(fields=("batch", "-created_at"))]

    def __str__(self):
        return f"{self.batch}: {self.from_status} -> {self.to_status}"


class ReturnRequest(TimeStampedUUIDModel):
    class Status(models.TextChoices):
        REQUESTED = "REQUESTED", "Requested"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
        PICKUP_SCHEDULED = "PICKUP_SCHEDULED", "Pickup scheduled"
        PICKED_UP = "PICKED_UP", "Picked up"
        RECEIVED = "RECEIVED", "Received"
        VERIFIED = "VERIFIED", "Verified"
        REFUND_PENDING = "REFUND_PENDING", "Refund pending"
        REFUNDED = "REFUNDED", "Refunded"
        CLOSED = "CLOSED", "Closed"
        CANCELLED = "CANCELLED", "Cancelled"

    class RefundStatus(models.TextChoices):
        NOT_STARTED = "NOT_STARTED", "Not started"
        PENDING = "PENDING", "Pending"
        COMPLETED = "COMPLETED", "Completed"
        REJECTED = "REJECTED", "Rejected"

    class PickupStatus(models.TextChoices):
        NOT_REQUIRED = "NOT_REQUIRED", "Not required"
        REQUESTED = "REQUESTED", "Requested"
        SCHEDULED = "SCHEDULED", "Scheduled"
        PICKED_UP = "PICKED_UP", "Picked up"
        DELIVERED = "DELIVERED", "Delivered to pharmacy"

    return_number = models.CharField(max_length=32, unique=True)
    order = models.ForeignKey(
        "commerce.Order",
        on_delete=models.RESTRICT,
        related_name="return_requests",
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name="return_requests",
    )
    reason = models.CharField(max_length=240)
    customer_notes = models.TextField(blank=True)
    admin_notes = models.TextField(blank=True)
    status = models.CharField(
        max_length=24,
        choices=Status.choices,
        default=Status.REQUESTED,
    )
    pickup_status = models.CharField(
        max_length=24,
        choices=PickupStatus.choices,
        default=PickupStatus.NOT_REQUIRED,
    )
    pickup_scheduled_at = models.DateTimeField(null=True, blank=True)
    refund_status = models.CharField(
        max_length=24,
        choices=RefundStatus.choices,
        default=RefundStatus.NOT_STARTED,
    )
    currency_code = models.CharField(max_length=3, default="AFN")
    requested_refund_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
    )
    approved_refund_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
    )
    refund_reference = models.CharField(max_length=120, blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.RESTRICT,
        related_name="returns_approved",
    )
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.RESTRICT,
        related_name="returns_received",
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.RESTRICT,
        related_name="returns_verified",
    )
    refund_processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.RESTRICT,
        related_name="returns_refunded",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    received_at = models.DateTimeField(null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    refunded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=("customer", "-created_at")),
            models.Index(fields=("status", "-created_at")),
            models.Index(fields=("refund_status", "-created_at")),
            models.Index(fields=("pickup_status", "-created_at")),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(requested_refund_amount__gte=0),
                name="return_requested_refund_nonnegative",
            ),
            models.CheckConstraint(
                condition=models.Q(approved_refund_amount__gte=0),
                name="return_approved_refund_nonnegative",
            ),
        ]

    def __str__(self):
        return self.return_number


class ReturnItem(TimeStampedUUIDModel):
    class Condition(models.TextChoices):
        UNOPENED = "UNOPENED", "Unopened"
        OPENED = "OPENED", "Opened"
        DAMAGED = "DAMAGED", "Damaged"
        EXPIRED = "EXPIRED", "Expired"
        UNKNOWN = "UNKNOWN", "Not yet verified"

    return_request = models.ForeignKey(
        ReturnRequest,
        on_delete=models.RESTRICT,
        related_name="items",
    )
    order_item = models.ForeignKey(
        "commerce.OrderItem",
        on_delete=models.RESTRICT,
        related_name="return_items",
    )
    quantity_requested = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    quantity_approved = models.PositiveIntegerField(default=0)
    quantity_received = models.PositiveIntegerField(default=0)
    condition = models.CharField(
        max_length=16,
        choices=Condition.choices,
        default=Condition.UNKNOWN,
    )
    restock_eligible = models.BooleanField(default=False)
    verification_notes = models.CharField(max_length=240, blank=True)

    class Meta:
        ordering = ("created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=("return_request", "order_item"),
                name="unique_order_item_per_return_request",
            ),
            models.CheckConstraint(
                condition=models.Q(quantity_requested__gt=0),
                name="return_item_requested_quantity_positive",
            ),
            models.CheckConstraint(
                condition=models.Q(quantity_approved__gte=0)
                & models.Q(quantity_approved__lte=models.F("quantity_requested")),
                name="return_item_approved_not_above_requested",
            ),
            models.CheckConstraint(
                condition=models.Q(quantity_received__gte=0)
                & models.Q(quantity_received__lte=models.F("quantity_approved")),
                name="return_item_received_not_above_approved",
            ),
        ]

    def __str__(self):
        return f"{self.return_request.return_number} / {self.order_item.medicine_name}"


class ReturnStatusHistory(models.Model):
    id = models.BigAutoField(primary_key=True)
    return_request = models.ForeignKey(
        ReturnRequest,
        on_delete=models.RESTRICT,
        related_name="status_history",
    )
    from_status = models.CharField(max_length=24, blank=True)
    to_status = models.CharField(max_length=24, choices=ReturnRequest.Status.choices)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        on_delete=models.SET_NULL,
        related_name="return_status_changes",
    )
    note = models.CharField(max_length=240, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("created_at", "id")
        indexes = [models.Index(fields=("return_request", "created_at"))]

    def __str__(self):
        return (
            f"{self.return_request.return_number}: "
            f"{self.from_status or 'NEW'} -> {self.to_status}"
        )
