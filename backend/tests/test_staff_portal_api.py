from decimal import Decimal

import pytest

from accounts.models import User
from commerce.models import Order

pytestmark = pytest.mark.django_db


def make_order(*, customer, branch, number="OP-STAFF-001"):
    return Order.objects.create(
        order_number=number,
        customer=customer,
        branch=branch,
        subtotal=Decimal("120.00"),
        grand_total=Decimal("120.00"),
        delivery_address={"city": "Kabul"},
    )


def test_operations_staff_can_list_and_transition_orders(api_client, user, branch):
    order = make_order(customer=user, branch=branch)
    staff = User.objects.create_user(
        email="portal-staff@example.test",
        password="Strong-Test-Password-123!",
        role=User.Role.STAFF,
    )
    api_client.force_authenticate(staff)

    listing = api_client.get("/api/v1/staff/orders/?search=buyer")
    assert listing.status_code == 200
    assert listing.data["results"][0]["customer_email"] == user.email

    transitioned = api_client.post(
        f"/api/v1/staff/orders/{order.pk}/transition/",
        {"status": Order.Status.CONFIRMED, "note": "Confirmed in staff portal"},
        format="json",
    )
    assert transitioned.status_code == 200
    assert transitioned.data["status"] == Order.Status.CONFIRMED
    assert order.status_history.filter(to_status=Order.Status.CONFIRMED).exists()


def test_customer_cannot_access_staff_orders(authenticated_client):
    response = authenticated_client.get("/api/v1/staff/orders/")
    assert response.status_code == 403


def test_operations_staff_can_list_customer_summary(api_client, user, branch):
    make_order(customer=user, branch=branch)
    staff = User.objects.create_user(
        email="customer-service@example.test",
        password="Strong-Test-Password-123!",
        role=User.Role.STAFF,
    )
    api_client.force_authenticate(staff)

    response = api_client.get("/api/v1/auth/staff/customers/?search=buyer")
    assert response.status_code == 200
    assert response.data["results"][0]["email"] == user.email
    assert response.data["results"][0]["order_count"] == 1
    assert response.data["results"][0]["total_spent"] == "120.00"
