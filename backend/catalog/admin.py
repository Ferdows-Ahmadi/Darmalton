from django.contrib import admin
from django.utils.html import format_html

from operations.services import inspect_inventory_batch

from .models import (
    Category,
    DosageForm,
    InventoryBatch,
    Manufacturer,
    Medicine,
    MedicineImage,
    MedicineImportJob,
    Pharmacy,
    PharmacyBranch,
)


@admin.register(MedicineImportJob)
class MedicineImportJobAdmin(admin.ModelAdmin):
    list_display = ("original_filename", "mode", "status", "uploaded_by", "created_at")
    list_filter = ("mode", "status")
    search_fields = ("original_filename", "uploaded_by__email")
    readonly_fields = (
        "uploaded_by",
        "original_filename",
        "mode",
        "status",
        "normalized_payload",
        "validation_report",
        "result_report",
        "confirmed_at",
        "created_at",
        "updated_at",
    )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class MedicineImageInline(admin.TabularInline):
    model = MedicineImage
    extra = 0
    fields = ("image", "image_preview", "alt_text", "is_primary")
    readonly_fields = ("image_preview",)

    @admin.display(description="Preview")
    def image_preview(self, obj):
        if not obj or not obj.image:
            return "No image"
        return format_html(
            '<img src="{}" alt="" style="max-height:80px;max-width:120px;object-fit:contain">',
            obj.image.url,
        )


@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = (
        "sku",
        "brand_name",
        "strength",
        "family_code",
        "shopper_category",
        "category",
        "manufacturer",
        "status",
    )
    list_filter = (
        "status",
        "shopper_category",
        "category",
        "manufacturer",
        "prescription_required",
    )
    search_fields = (
        "sku",
        "brand_name",
        "brand_name_dari",
        "brand_name_pashto",
        "generic_name",
        "generic_name_dari",
        "generic_name_pashto",
        "family_code",
        "barcode",
    )
    autocomplete_fields = ("category", "manufacturer", "dosage_form")
    inlines = (MedicineImageInline,)


@admin.register(MedicineImage)
class MedicineImageAdmin(admin.ModelAdmin):
    list_display = ("image_preview", "medicine", "is_primary", "alt_text", "updated_at")
    list_filter = ("is_primary",)
    search_fields = ("medicine__sku", "medicine__brand_name", "alt_text")
    autocomplete_fields = ("medicine",)
    readonly_fields = ("image_preview", "created_at", "updated_at")

    @admin.display(description="Preview")
    def image_preview(self, obj):
        if not obj or not obj.image:
            return "No image"
        return format_html(
            '<img src="{}" alt="" style="max-height:70px;max-width:100px;object-fit:contain">',
            obj.image.url,
        )


@admin.action(description="Approve selected batches after inspection")
def approve_inventory_batches(modeladmin, request, queryset):
    updated = 0
    for batch in queryset:
        inspect_inventory_batch(
            batch=batch,
            decision=InventoryBatch.QualityStatus.APPROVED,
            actor=request.user,
            notes="Approved through Django Admin bulk inspection",
        )
        updated += 1
    modeladmin.message_user(request, f"Approved {updated} inventory batch(es).")


@admin.action(description="Quarantine selected batches")
def quarantine_inventory_batches(modeladmin, request, queryset):
    updated = 0
    for batch in queryset:
        inspect_inventory_batch(
            batch=batch,
            decision=InventoryBatch.QualityStatus.QUARANTINED,
            actor=request.user,
            notes="Quarantined through Django Admin bulk inspection",
        )
        updated += 1
    modeladmin.message_user(request, f"Quarantined {updated} inventory batch(es).")


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
    actions = (approve_inventory_batches, quarantine_inventory_batches)

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Pharmacy)
class PharmacyAdmin(admin.ModelAdmin):
    search_fields = ("name", "legal_name", "license_number")


@admin.register(PharmacyBranch)
class PharmacyBranchAdmin(admin.ModelAdmin):
    search_fields = ("name", "pharmacy__name", "address_text")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    search_fields = ("name", "name_dari", "name_pashto", "slug")


@admin.register(Manufacturer)
class ManufacturerAdmin(admin.ModelAdmin):
    list_display = ("name", "name_dari", "country_code", "display_order", "status")
    list_filter = ("status", "country_code")
    search_fields = ("name", "name_dari", "name_pashto", "country_code")
    ordering = ("display_order", "name")


@admin.register(DosageForm)
class DosageFormAdmin(admin.ModelAdmin):
    search_fields = ("code", "name", "name_dari", "name_pashto")
