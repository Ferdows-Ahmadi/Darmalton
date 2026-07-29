from django.contrib import admin, messages

from .models import Supplier


@admin.action(description="Activate selected suppliers")
def activate_suppliers(modeladmin, request, queryset):
    updated = queryset.update(is_active=True)
    modeladmin.message_user(
        request,
        f"Activated {updated} supplier(s).",
        messages.SUCCESS,
    )


@admin.action(description="Deactivate selected suppliers")
def deactivate_suppliers(modeladmin, request, queryset):
    updated = queryset.update(is_active=False)
    modeladmin.message_user(
        request,
        f"Deactivated {updated} supplier(s).",
        messages.SUCCESS,
    )


@admin.action(description="Verify selected licensed suppliers")
def verify_suppliers(modeladmin, request, queryset):
    eligible = queryset.exclude(pharmacy_license_number="")
    updated = eligible.update(is_verified=True)
    skipped = queryset.count() - updated
    level = messages.WARNING if skipped else messages.SUCCESS
    modeladmin.message_user(
        request,
        f"Verified {updated} supplier(s); skipped {skipped} without a license number.",
        level,
    )


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "company_name",
        "contact_name",
        "primary_phone",
        "rating",
        "is_verified",
        "is_active",
    )
    list_filter = ("is_active", "is_verified", "rating", "payment_terms_days")
    search_fields = (
        "code",
        "company_name",
        "contact_name",
        "email",
        "primary_phone",
        "pharmacy_license_number",
    )
    readonly_fields = ("created_at", "updated_at")
    actions = (activate_suppliers, deactivate_suppliers, verify_suppliers)
    fieldsets = (
        (
            "Identity",
            {
                "fields": (
                    "code",
                    "company_name",
                    "contact_name",
                    "is_active",
                    "is_verified",
                    "rating",
                )
            },
        ),
        (
            "Contact",
            {
                "fields": (
                    "email",
                    "primary_phone",
                    "secondary_phone",
                    "address",
                )
            },
        ),
        (
            "Licensing and payment terms",
            {
                "fields": (
                    "pharmacy_license_number",
                    "pharmacy_license_expires_on",
                    "payment_terms_days",
                    "payment_terms_notes",
                )
            },
        ),
        ("Audit", {"fields": ("created_at", "updated_at")}),
    )
