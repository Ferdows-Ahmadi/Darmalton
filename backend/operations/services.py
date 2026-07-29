import secrets
from decimal import Decimal

from django.db import transaction
from django.db.models import F, Sum
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from catalog.models import InventoryBatch

from .models import (
    InventoryQualityInspection,
    InventoryTransaction,
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseOrderStatusHistory,
    ReturnItem,
    ReturnRequest,
    ReturnStatusHistory,
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


@transaction.atomic
def record_inventory_change(
    *,
    batch,
    transaction_type,
    direction,
    quantity,
    actor,
    purchase_order=None,
    order=None,
    return_request=None,
    reference="",
    unit_cost=None,
    verified_by=None,
    notes="",
):
    locked = InventoryBatch.objects.select_for_update().get(pk=batch.pk)
    quantity = int(quantity)
    if quantity <= 0:
        raise ValidationError({"quantity": "Quantity must be greater than zero."})

    previous = locked.available_quantity
    if direction == InventoryTransaction.Direction.ADDITION:
        resulting = previous + quantity
    elif direction == InventoryTransaction.Direction.DEDUCTION:
        if quantity > previous:
            raise ValidationError({"quantity": "Quantity exceeds available stock."})
        resulting = previous - quantity
    else:
        raise ValidationError({"direction": "A stock movement must add or deduct quantity."})

    InventoryBatch.objects.filter(pk=locked.pk).update(
        available_quantity=resulting,
        updated_at=timezone.now(),
    )
    locked.available_quantity = resulting
    return InventoryTransaction.objects.create(
        batch=locked,
        transaction_type=transaction_type,
        direction=direction,
        quantity=quantity,
        previous_quantity=previous,
        resulting_quantity=resulting,
        unit_cost=unit_cost,
        purchase_order=purchase_order,
        order=order,
        return_request=return_request,
        reference=str(reference).strip(),
        performed_by=actor,
        verified_by=verified_by,
        notes=str(notes).strip(),
    )


@transaction.atomic
def inspect_inventory_batch(*, batch, decision, actor, notes=""):
    locked = InventoryBatch.objects.select_for_update().get(pk=batch.pk)
    if decision not in InventoryBatch.QualityStatus.values:
        raise ValidationError({"decision": "Select a valid quality decision."})
    previous = locked.quality_status
    now = timezone.now()
    locked.quality_status = decision
    locked.inspection_notes = str(notes).strip()
    locked.inspected_by = actor
    locked.inspected_at = now
    locked.is_active = decision == InventoryBatch.QualityStatus.APPROVED
    locked.save(
        update_fields=(
            "quality_status",
            "inspection_notes",
            "inspected_by",
            "inspected_at",
            "is_active",
            "updated_at",
        )
    )
    return InventoryQualityInspection.objects.create(
        batch=locked,
        from_status=previous,
        to_status=decision,
        inspected_by=actor,
        notes=locked.inspection_notes,
    )


@transaction.atomic
def verify_inventory_count(*, batch, physical_quantity, actor, notes=""):
    locked = InventoryBatch.objects.select_for_update().get(pk=batch.pk)
    physical_quantity = int(physical_quantity)
    if physical_quantity < 0:
        raise ValidationError({"physical_quantity": "Physical quantity cannot be negative."})
    previous = locked.available_quantity
    difference = physical_quantity - previous
    if difference > 0:
        direction = InventoryTransaction.Direction.ADDITION
    elif difference < 0:
        direction = InventoryTransaction.Direction.DEDUCTION
    else:
        direction = InventoryTransaction.Direction.NONE

    now = timezone.now()
    InventoryBatch.objects.filter(pk=locked.pk).update(
        available_quantity=physical_quantity,
        verified_by=actor,
        verified_at=now,
        updated_at=now,
    )
    return InventoryTransaction.objects.create(
        batch=locked,
        transaction_type=InventoryTransaction.TransactionType.STOCK_VERIFICATION,
        direction=direction,
        quantity=abs(difference),
        previous_quantity=previous,
        resulting_quantity=physical_quantity,
        unit_cost=locked.purchase_price,
        reference=f"STOCKTAKE-{now:%Y%m%d}",
        performed_by=actor,
        verified_by=actor,
        notes=str(notes).strip(),
    )


@transaction.atomic
def receive_purchase_order(*, purchase_order, receipt_items, actor, invoice_number=""):
    locked_order = PurchaseOrder.objects.select_for_update().get(pk=purchase_order.pk)
    if locked_order.status not in {
        PurchaseOrder.Status.APPROVED,
        PurchaseOrder.Status.PARTIALLY_RECEIVED,
    }:
        raise ValidationError(
            "Only approved or partially received purchase orders may receive stock."
        )
    if not receipt_items:
        raise ValidationError({"items": "Add at least one received batch."})

    received_item_ids = [item["purchase_order_item"].pk for item in receipt_items]
    if len(received_item_ids) != len(set(received_item_ids)):
        raise ValidationError(
            {"items": "Each purchase order item may appear only once per receipt."}
        )

    for receipt in receipt_items:
        item = (
            PurchaseOrderItem.objects.select_for_update()
            .select_related("medicine")
            .get(pk=receipt["purchase_order_item"].pk)
        )
        if item.purchase_order_id != locked_order.pk:
            raise ValidationError(
                {"items": "Every received item must belong to this purchase order."}
            )
        quantity = int(receipt["quantity"])
        outstanding = item.quantity_ordered - item.quantity_received
        if quantity <= 0 or quantity > outstanding:
            raise ValidationError(
                {
                    "items": (
                        f"Received quantity for {item.medicine} must be between 1 "
                        f"and {outstanding}."
                    )
                }
            )
        location = receipt["storage_location"]
        if location.warehouse.branch_id != locked_order.branch_id:
            raise ValidationError(
                {"items": "Storage location must belong to the purchase order branch."}
            )
        if not location.is_active or not location.warehouse.is_active:
            raise ValidationError({"items": "Storage location must be active."})
        if receipt["expiry_date"] <= timezone.localdate():
            raise ValidationError({"items": "Received medicine must not already be expired."})

        batch = (
            InventoryBatch.objects.select_for_update()
            .filter(
                branch=locked_order.branch,
                medicine=item.medicine,
                batch_number=receipt["batch_number"].strip(),
            )
            .first()
        )
        if batch:
            if (
                batch.expiry_date != receipt["expiry_date"]
                or batch.storage_location_id != location.pk
                or batch.purchase_price != item.unit_cost
            ):
                raise ValidationError(
                    {
                        "items": (
                            "An existing batch number has different expiry, location, "
                            "or purchase cost."
                        )
                    }
                )
        else:
            batch = InventoryBatch.objects.create(
                medicine=item.medicine,
                branch=locked_order.branch,
                storage_location=location,
                batch_number=receipt["batch_number"].strip(),
                expiry_date=receipt["expiry_date"],
                available_quantity=0,
                purchase_price=item.unit_cost,
                selling_price=receipt["selling_price"],
                quality_status=receipt["quality_status"],
                inspection_notes=receipt.get("inspection_notes", ""),
                inspected_by=actor,
                inspected_at=timezone.now(),
                is_active=(receipt["quality_status"] == InventoryBatch.QualityStatus.APPROVED),
            )

        record_inventory_change(
            batch=batch,
            transaction_type=InventoryTransaction.TransactionType.PURCHASE,
            direction=InventoryTransaction.Direction.ADDITION,
            quantity=quantity,
            actor=actor,
            purchase_order=locked_order,
            reference=locked_order.invoice_number or locked_order.purchase_order_number,
            unit_cost=item.unit_cost,
            verified_by=actor,
            notes=receipt.get("inspection_notes", ""),
        )
        PurchaseOrderItem.objects.filter(pk=item.pk).update(
            quantity_received=F("quantity_received") + quantity,
            updated_at=timezone.now(),
        )

    all_received = not locked_order.items.filter(
        quantity_received__lt=F("quantity_ordered")
    ).exists()
    previous_status = locked_order.status
    locked_order.status = (
        PurchaseOrder.Status.RECEIVED if all_received else PurchaseOrder.Status.PARTIALLY_RECEIVED
    )
    locked_order.received_by = actor
    if invoice_number:
        locked_order.invoice_number = invoice_number.strip()
    update_fields = ["status", "received_by", "invoice_number", "updated_at"]
    if all_received:
        locked_order.received_delivery_on = timezone.localdate()
        update_fields.append("received_delivery_on")
    locked_order.save(update_fields=update_fields)
    if locked_order.status != previous_status:
        PurchaseOrderStatusHistory.objects.create(
            purchase_order=locked_order,
            from_status=previous_status,
            to_status=locked_order.status,
            changed_by=actor,
            note="Inventory receipt recorded",
        )
    return locked_order


def _return_number():
    return f"RET-{timezone.localdate():%Y%m%d}-{secrets.token_hex(4).upper()}"


def _record_return_status(return_request, previous, actor, note=""):
    ReturnStatusHistory.objects.create(
        return_request=return_request,
        from_status=previous,
        to_status=return_request.status,
        changed_by=actor,
        note=str(note).strip(),
    )


@transaction.atomic
def create_return_request(*, order, customer, reason, items, pickup_required=False, notes=""):
    if order.customer_id != customer.pk:
        raise ValidationError({"order_id": "The selected order does not belong to you."})
    if order.status != order.Status.DELIVERED:
        raise ValidationError({"order_id": "Only delivered orders may be returned."})
    if not items:
        raise ValidationError({"items": "Select at least one order item."})

    item_ids = [item["order_item"].pk for item in items]
    if len(item_ids) != len(set(item_ids)):
        raise ValidationError({"items": "An order item may appear only once."})

    requested_total = Decimal("0.00")
    for payload in items:
        order_item = payload["order_item"]
        if order_item.order_id != order.pk:
            raise ValidationError({"items": "Every item must belong to the selected order."})
        existing_quantity = (
            ReturnItem.objects.filter(order_item=order_item)
            .exclude(
                return_request__status__in={
                    ReturnRequest.Status.REJECTED,
                    ReturnRequest.Status.CANCELLED,
                }
            )
            .aggregate(total=Sum("quantity_requested"))["total"]
            or 0
        )
        available_to_return = order_item.quantity - existing_quantity
        quantity = int(payload["quantity"])
        if quantity <= 0 or quantity > available_to_return:
            raise ValidationError(
                {
                    "items": (
                        f"Return quantity for {order_item.medicine_name} must be "
                        f"between 1 and {available_to_return}."
                    )
                }
            )
        requested_total += order_item.unit_price * quantity

    return_request = ReturnRequest.objects.create(
        return_number=_return_number(),
        order=order,
        customer=customer,
        reason=str(reason).strip(),
        customer_notes=str(notes).strip(),
        pickup_status=(
            ReturnRequest.PickupStatus.REQUESTED
            if pickup_required
            else ReturnRequest.PickupStatus.NOT_REQUIRED
        ),
        currency_code=order.currency_code,
        requested_refund_amount=requested_total,
    )
    for payload in items:
        ReturnItem.objects.create(
            return_request=return_request,
            order_item=payload["order_item"],
            quantity_requested=payload["quantity"],
        )
    _record_return_status(
        return_request,
        "",
        customer,
        "Return requested",
    )
    return return_request


@transaction.atomic
def cancel_return_request(*, return_request, customer):
    locked = ReturnRequest.objects.select_for_update().get(pk=return_request.pk)
    if locked.customer_id != customer.pk:
        raise ValidationError("This return request does not belong to you.")
    if locked.status != ReturnRequest.Status.REQUESTED:
        raise ValidationError("Only a requested return may be cancelled.")
    previous = locked.status
    locked.status = ReturnRequest.Status.CANCELLED
    locked.save(update_fields=("status", "updated_at"))
    _record_return_status(locked, previous, customer, "Cancelled by customer")
    return locked


@transaction.atomic
def approve_return_request(*, return_request, approved_items, actor, note=""):
    locked = ReturnRequest.objects.select_for_update().get(pk=return_request.pk)
    if locked.status != ReturnRequest.Status.REQUESTED:
        raise ValidationError("Only a requested return may be approved.")
    if not approved_items:
        raise ValidationError({"items": "Approve at least one return item."})

    approved_ids = [item["return_item"].pk for item in approved_items]
    if len(approved_ids) != len(set(approved_ids)):
        raise ValidationError({"items": "A return item may appear only once."})

    approved_total = Decimal("0.00")
    for payload in approved_items:
        item = (
            ReturnItem.objects.select_for_update()
            .select_related("order_item")
            .get(pk=payload["return_item"].pk)
        )
        if item.return_request_id != locked.pk:
            raise ValidationError({"items": "Every item must belong to this return."})
        quantity = int(payload["quantity_approved"])
        if quantity < 0 or quantity > item.quantity_requested:
            raise ValidationError({"items": "Approved quantity cannot exceed requested quantity."})
        item.quantity_approved = quantity
        item.save(update_fields=("quantity_approved", "updated_at"))
        approved_total += item.order_item.unit_price * quantity

    if approved_total <= 0:
        raise ValidationError({"items": "Approve a positive return quantity."})
    previous = locked.status
    locked.status = ReturnRequest.Status.APPROVED
    locked.approved_refund_amount = approved_total
    locked.approved_by = actor
    locked.approved_at = timezone.now()
    locked.admin_notes = str(note).strip()
    locked.save(
        update_fields=(
            "status",
            "approved_refund_amount",
            "approved_by",
            "approved_at",
            "admin_notes",
            "updated_at",
        )
    )
    _record_return_status(locked, previous, actor, note or "Return approved")
    return locked


@transaction.atomic
def reject_return_request(*, return_request, actor, note):
    locked = ReturnRequest.objects.select_for_update().get(pk=return_request.pk)
    if locked.status != ReturnRequest.Status.REQUESTED:
        raise ValidationError("Only a requested return may be rejected.")
    if not str(note).strip():
        raise ValidationError({"note": "A rejection reason is required."})
    previous = locked.status
    locked.status = ReturnRequest.Status.REJECTED
    locked.refund_status = ReturnRequest.RefundStatus.REJECTED
    locked.admin_notes = str(note).strip()
    locked.save(update_fields=("status", "refund_status", "admin_notes", "updated_at"))
    _record_return_status(locked, previous, actor, note)
    return locked


@transaction.atomic
def schedule_return_pickup(*, return_request, scheduled_at, actor, note=""):
    locked = ReturnRequest.objects.select_for_update().get(pk=return_request.pk)
    if locked.status != ReturnRequest.Status.APPROVED:
        raise ValidationError("Only an approved return may schedule pickup.")
    previous = locked.status
    locked.status = ReturnRequest.Status.PICKUP_SCHEDULED
    locked.pickup_status = ReturnRequest.PickupStatus.SCHEDULED
    locked.pickup_scheduled_at = scheduled_at
    locked.save(
        update_fields=(
            "status",
            "pickup_status",
            "pickup_scheduled_at",
            "updated_at",
        )
    )
    _record_return_status(locked, previous, actor, note or "Pickup scheduled")
    return locked


@transaction.atomic
def mark_return_picked_up(*, return_request, actor, note=""):
    locked = ReturnRequest.objects.select_for_update().get(pk=return_request.pk)
    if locked.status != ReturnRequest.Status.PICKUP_SCHEDULED:
        raise ValidationError("Only a scheduled return may be marked picked up.")
    previous = locked.status
    locked.status = ReturnRequest.Status.PICKED_UP
    locked.pickup_status = ReturnRequest.PickupStatus.PICKED_UP
    locked.save(update_fields=("status", "pickup_status", "updated_at"))
    _record_return_status(locked, previous, actor, note or "Return picked up")
    return locked


@transaction.atomic
def receive_return_request(*, return_request, received_items, actor, note=""):
    locked = ReturnRequest.objects.select_for_update().get(pk=return_request.pk)
    if locked.status not in {
        ReturnRequest.Status.APPROVED,
        ReturnRequest.Status.PICKUP_SCHEDULED,
        ReturnRequest.Status.PICKED_UP,
    }:
        raise ValidationError("This return is not ready to be received.")
    if not received_items:
        raise ValidationError({"items": "Record received quantities."})

    for payload in received_items:
        item = ReturnItem.objects.select_for_update().get(pk=payload["return_item"].pk)
        if item.return_request_id != locked.pk:
            raise ValidationError({"items": "Every item must belong to this return."})
        quantity = int(payload["quantity_received"])
        if quantity < 0 or quantity > item.quantity_approved:
            raise ValidationError({"items": "Received quantity cannot exceed approved quantity."})
        item.quantity_received = quantity
        item.save(update_fields=("quantity_received", "updated_at"))

    if locked.items.filter(quantity_received__lt=F("quantity_approved")).exists():
        raise ValidationError({"items": "Record a received count for every approved item."})
    previous = locked.status
    locked.status = ReturnRequest.Status.RECEIVED
    locked.pickup_status = ReturnRequest.PickupStatus.DELIVERED
    locked.received_by = actor
    locked.received_at = timezone.now()
    locked.save(
        update_fields=(
            "status",
            "pickup_status",
            "received_by",
            "received_at",
            "updated_at",
        )
    )
    _record_return_status(locked, previous, actor, note or "Return received")
    return locked


@transaction.atomic
def verify_return_request(*, return_request, verified_items, actor, note=""):
    locked = ReturnRequest.objects.select_for_update().get(pk=return_request.pk)
    if locked.status != ReturnRequest.Status.RECEIVED:
        raise ValidationError("Only a received return may be verified.")
    if len(verified_items) != locked.items.count():
        raise ValidationError({"items": "Verify every return item."})

    for payload in verified_items:
        item = (
            ReturnItem.objects.select_for_update()
            .select_related("order_item")
            .prefetch_related("order_item__allocations__batch")
            .get(pk=payload["return_item"].pk)
        )
        if item.return_request_id != locked.pk:
            raise ValidationError({"items": "Every item must belong to this return."})
        condition = payload["condition"]
        requested_restock = bool(payload.get("restock_eligible"))
        item.condition = condition
        item.restock_eligible = (
            requested_restock
            and condition == ReturnItem.Condition.UNOPENED
            and item.quantity_received > 0
        )
        item.verification_notes = str(payload.get("notes", "")).strip()

        remaining = item.quantity_received
        restored_total = 0
        if item.restock_eligible:
            for allocation in item.order_item.allocations.select_related("batch").all():
                batch = allocation.batch
                if (
                    not batch.is_active
                    or batch.quality_status != InventoryBatch.QualityStatus.APPROVED
                    or batch.expiry_date <= timezone.localdate()
                ):
                    continue
                restored = min(allocation.quantity, remaining)
                if restored:
                    record_inventory_change(
                        batch=batch,
                        transaction_type=(InventoryTransaction.TransactionType.CUSTOMER_RETURN),
                        direction=InventoryTransaction.Direction.ADDITION,
                        quantity=restored,
                        actor=actor,
                        order=locked.order,
                        return_request=locked,
                        reference=str(item.pk),
                        unit_cost=batch.purchase_price,
                        verified_by=actor,
                        notes=item.verification_notes,
                    )
                    remaining -= restored
                    restored_total += restored
                if remaining == 0:
                    break
            item.restock_eligible = restored_total > 0
        item.save(
            update_fields=(
                "condition",
                "restock_eligible",
                "verification_notes",
                "updated_at",
            )
        )

    previous = locked.status
    locked.status = ReturnRequest.Status.REFUND_PENDING
    locked.refund_status = ReturnRequest.RefundStatus.PENDING
    locked.verified_by = actor
    locked.verified_at = timezone.now()
    locked.save(
        update_fields=(
            "status",
            "refund_status",
            "verified_by",
            "verified_at",
            "updated_at",
        )
    )
    _record_return_status(locked, previous, actor, note or "Return verified")
    return locked


@transaction.atomic
def complete_return_refund(*, return_request, actor, reference, note=""):
    locked = ReturnRequest.objects.select_for_update().get(pk=return_request.pk)
    if locked.status != ReturnRequest.Status.REFUND_PENDING:
        raise ValidationError("Only a verified return may be marked refunded.")
    if not str(reference).strip():
        raise ValidationError({"reference": "A manual refund reference is required."})
    previous = locked.status
    locked.status = ReturnRequest.Status.REFUNDED
    locked.refund_status = ReturnRequest.RefundStatus.COMPLETED
    locked.refund_reference = str(reference).strip()
    locked.refund_processed_by = actor
    locked.refunded_at = timezone.now()
    locked.save(
        update_fields=(
            "status",
            "refund_status",
            "refund_reference",
            "refund_processed_by",
            "refunded_at",
            "updated_at",
        )
    )
    _record_return_status(locked, previous, actor, note or "Refund recorded")
    return locked
