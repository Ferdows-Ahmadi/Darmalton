from django.contrib import admin, messages

from .models import (
    InventoryQualityInspection,
    InventoryTransaction,
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseOrderStatusHistory,
    StorageLocation,
    Supplier,
    Warehouse,
)
from .services import transition_purchase_order


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


class PurchaseOrderItemInline(admin.TabularInline):
    model = PurchaseOrderItem
    extra = 0
    autocomplete_fields = ("medicine",)
    readonly_fields = ("quantity_received", "line_total", "created_at", "updated_at")


class PurchaseOrderStatusHistoryInline(admin.TabularInline):
    model = PurchaseOrderStatusHistory
    extra = 0
    can_delete = False
    readonly_fields = (
        "from_status",
        "to_status",
        "changed_by",
        "note",
        "created_at",
    )

    def has_add_permission(self, request, obj=None):
        return False


@admin.action(description="Submit selected draft purchase orders")
def submit_purchase_orders(modeladmin, request, queryset):
    updated = 0
    for purchase_order in queryset:
        if purchase_order.status == PurchaseOrder.Status.DRAFT:
            transition_purchase_order(
                purchase_order=purchase_order,
                new_status=PurchaseOrder.Status.SUBMITTED,
                actor=request.user,
                note="Submitted in Django Admin",
            )
            updated += 1
    modeladmin.message_user(request, f"Submitted {updated} purchase order(s).")


@admin.action(description="Approve selected submitted purchase orders")
def approve_purchase_orders(modeladmin, request, queryset):
    updated = 0
    for purchase_order in queryset:
        if purchase_order.status == PurchaseOrder.Status.SUBMITTED:
            transition_purchase_order(
                purchase_order=purchase_order,
                new_status=PurchaseOrder.Status.APPROVED,
                actor=request.user,
                note="Approved in Django Admin",
            )
            updated += 1
    modeladmin.message_user(request, f"Approved {updated} purchase order(s).")


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = (
        "purchase_order_number",
        "supplier",
        "branch",
        "status",
        "payment_status",
        "expected_delivery_on",
        "net_total",
    )
    list_filter = (
        "status",
        "payment_status",
        "branch",
        "supplier",
        "expected_delivery_on",
    )
    search_fields = (
        "purchase_order_number",
        "invoice_number",
        "supplier__code",
        "supplier__company_name",
        "ordered_by__email",
    )
    autocomplete_fields = ("supplier", "branch", "ordered_by")
    readonly_fields = (
        "purchase_order_number",
        "approved_by",
        "received_by",
        "status",
        "subtotal",
        "net_total",
        "received_delivery_on",
        "submitted_at",
        "approved_at",
        "created_at",
        "updated_at",
    )
    actions = (submit_purchase_orders, approve_purchase_orders)
    inlines = (PurchaseOrderItemInline, PurchaseOrderStatusHistoryInline)


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "branch", "is_active", "updated_at")
    list_filter = ("is_active", "branch")
    search_fields = ("code", "name", "branch__name", "address")
    autocomplete_fields = ("branch",)


@admin.register(StorageLocation)
class StorageLocationAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "warehouse",
        "rack",
        "shelf",
        "temperature_zone",
        "is_active",
    )
    list_filter = ("is_active", "warehouse", "temperature_zone")
    search_fields = ("code", "name", "rack", "shelf", "warehouse__code")
    autocomplete_fields = ("warehouse",)


@admin.register(InventoryTransaction)
class InventoryTransactionAdmin(admin.ModelAdmin):
    list_display = (
        "created_at",
        "transaction_type",
        "direction",
        "batch",
        "quantity",
        "previous_quantity",
        "resulting_quantity",
        "performed_by",
    )
    list_filter = ("transaction_type", "direction", "created_at")
    search_fields = (
        "batch__batch_number",
        "batch__medicine__sku",
        "batch__medicine__brand_name",
        "reference",
        "performed_by__email",
    )
    readonly_fields = (
        "id",
        "batch",
        "transaction_type",
        "direction",
        "quantity",
        "previous_quantity",
        "resulting_quantity",
        "unit_cost",
        "purchase_order",
        "order",
        "reference",
        "performed_by",
        "verified_by",
        "notes",
        "created_at",
    )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(InventoryQualityInspection)
class InventoryQualityInspectionAdmin(admin.ModelAdmin):
    list_display = ("created_at", "batch", "from_status", "to_status", "inspected_by")
    list_filter = ("from_status", "to_status", "created_at")
    search_fields = (
        "batch__batch_number",
        "batch__medicine__sku",
        "batch__medicine__brand_name",
        "inspected_by__email",
    )
    readonly_fields = (
        "id",
        "batch",
        "from_status",
        "to_status",
        "inspected_by",
        "notes",
        "created_at",
    )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
