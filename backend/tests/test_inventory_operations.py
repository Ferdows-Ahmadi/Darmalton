from datetime import timedelta
from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User
from catalog.models import InventoryBatch
from commerce.services import create_order
from operations.models import (
    InventoryTransaction,
    PurchaseOrder,
    StorageLocation,
    Supplier,
    Warehouse,
)

from .test_api import add_cart, make_address


@pytest.fixture
def inventory_user(db):
    return User.objects.create_user(
        email="inventory@example.test",
        password="Strong-Test-Password-123!",
        role=User.Role.STAFF,
    )


@pytest.fixture
def inventory_client(inventory_user):
    client = APIClient()
    client.force_authenticate(inventory_user)
    return client


@pytest.fixture
def storage_location(branch):
    warehouse = Warehouse.objects.create(
        branch=branch,
        code="WH-01",
        name="Main warehouse",
    )
    return StorageLocation.objects.create(
        warehouse=warehouse,
        code="LOC-A-01",
        name="General medicines",
        rack="A",
        shelf="01",
    )


@pytest.fixture
def inventory_supplier(db):
    return Supplier.objects.create(
        code="SUP-INVENTORY",
        company_name="Inventory Supplier",
        contact_name="Supply Contact",
        primary_phone="0700000001",
        address="Kabul",
        pharmacy_license_number="INV-LICENSE",
        is_verified=True,
    )


def create_approved_purchase_order(
    client,
    supplier,
    branch,
    medicine,
):
    created = client.post(
        "/api/v1/operations/purchase-orders/",
        {
            "supplier_id": str(supplier.pk),
            "branch_id": str(branch.pk),
            "expected_delivery_on": str(timezone.localdate() + timedelta(days=3)),
            "items": [
                {
                    "medicine_id": str(medicine.pk),
                    "quantity_ordered": 10,
                    "unit_cost": "6.50",
                }
            ],
        },
        format="json",
    )
    assert created.status_code == 201
    purchase_order_id = created.data["id"]
    assert (
        client.post(
            f"/api/v1/operations/purchase-orders/{purchase_order_id}/submit/",
            format="json",
        ).status_code
        == 200
    )
    assert (
        client.post(
            f"/api/v1/operations/purchase-orders/{purchase_order_id}/approve/",
            format="json",
        ).status_code
        == 200
    )
    return PurchaseOrder.objects.get(pk=purchase_order_id)


@pytest.mark.django_db
def test_purchase_receipt_creates_batch_and_traceable_ledger(
    inventory_client,
    inventory_user,
    inventory_supplier,
    storage_location,
    branch,
    medicine,
):
    purchase_order = create_approved_purchase_order(
        inventory_client,
        inventory_supplier,
        branch,
        medicine,
    )
    item = purchase_order.items.get()
    response = inventory_client.post(
        f"/api/v1/operations/purchase-orders/{purchase_order.pk}/receive/",
        {
            "invoice_number": "INV-RECEIPT-01",
            "items": [
                {
                    "purchase_order_item_id": str(item.pk),
                    "quantity": 10,
                    "batch_number": "PROC-BATCH-01",
                    "expiry_date": str(timezone.localdate() + timedelta(days=365)),
                    "selling_price": "11.00",
                    "storage_location_id": str(storage_location.pk),
                    "quality_status": InventoryBatch.QualityStatus.APPROVED,
                    "inspection_notes": "Packaging and expiry verified.",
                }
            ],
        },
        format="json",
    )
    assert response.status_code == 200
    purchase_order.refresh_from_db()
    item.refresh_from_db()
    batch = InventoryBatch.objects.get(batch_number="PROC-BATCH-01")
    movement = InventoryTransaction.objects.get(
        transaction_type=InventoryTransaction.TransactionType.PURCHASE,
        batch=batch,
    )
    assert purchase_order.status == PurchaseOrder.Status.RECEIVED
    assert purchase_order.received_by == inventory_user
    assert purchase_order.received_delivery_on == timezone.localdate()
    assert item.quantity_received == 10
    assert batch.available_quantity == 10
    assert batch.storage_location == storage_location
    assert movement.previous_quantity == 0
    assert movement.resulting_quantity == 10
    assert movement.purchase_order == purchase_order


@pytest.mark.django_db
def test_quality_quarantine_and_stock_verification_are_audited(
    inventory_client,
    inventory_user,
    medicine,
):
    batch = medicine.batches.get()
    inspected = inventory_client.post(
        f"/api/v1/operations/inventory-batches/{batch.pk}/inspect/",
        {
            "decision": InventoryBatch.QualityStatus.QUARANTINED,
            "notes": "Seal requires review.",
        },
        format="json",
    )
    assert inspected.status_code == 200
    batch.refresh_from_db()
    assert batch.quality_status == InventoryBatch.QualityStatus.QUARANTINED
    assert batch.is_active is False
    assert batch.quality_inspections.get().inspected_by == inventory_user

    verified = inventory_client.post(
        f"/api/v1/operations/inventory-batches/{batch.pk}/verify/",
        {"physical_quantity": 4, "notes": "Cycle count"},
        format="json",
    )
    assert verified.status_code == 200
    assert verified.data["transaction_type"] == "STOCK_VERIFICATION"
    assert verified.data["direction"] == "DEDUCTION"
    batch.refresh_from_db()
    assert batch.available_quantity == 4
    assert batch.verified_by == inventory_user


@pytest.mark.django_db
def test_manual_damage_adjustment_is_traceable_and_ledger_is_immutable(
    inventory_client,
    medicine,
):
    batch = medicine.batches.get()
    response = inventory_client.post(
        f"/api/v1/operations/inventory-batches/{batch.pk}/adjust/",
        {
            "transaction_type": "DAMAGE",
            "direction": "DEDUCTION",
            "quantity": 2,
            "reference": "DAMAGE-REPORT-1",
            "notes": "Broken container",
        },
        format="json",
    )
    assert response.status_code == 201
    movement = InventoryTransaction.objects.get(pk=response.data["id"])
    assert movement.previous_quantity == 5
    assert movement.resulting_quantity == 3
    movement.notes = "Attempted rewrite"
    with pytest.raises(DjangoValidationError):
        movement.save()
    with pytest.raises(DjangoValidationError):
        movement.delete()


@pytest.mark.django_db
def test_checkout_deduction_creates_sale_ledger(user, branch, medicine):
    add_cart(user, branch, medicine, quantity=2)
    order = create_order(customer=user, address=make_address(user))
    batch = medicine.batches.get()
    movement = InventoryTransaction.objects.get(
        transaction_type=InventoryTransaction.TransactionType.SALE,
        order=order,
        batch=batch,
    )
    assert movement.direction == InventoryTransaction.Direction.DEDUCTION
    assert movement.quantity == 2
    assert movement.previous_quantity == 5
    assert movement.resulting_quantity == 3
    assert movement.unit_cost == Decimal("6.00")


@pytest.mark.django_db
def test_customer_cannot_access_inventory_operations(authenticated_client):
    assert (
        authenticated_client.get("/api/v1/operations/inventory-transactions/").status_code
        == 403
    )
