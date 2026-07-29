from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User
from commerce.models import Order
from commerce.services import create_order
from operations.models import InventoryTransaction, ReturnRequest

from .test_api import add_cart, make_address


@pytest.fixture
def returns_staff(db):
    return User.objects.create_user(
        email="returns@example.test",
        password="Strong-Test-Password-123!",
        role=User.Role.STAFF,
    )


@pytest.fixture
def returns_staff_client(returns_staff):
    client = APIClient()
    client.force_authenticate(returns_staff)
    return client


def delivered_order(user, branch, medicine, quantity=2):
    add_cart(user, branch, medicine, quantity=quantity)
    order = create_order(customer=user, address=make_address(user))
    Order.objects.filter(pk=order.pk).update(status=Order.Status.DELIVERED)
    order.refresh_from_db()
    return order


def request_return(client, order, quantity=1, pickup_required=False):
    return client.post(
        "/api/v1/returns/",
        {
            "order_id": str(order.pk),
            "reason": "Package no longer needed",
            "customer_notes": "The seal is intact.",
            "pickup_required": pickup_required,
            "items": [
                {
                    "order_item_id": str(order.items.get().pk),
                    "quantity": quantity,
                }
            ],
        },
        format="json",
    )


@pytest.mark.django_db
def test_return_workflow_restores_verified_stock_and_records_manual_refund(
    authenticated_client,
    user,
    branch,
    medicine,
    returns_staff,
    returns_staff_client,
):
    order = delivered_order(user, branch, medicine)
    batch = medicine.batches.get()
    assert batch.available_quantity == 3

    created = request_return(authenticated_client, order, pickup_required=True)
    assert created.status_code == 201
    return_request = ReturnRequest.objects.get(pk=created.data["id"])
    return_item = return_request.items.get()
    assert return_request.requested_refund_amount == 10
    assert return_request.pickup_status == ReturnRequest.PickupStatus.REQUESTED

    approved = returns_staff_client.post(
        f"/api/v1/operations/returns/{return_request.pk}/approve/",
        {
            "items": [
                {
                    "return_item_id": str(return_item.pk),
                    "quantity_approved": 1,
                }
            ],
            "note": "Eligible within return window.",
        },
        format="json",
    )
    assert approved.status_code == 200
    assert approved.data["status"] == ReturnRequest.Status.APPROVED

    pickup = returns_staff_client.post(
        f"/api/v1/operations/returns/{return_request.pk}/schedule-pickup/",
        {
            "scheduled_at": (timezone.now() + timedelta(days=1)).isoformat(),
        },
        format="json",
    )
    assert pickup.status_code == 200
    assert pickup.data["pickup_status"] == ReturnRequest.PickupStatus.SCHEDULED
    assert (
        returns_staff_client.post(
            f"/api/v1/operations/returns/{return_request.pk}/mark-picked-up/",
            format="json",
        ).status_code
        == 200
    )

    received = returns_staff_client.post(
        f"/api/v1/operations/returns/{return_request.pk}/receive/",
        {
            "items": [
                {
                    "return_item_id": str(return_item.pk),
                    "quantity_received": 1,
                }
            ]
        },
        format="json",
    )
    assert received.status_code == 200

    verified = returns_staff_client.post(
        f"/api/v1/operations/returns/{return_request.pk}/verify/",
        {
            "items": [
                {
                    "return_item_id": str(return_item.pk),
                    "condition": "UNOPENED",
                    "restock_eligible": True,
                    "notes": "Seal and expiry verified.",
                }
            ]
        },
        format="json",
    )
    assert verified.status_code == 200
    assert verified.data["status"] == ReturnRequest.Status.REFUND_PENDING
    batch.refresh_from_db()
    assert batch.available_quantity == 4
    restoration = InventoryTransaction.objects.get(
        return_request=return_request,
        transaction_type=InventoryTransaction.TransactionType.CUSTOMER_RETURN,
    )
    assert restoration.previous_quantity == 3
    assert restoration.resulting_quantity == 4
    assert restoration.verified_by == returns_staff

    refunded = returns_staff_client.post(
        f"/api/v1/operations/returns/{return_request.pk}/complete-refund/",
        {
            "reference": "MANUAL-REFUND-001",
            "note": "Cash refund recorded by cashier.",
        },
        format="json",
    )
    assert refunded.status_code == 200
    return_request.refresh_from_db()
    assert return_request.status == ReturnRequest.Status.REFUNDED
    assert return_request.refund_status == ReturnRequest.RefundStatus.COMPLETED
    assert return_request.refund_reference == "MANUAL-REFUND-001"
    assert return_request.refund_processed_by == returns_staff
    assert order.payment_status == Order.PaymentStatus.UNPAID


@pytest.mark.django_db
def test_damaged_return_does_not_restore_inventory(
    authenticated_client,
    user,
    branch,
    medicine,
    returns_staff_client,
):
    order = delivered_order(user, branch, medicine, quantity=1)
    batch = medicine.batches.get()
    created = request_return(authenticated_client, order)
    return_request = ReturnRequest.objects.get(pk=created.data["id"])
    return_item = return_request.items.get()
    returns_staff_client.post(
        f"/api/v1/operations/returns/{return_request.pk}/approve/",
        {
            "items": [
                {
                    "return_item_id": str(return_item.pk),
                    "quantity_approved": 1,
                }
            ]
        },
        format="json",
    )
    returns_staff_client.post(
        f"/api/v1/operations/returns/{return_request.pk}/receive/",
        {
            "items": [
                {
                    "return_item_id": str(return_item.pk),
                    "quantity_received": 1,
                }
            ]
        },
        format="json",
    )
    response = returns_staff_client.post(
        f"/api/v1/operations/returns/{return_request.pk}/verify/",
        {
            "items": [
                {
                    "return_item_id": str(return_item.pk),
                    "condition": "DAMAGED",
                    "restock_eligible": True,
                }
            ]
        },
        format="json",
    )
    assert response.status_code == 200
    batch.refresh_from_db()
    assert batch.available_quantity == 4
    assert not InventoryTransaction.objects.filter(
        return_request=return_request,
        transaction_type=InventoryTransaction.TransactionType.CUSTOMER_RETURN,
    ).exists()


@pytest.mark.django_db
def test_return_permissions_ownership_and_quantity_limits(
    authenticated_client,
    user,
    other_user,
    branch,
    medicine,
):
    order = delivered_order(user, branch, medicine, quantity=1)
    too_many = request_return(authenticated_client, order, quantity=2)
    assert too_many.status_code == 400
    assert "items" in too_many.data["error"]["fields"]

    created = request_return(authenticated_client, order)
    assert created.status_code == 201
    return_id = created.data["id"]

    other_client = APIClient()
    other_client.force_authenticate(other_user)
    assert other_client.get(f"/api/v1/returns/{return_id}/").status_code == 404
    assert other_client.get("/api/v1/operations/returns/").status_code == 403

    duplicate = request_return(authenticated_client, order)
    assert duplicate.status_code == 400
    assert "items" in duplicate.data["error"]["fields"]


@pytest.mark.django_db
def test_only_delivered_orders_can_be_returned(
    authenticated_client,
    user,
    branch,
    medicine,
):
    add_cart(user, branch, medicine, quantity=1)
    order = create_order(customer=user, address=make_address(user))
    response = request_return(authenticated_client, order)
    assert response.status_code == 400
    assert "order_id" in response.data["error"]["fields"]
