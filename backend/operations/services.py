import secrets
from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import (
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseOrderStatusHistory,
)

PURCHASE_ORDER_TRANSITIONS = {
    PurchaseOrder.Status.DRAFT: {
        PurchaseOrder.Status.SUBMITTED,
        PurchaseOrder.Status.CANCELLED,
    },
    PurchaseOrder.Status.SUBMITTED: {
        PurchaseOrder.Status.APPROVED,
        PurchaseOrder.Status.CANCELLED,
    },
    PurchaseOrder.Status.APPROVED: {PurchaseOrder.Status.CANCELLED},
    PurchaseOrder.Status.PARTIALLY_RECEIVED: set(),
    PurchaseOrder.Status.RECEIVED: set(),
    PurchaseOrder.Status.CANCELLED: set(),
}


def _purchase_order_number():
    return f"PO-{timezone.localdate():%Y%m%d}-{secrets.token_hex(4).upper()}"


@transaction.atomic
def create_purchase_order(
    *,
    supplier,
    branch,
    ordered_by,
    expected_delivery_on,
    items,
    discount_total=Decimal("0.00"),
    **details,
):
    if not supplier.is_active:
        raise ValidationError({"supplier_id": "Purchase orders require an active supplier."})
    if not items:
        raise ValidationError({"items": "Add at least one medicine."})

    medicine_ids = [item["medicine"].pk for item in items]
    if len(set(medicine_ids)) != len(medicine_ids):
        raise ValidationError({"items": "A medicine may appear only once per purchase order."})

    subtotal = sum(
        (item["unit_cost"] * item["quantity_ordered"] for item in items),
        Decimal("0.00"),
    )
    discount_total = discount_total or Decimal("0.00")
    if discount_total > subtotal:
        raise ValidationError({"discount_total": "Discount cannot exceed the subtotal."})

    purchase_order = PurchaseOrder.objects.create(
        purchase_order_number=_purchase_order_number(),
        supplier=supplier,
        branch=branch,
        ordered_by=ordered_by,
        expected_delivery_on=expected_delivery_on,
        subtotal=subtotal,
        discount_total=discount_total,
        net_total=subtotal - discount_total,
        **details,
    )
    for item in items:
        PurchaseOrderItem.objects.create(
            purchase_order=purchase_order,
            medicine=item["medicine"],
            quantity_ordered=item["quantity_ordered"],
            unit_cost=item["unit_cost"],
            line_total=item["unit_cost"] * item["quantity_ordered"],
        )
    PurchaseOrderStatusHistory.objects.create(
        purchase_order=purchase_order,
        from_status="",
        to_status=PurchaseOrder.Status.DRAFT,
        changed_by=ordered_by,
        note="Purchase order created",
    )
    return purchase_order


@transaction.atomic
def transition_purchase_order(*, purchase_order, new_status, actor, note=""):
    locked = PurchaseOrder.objects.select_for_update().get(pk=purchase_order.pk)
    if new_status == locked.status:
        return locked
    if new_status not in PURCHASE_ORDER_TRANSITIONS.get(locked.status, set()):
        raise ValidationError(
            f"Cannot transition purchase order from {locked.status} to {new_status}."
        )

    previous = locked.status
    locked.status = new_status
    update_fields = ["status", "updated_at"]
    now = timezone.now()
    if new_status == PurchaseOrder.Status.SUBMITTED:
        locked.submitted_at = now
        update_fields.append("submitted_at")
    elif new_status == PurchaseOrder.Status.APPROVED:
        locked.approved_by = actor
        locked.approved_at = now
        update_fields.extend(("approved_by", "approved_at"))
    locked.save(update_fields=update_fields)
    PurchaseOrderStatusHistory.objects.create(
        purchase_order=locked,
        from_status=previous,
        to_status=new_status,
        changed_by=actor,
        note=note,
    )
    return locked
