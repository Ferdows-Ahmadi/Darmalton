import uuid
from pathlib import Path

from django.conf import settings
from django.db import models
from django.utils import timezone

from catalog.models import Medicine
from common.models import TimeStampedUUIDModel

from .storage import private_prescription_storage
from .validators import validate_prescription_document


def prescription_upload_path(instance, filename):
    extension = Path(filename).suffix.lower()
    return f"prescriptions/{timezone.localdate():%Y/%m}/{uuid.uuid4().hex}{extension}"


class Prescription(TimeStampedUUIDModel):
    class Status(models.TextChoices):
        SUBMITTED = "SUBMITTED", "Submitted"
        UNDER_REVIEW = "UNDER_REVIEW", "Under review"
        CLARIFICATION_REQUESTED = "CLARIFICATION_REQUESTED", "Clarification requested"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
        EXPIRED = "EXPIRED", "Expired"
        CANCELLED = "CANCELLED", "Cancelled"

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name="prescriptions",
    )
    document = models.FileField(
        storage=private_prescription_storage,
        upload_to=prescription_upload_path,
        validators=[validate_prescription_document],
    )
    original_filename = models.CharField(max_length=255)
    content_type = models.CharField(max_length=100)
    size_bytes = models.PositiveBigIntegerField()
    patient_name = models.CharField(max_length=180, blank=True)
    contact_phone = models.CharField(max_length=32, blank=True)
    delivery_preference = models.CharField(max_length=120, blank=True)
    customer_note = models.TextField(blank=True)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.SUBMITTED)
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="prescriptions_reviewed",
    )
    review_started_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    customer_visible_note = models.TextField(blank=True)
    internal_staff_note = models.TextField(blank=True)
    clarification_request = models.TextField(blank=True)
    customer_response = models.TextField(blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=("customer", "-created_at")),
            models.Index(fields=("status", "-created_at")),
            models.Index(fields=("reviewer", "status")),
        ]

    def __str__(self):
        return f"{self.customer.email} - {self.get_status_display()}"


class PrescriptionAuthorizedMedicine(TimeStampedUUIDModel):
    prescription = models.ForeignKey(
        Prescription, on_delete=models.CASCADE, related_name="authorized_medicines"
    )
    medicine = models.ForeignKey(
        Medicine, on_delete=models.RESTRICT, related_name="prescription_authorizations"
    )
    max_quantity = models.PositiveIntegerField(default=1)
    instructions = models.CharField(max_length=500, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("prescription", "medicine"),
                name="unique_prescription_authorized_medicine",
            ),
            models.CheckConstraint(
                condition=models.Q(max_quantity__gt=0),
                name="prescription_authorization_quantity_positive",
            ),
        ]
        ordering = ("created_at",)


class PrescriptionHistory(models.Model):
    id = models.BigAutoField(primary_key=True)
    prescription = models.ForeignKey(
        Prescription, on_delete=models.RESTRICT, related_name="history"
    )
    from_status = models.CharField(max_length=32, blank=True)
    to_status = models.CharField(max_length=32, choices=Prescription.Status.choices)
    action = models.CharField(max_length=64)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        on_delete=models.SET_NULL,
        related_name="prescription_actions",
    )
    customer_visible_note = models.TextField(blank=True)
    internal_staff_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("created_at", "id")
        indexes = [models.Index(fields=("prescription", "created_at"))]

    def __str__(self):
        return f"{self.prescription_id}: {self.from_status or 'NEW'} -> {self.to_status}"


class Notification(TimeStampedUUIDModel):
    class Kind(models.TextChoices):
        PRESCRIPTION_SUBMITTED = "PRESCRIPTION_SUBMITTED", "Prescription submitted"
        REVIEW_STARTED = "REVIEW_STARTED", "Review started"
        CLARIFICATION_REQUESTED = (
            "CLARIFICATION_REQUESTED",
            "Clarification requested",
        )
        PRESCRIPTION_APPROVED = "PRESCRIPTION_APPROVED", "Prescription approved"
        PRESCRIPTION_REJECTED = "PRESCRIPTION_REJECTED", "Prescription rejected"
        PRESCRIPTION_EXPIRED = "PRESCRIPTION_EXPIRED", "Prescription expired"
        PRESCRIPTION_CANCELLED = "PRESCRIPTION_CANCELLED", "Prescription cancelled"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    kind = models.CharField(max_length=40, choices=Kind.choices)
    title = models.CharField(max_length=160)
    message = models.TextField()
    prescription = models.ForeignKey(
        Prescription,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [models.Index(fields=("user", "read_at", "-created_at"))]
