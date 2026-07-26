import secrets
from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from catalog.models import InventoryBatch, Medicine, PharmacyBranch

from .models import Cart, Order, OrderItem, OrderItemAllocation, OrderStatusHistory

ALLOWED_TRANSITIONS = {
    Order.Status.PENDING: {Order.Status.CONFIRMED, Order.Status.CANCELLED, Order.Status.REJECTED},
    Order.Status.CONFIRMED: {Order.Status.PREPARING, Order.Status.CANCELLED},
    Order.Status.PREPARING: {Order.Status.READY_FOR_DELIVERY, Order.Status.CANCELLED},
    Order.Status.READY_FOR_DELIVERY: {Order.Status.OUT_FOR_DELIVERY, Order.Status.CANCELLED},
    Order.Status.OUT_FOR_DELIVERY: {Order.Status.DELIVERED},
    Order.Status.DELIVERED: set(),
    Order.Status.CANCELLED: set(),
    Order.Status.REJECTED: set(),
}


def get_or_create_cart(customer):
    active = Cart.objects.filter(customer=customer, status=Cart.Status.ACTIVE).first()
    if active:
        return active
    branch = (
        PharmacyBranch.objects.filter(status=PharmacyBranch.Status.ACTIVE)
        .order_by("created_at")
        .first()
    )
    if not branch:
        raise ValidationError("No active pharmacy branch is available.")
    return Cart.objects.create(customer=customer, branch=branch)


def address_snapshot(address):
    return {
        "label": address.label,
        "recipient_name": address.recipient_name,
        "recipient_phone": address.recipient_phone,
        "country_code": address.country_code,
        "province": address.province,
        "city": address.city,
        "district": address.district,
        "street_address": address.street_address,
        "landmark": address.landmark,
    }


def _order_number():
    return f"OP-{timezone.localdate():%Y%m%d}-{secrets.token_hex(4).upper()}"


@transaction.atomic
def create_order(*, customer, address):
    if address.user_id != customer.id:
        raise ValidationError("The selected address does not belong to this customer.")

    cart = (
        Cart.objects.select_for_update()
        .select_related("branch")
        .filter(customer=customer, status=Cart.Status.ACTIVE)
        .first()
    )
    if not cart:
        raise ValidationError("Your cart is empty.")
    if cart.branch.status != PharmacyBranch.Status.ACTIVE:
        raise ValidationError("The fulfillment branch is not currently active.")

    cart_items = list(cart.items.select_related("medicine__dosage_form").order_by("created_at"))
    if not cart_items:
        raise ValidationError("Your cart is empty.")

    prepared = []
    subtotal = Decimal("0.00")
    today = timezone.localdate()

    for cart_item in cart_items:
        medicine = cart_item.medicine
        if medicine.status != Medicine.Status.ACTIVE:
            raise ValidationError(f"{medicine.brand_name} is no longer available.")
        if medicine.prescription_required:
            raise ValidationError(f"{medicine.brand_name} requires pharmacist prescription review.")

        batches = list(
            InventoryBatch.objects.select_for_update()
            .filter(
                branch=cart.branch,
                medicine=medicine,
                is_active=True,
                expiry_date__gt=today,
                available_quantity__gt=0,
            )
            .order_by("expiry_date", "created_at")
        )
        total_available = sum(batch.available_quantity for batch in batches)
        if total_available < cart_item.quantity:
            raise ValidationError(f"Insufficient stock for {medicine.brand_name}.")

        unit_price = batches[0].selling_price
        line_total = unit_price * cart_item.quantity
        subtotal += line_total
        remaining = cart_item.quantity
        allocations = []
        for batch in batches:
            allocated = min(batch.available_quantity, remaining)
            if allocated:
                allocations.append((batch, allocated))
                remaining -= allocated
            if remaining == 0:
                break
        prepared.append((cart_item, unit_price, line_total, allocations))

    order = Order.objects.create(
        order_number=_order_number(),
        customer=customer,
        branch=cart.branch,
        subtotal=subtotal,
        delivery_fee=Decimal("0.00"),
        discount_total=Decimal("0.00"),
        grand_total=subtotal,
        delivery_address=address_snapshot(address),
    )

    for cart_item, unit_price, line_total, allocations in prepared:
        medicine = cart_item.medicine
        order_item = OrderItem.objects.create(
            order=order,
            medicine=medicine,
            medicine_name=medicine.brand_name,
            strength=medicine.strength,
            dosage_form=medicine.dosage_form.name,
            quantity=cart_item.quantity,
            unit_price=unit_price,
            line_total=line_total,
        )
        for batch, quantity in allocations:
            batch.available_quantity -= quantity
            batch.save(update_fields=("available_quantity", "updated_at"))
            OrderItemAllocation.objects.create(
                order_item=order_item, batch=batch, quantity=quantity
            )

    OrderStatusHistory.objects.create(
        order=order,
        from_status="",
        to_status=Order.Status.PENDING,
        changed_by=customer,
        note="Order placed",
    )
    cart.items.all().delete()
    cart.status = Cart.Status.CONVERTED
    cart.save(update_fields=("status", "updated_at"))
    return order


@transaction.atomic
def transition_order_status(*, order, new_status, actor, note=""):
    locked = Order.objects.select_for_update().get(pk=order.pk)
    if new_status == locked.status:
        return locked
    if new_status not in ALLOWED_TRANSITIONS.get(locked.status, set()):
        raise ValidationError(f"Cannot transition order from {locked.status} to {new_status}.")
    previous = locked.status
    locked.status = new_status
    locked.save(update_fields=("status", "updated_at"))
    OrderStatusHistory.objects.create(
        order=locked,
        from_status=previous,
        to_status=new_status,
        changed_by=actor,
        note=note,
    )
    return locked
