from django import forms
from django.contrib import admin, messages
from django.core.exceptions import ValidationError

from .models import (
    Cart,
    CartItem,
    CustomerAddress,
    Order,
    OrderItem,
    OrderItemAllocation,
    OrderStatusHistory,
)
from .services import ALLOWED_TRANSITIONS, transition_order_status


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    can_delete = False
    readonly_fields = (
        "medicine",
        "medicine_name",
        "strength",
        "dosage_form",
        "quantity",
        "unit_price",
        "line_total",
    )


class StatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    can_delete = False
    readonly_fields = ("from_status", "to_status", "changed_by", "note", "created_at")


class OrderAdminForm(forms.ModelForm):
    class Meta:
        model = Order
        fields = (
            "order_number",
            "customer",
            "branch",
            "status",
            "payment_method",
            "payment_status",
            "currency_code",
            "subtotal",
            "delivery_fee",
            "discount_total",
            "grand_total",
            "delivery_address",
        )

    def clean_status(self):
        new_status = self.cleaned_data["status"]
        if self.instance.pk:
            previous = Order.objects.get(pk=self.instance.pk).status
            if new_status != previous and new_status not in ALLOWED_TRANSITIONS.get(
                previous, set()
            ):
                raise ValidationError(f"Cannot transition order from {previous} to {new_status}.")
        return new_status


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    form = OrderAdminForm
    list_display = ("order_number", "customer", "status", "grand_total", "placed_at")
    list_filter = ("status", "payment_status", "placed_at")
    search_fields = ("order_number", "customer__email", "delivery_address")
    readonly_fields = (
        "order_number",
        "customer",
        "branch",
        "payment_method",
        "payment_status",
        "currency_code",
        "subtotal",
        "delivery_fee",
        "discount_total",
        "grand_total",
        "delivery_address",
        "placed_at",
        "created_at",
        "updated_at",
    )
    inlines = (OrderItemInline, StatusHistoryInline)

    def save_model(self, request, obj, form, change):
        if change and "status" in form.changed_data:
            previous = Order.objects.get(pk=obj.pk)
            transition_order_status(
                order=previous,
                new_status=form.cleaned_data["status"],
                actor=request.user,
                note="Changed in Django Admin",
            )
            messages.success(request, "Order status updated through the validated workflow.")
            return
        super().save_model(request, obj, form, change)


@admin.register(CustomerAddress)
class CustomerAddressAdmin(admin.ModelAdmin):
    list_display = ("user", "label", "city", "province", "is_default")
    search_fields = ("user__email", "recipient_name", "recipient_phone", "city")


admin.site.register(Cart)
admin.site.register(CartItem)
admin.site.register(OrderItemAllocation)
