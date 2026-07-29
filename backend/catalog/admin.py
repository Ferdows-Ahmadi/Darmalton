from django.contrib import admin

from .models import (
    Category,
    DosageForm,
    InventoryBatch,
    Manufacturer,
    Medicine,
    MedicineImage,
    Pharmacy,
    PharmacyBranch,
)


class MedicineImageInline(admin.TabularInline):
    model = MedicineImage
    extra = 0
    fields = ("image", "alt_text", "is_primary")


@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = ("sku", "brand_name", "strength", "category", "manufacturer", "status")
    list_filter = ("status", "category", "manufacturer", "prescription_required")
    search_fields = ("sku", "brand_name", "generic_name", "barcode")
    autocomplete_fields = ("category", "manufacturer", "dosage_form")
    inlines = (MedicineImageInline,)


@admin.register(MedicineImage)
class MedicineImageAdmin(admin.ModelAdmin):
    list_display = ("medicine", "is_primary", "alt_text", "updated_at")
    list_filter = ("is_primary",)
    search_fields = ("medicine__sku", "medicine__brand_name", "alt_text")
    autocomplete_fields = ("medicine",)


@admin.register(InventoryBatch)
class InventoryBatchAdmin(admin.ModelAdmin):
    list_display = (
        "batch_number",
        "medicine",
        "branch",
        "storage_location",
        "expiry_date",
        "available_quantity",
        "selling_price",
        "quality_status",
        "is_active",
    )
    list_filter = ("is_active", "quality_status", "expiry_date", "branch")
    search_fields = ("batch_number", "medicine__brand_name", "medicine__sku")
    autocomplete_fields = ("medicine", "branch", "storage_location")
    readonly_fields = (
        "available_quantity",
        "inspected_by",
        "inspected_at",
        "verified_by",
        "verified_at",
        "created_at",
        "updated_at",
    )


@admin.register(Pharmacy)
class PharmacyAdmin(admin.ModelAdmin):
    search_fields = ("name", "legal_name", "license_number")


@admin.register(PharmacyBranch)
class PharmacyBranchAdmin(admin.ModelAdmin):
    search_fields = ("name", "pharmacy__name", "address_text")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    search_fields = ("name", "slug")


@admin.register(Manufacturer)
class ManufacturerAdmin(admin.ModelAdmin):
    search_fields = ("name",)


@admin.register(DosageForm)
class DosageFormAdmin(admin.ModelAdmin):
    search_fields = ("code", "name")
