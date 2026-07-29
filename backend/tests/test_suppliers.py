from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from accounts.models import User
from operations.models import Supplier


@pytest.fixture
def operations_user(db):
    return User.objects.create_user(
        email="operations@example.test",
        password="Strong-Test-Password-123!",
        role=User.Role.STAFF,
    )


@pytest.fixture
def operations_client(operations_user):
    client = APIClient()
    client.force_authenticate(operations_user)
    return client


def supplier_payload(**overrides):
    return {
        "code": "SUP-001",
        "company_name": "Kabul Medical Supply",
        "contact_name": "Operations Contact",
        "email": "SUPPLIER@EXAMPLE.TEST",
        "primary_phone": "0700 123 456",
        "address": "Kabul, Afghanistan",
        "pharmacy_license_number": "PH-LICENSE-001",
        "payment_terms_days": 30,
        "rating": "4.50",
        **overrides,
    }


@pytest.mark.django_db
def test_supplier_api_rejects_anonymous_and_customer(api_client, authenticated_client):
    anonymous_client = APIClient()
    assert anonymous_client.get("/api/v1/operations/suppliers/").status_code in {401, 403}
    assert authenticated_client.get("/api/v1/operations/suppliers/").status_code == 403


@pytest.mark.django_db
def test_operations_staff_can_create_filter_and_update_supplier(operations_client):
    response = operations_client.post(
        "/api/v1/operations/suppliers/",
        supplier_payload(code="sup-001"),
        format="json",
    )
    assert response.status_code == 201
    supplier = Supplier.objects.get()
    assert supplier.code == "SUP-001"
    assert supplier.email == "supplier@example.test"
    assert supplier.rating == Decimal("4.50")

    response = operations_client.get("/api/v1/operations/suppliers/?is_active=true&search=Kabul")
    assert response.status_code == 200
    assert response.data["count"] == 1

    response = operations_client.patch(
        f"/api/v1/operations/suppliers/{supplier.pk}/",
        {"is_active": False},
        format="json",
    )
    assert response.status_code == 200
    supplier.refresh_from_db()
    assert supplier.is_active is False


@pytest.mark.django_db
def test_supplier_verification_requires_license(operations_client):
    response = operations_client.post(
        "/api/v1/operations/suppliers/",
        supplier_payload(
            code="SUP-UNLICENSED",
            pharmacy_license_number="",
            is_verified=True,
        ),
        format="json",
    )
    assert response.status_code == 400
    assert "is_verified" in response.data["error"]["fields"]


@pytest.mark.django_db
def test_supplier_rating_is_bounded(operations_client):
    response = operations_client.post(
        "/api/v1/operations/suppliers/",
        supplier_payload(code="SUP-RATING", rating="5.01"),
        format="json",
    )
    assert response.status_code == 400
    assert "rating" in response.data["error"]["fields"]
