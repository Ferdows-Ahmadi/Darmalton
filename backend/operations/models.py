from django.core.validators import (
    MaxValueValidator,
    MinValueValidator,
    RegexValidator,
)
from django.db import models

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
