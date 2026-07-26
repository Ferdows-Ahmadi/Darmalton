from pathlib import Path

from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator, MinValueValidator
from django.db import models
from django.db.models import Q

from common.models import TimeStampedUUIDModel


class RecordStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    INACTIVE = "INACTIVE", "Inactive"


class Pharmacy(TimeStampedUUIDModel):
    name = models.CharField(max_length=160)
    legal_name = models.CharField(max_length=200, blank=True)
    license_number = models.CharField(max_length=100, unique=True)
    status = models.CharField(
        max_length=16, choices=RecordStatus.choices, default=RecordStatus.ACTIVE
    )

    def __str__(self):
        return self.name


class PharmacyBranch(TimeStampedUUIDModel):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        TEMP_CLOSED = "TEMP_CLOSED", "Temporarily closed"
        INACTIVE = "INACTIVE", "Inactive"

    pharmacy = models.ForeignKey(Pharmacy, on_delete=models.RESTRICT, related_name="branches")
    name = models.CharField(max_length=160)
    phone = models.CharField(max_length=32, blank=True)
    address_text = models.TextField()
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)

    class Meta:
        indexes = [models.Index(fields=("status", "name"))]

    def __str__(self):
        return f"{self.pharmacy.name} - {self.name}"


class Category(TimeStampedUUIDModel):
    parent = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="children"
    )
    name = models.CharField(max_length=120)
    name_dari = models.CharField(max_length=120, blank=True)
    slug = models.SlugField(max_length=140, unique=True)
    status = models.CharField(
        max_length=16, choices=RecordStatus.choices, default=RecordStatus.ACTIVE
    )

    class Meta:
        ordering = ("name",)
        verbose_name_plural = "categories"

    def clean(self):
        if self.parent_id and self.parent_id == self.id:
            raise ValidationError({"parent": "A category cannot be its own parent."})

    def __str__(self):
        return self.name


class Manufacturer(TimeStampedUUIDModel):
    name = models.CharField(max_length=180, unique=True)
    country_code = models.CharField(max_length=2, blank=True)
    website = models.URLField(blank=True)
    status = models.CharField(
        max_length=16, choices=RecordStatus.choices, default=RecordStatus.ACTIVE
    )

    def __str__(self):
        return self.name


class DosageForm(TimeStampedUUIDModel):
    code = models.CharField(max_length=40, unique=True)
    name = models.CharField(max_length=80, unique=True)
    name_dari = models.CharField(max_length=80, blank=True)

    def __str__(self):
        return self.name


class Medicine(TimeStampedUUIDModel):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"
        RECALLED = "RECALLED", "Recalled"

    sku = models.CharField(max_length=64, unique=True)
    brand_name = models.CharField(max_length=180)
    brand_name_dari = models.CharField(max_length=180, blank=True)
    generic_name = models.CharField(max_length=180, blank=True)
    manufacturer = models.ForeignKey(
        Manufacturer, null=True, on_delete=models.SET_NULL, related_name="medicines"
    )
    category = models.ForeignKey(
        Category, null=True, on_delete=models.SET_NULL, related_name="medicines"
    )
    dosage_form = models.ForeignKey(DosageForm, on_delete=models.RESTRICT, related_name="medicines")
    strength = models.CharField(max_length=100, blank=True)
    pack_size = models.CharField(max_length=100, blank=True)
    barcode = models.CharField(max_length=64, unique=True, null=True, blank=True)
    description = models.TextField(blank=True)
    description_dari = models.TextField(blank=True)
    prescription_required = models.BooleanField(default=False)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)

    class Meta:
        ordering = ("brand_name",)
        indexes = [
            models.Index(fields=("status", "category")),
            models.Index(fields=("brand_name",)),
            models.Index(fields=("generic_name",)),
        ]

    def __str__(self):
        return f"{self.brand_name} {self.strength}".strip()


def validate_image_size(value):
    if value.size > 5 * 1024 * 1024:
        raise ValidationError("Medicine images must be 5 MB or smaller.")


class MedicineImage(TimeStampedUUIDModel):
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(
        upload_to="medicines/%Y/%m/",
        blank=True,
        validators=[
            FileExtensionValidator(["jpg", "jpeg", "png", "webp"]),
            validate_image_size,
        ],
    )
    alt_text = models.CharField(max_length=180, blank=True)
    is_primary = models.BooleanField(default=False)

    class Meta:
        ordering = ("-is_primary", "created_at")

    def clean(self):
        if self.image and Path(self.image.name).suffix.lower() not in {
            ".jpg",
            ".jpeg",
            ".png",
            ".webp",
        }:
            raise ValidationError({"image": "Unsupported image type."})


class InventoryBatch(TimeStampedUUIDModel):
    medicine = models.ForeignKey(Medicine, on_delete=models.RESTRICT, related_name="batches")
    branch = models.ForeignKey(PharmacyBranch, on_delete=models.RESTRICT, related_name="batches")
    batch_number = models.CharField(max_length=100)
    expiry_date = models.DateField()
    available_quantity = models.PositiveIntegerField(default=0)
    purchase_price = models.DecimalField(
        max_digits=14, decimal_places=2, validators=[MinValueValidator(0)]
    )
    selling_price = models.DecimalField(
        max_digits=14, decimal_places=2, validators=[MinValueValidator(0)]
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("branch", "medicine", "batch_number"), name="unique_branch_medicine_batch"
            ),
            models.CheckConstraint(
                condition=Q(available_quantity__gte=0), name="batch_quantity_nonnegative"
            ),
            models.CheckConstraint(
                condition=Q(selling_price__gte=0), name="selling_price_nonnegative"
            ),
            models.CheckConstraint(
                condition=Q(purchase_price__gte=0), name="purchase_price_nonnegative"
            ),
        ]
        indexes = [
            models.Index(fields=("branch", "medicine", "is_active", "expiry_date")),
        ]
        ordering = ("expiry_date", "created_at")

    def __str__(self):
        return f"{self.medicine} / {self.batch_number}"
