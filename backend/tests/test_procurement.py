from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User
from operations.models import PurchaseOrder, PurchaseOrderStatusHistory, Supplier


@pytest.fixture
def procurement_user(db):
    return User.objects.create_user(
        email="procurement@example.test",
        password="Strong-Test-Password-123!",
        role=User.Role.STAFF,
    )


@pytest.fixture
def procurement_client(procurement_user):
    client = APIClient()
    client.force_authenticate(procurement_user)
    return client


@pytest.fixture
def supplier(db):
    return Supplier.objects.create(
        code="SUP-PROC",
        company_name="Procurement Supplier",
        contact_name="Supplier Contact",
        primary_phone="0700123456",
        address="Kabul",
        pharmacy_license_number="LICENSE-PROC",
        is_verified=True,
    )


def purchase_order_payload(supplier, branch, medicine, **overrides):
    return {
        "supplier_id": str(supplier.pk),
        "branch_id": str(branch.pk),
        "expected_delivery_on": str(timezone.localdate() + timedelta(days=5)),
        "discount_total": "10.00",
        "invoice_number": "INV-001",
        "items": [
            {
                "medicine_id": str(medicine.pk),
                "quantity_ordered": 20,
                "unit_cost": "6.00",
            }
        ],
        **overrides,
    }


@pytest.mark.django_db
def test_customer_cannot_access_purchase_orders(authenticated_client):
    assert authenticated_client.get("/api/v1/operations/purchase-orders/").status_code == 403


@pytest.mark.django_db
def test_staff_creates_purchase_order_with_server_totals(
    procurement_client,
    procurement_user,
    supplier,
    branch,
    medicine,
):
    response = procurement_client.post(
        "/api/v1/operations/purchase-orders/",
        purchase_order_payload(supplier, branch, medicine),
        format="json",
    )
    assert response.status_code == 201
    purchase_order = PurchaseOrder.objects.get()
    assert purchase_order.purchase_order_number.startswith("PO-")
    assert purchase_order.ordered_by == procurement_user
    assert purchase_order.subtotal == 120
    assert purchase_order.net_total == 110
    assert purchase_order.items.get().line_total == 120
    assert purchase_order.status_history.get().to_status == PurchaseOrder.Status.DRAFT
    assert (
        procurement_client.delete(
            f"/api/v1/operations/purchase-orders/{purchase_order.pk}/"
        ).status_code
        == 405
    )


@pytest.mark.django_db
def test_purchase_order_submit_and_approve_are_audited(
    procurement_client,
    procurement_user,
    supplier,
    branch,
    medicine,
):
    created = procurement_client.post(
        "/api/v1/operations/purchase-orders/",
        purchase_order_payload(supplier, branch, medicine),
        format="json",
    )
    purchase_order_id = created.data["id"]

    submitted = procurement_client.post(
        f"/api/v1/operations/purchase-orders/{purchase_order_id}/submit/",
        {"note": "Ready for approval"},
        format="json",
    )
    assert submitted.status_code == 200
    assert submitted.data["status"] == PurchaseOrder.Status.SUBMITTED

    approved = procurement_client.post(
        f"/api/v1/operations/purchase-orders/{purchase_order_id}/approve/",
        {"note": "Budget approved"},
        format="json",
    )
    assert approved.status_code == 200
    purchase_order = PurchaseOrder.objects.get(pk=purchase_order_id)
    assert purchase_order.status == PurchaseOrder.Status.APPROVED
    assert purchase_order.approved_by == procurement_user
    assert PurchaseOrderStatusHistory.objects.filter(
        purchase_order=purchase_order,
        to_status=PurchaseOrder.Status.APPROVED,
        note="Budget approved",
    ).exists()

    invalid = procurement_client.post(
        f"/api/v1/operations/purchase-orders/{purchase_order_id}/approve/",
        format="json",
    )
    assert invalid.status_code == 200
    assert invalid.data["status"] == PurchaseOrder.Status.APPROVED


@pytest.mark.django_db
def test_inactive_supplier_cannot_receive_new_purchase_order(
    procurement_client,
    supplier,
    branch,
    medicine,
):
    supplier.is_active = False
    supplier.save(update_fields=("is_active", "updated_at"))
    response = procurement_client.post(
        "/api/v1/operations/purchase-orders/",
        purchase_order_payload(supplier, branch, medicine),
        format="json",
    )
    assert response.status_code == 400
    assert "supplier_id" in response.data["error"]["fields"]
