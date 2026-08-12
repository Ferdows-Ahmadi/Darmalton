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
    assert (
        operations_client.delete(f"/api/v1/operations/suppliers/{supplier.pk}/").status_code == 405
    )


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


@pytest.mark.django_db
def test_operations_lookups_and_location_totals(
    operations_client,
    branch,
    medicine,
):
    from operations.models import StorageLocation, Warehouse

    warehouse = Warehouse.objects.create(branch=branch, code="WH-OPS", name="Operations")
    location = StorageLocation.objects.create(
        warehouse=warehouse,
        code="OPS-A-01",
        rack="A",
        shelf="01",
    )
    batch = medicine.batches.get()
    batch.storage_location = location
    batch.save(update_fields=("storage_location", "updated_at"))

    branches = operations_client.get("/api/v1/operations/branches/")
    assert branches.status_code == 200
    assert any(item["id"] == str(branch.pk) for item in branches.data)

    warehouses = operations_client.get("/api/v1/operations/warehouses/")
    assert warehouses.status_code == 200
    row = next(item for item in warehouses.data["results"] if item["id"] == str(warehouse.pk))
    assert row["branch_name"] == branch.name
    assert row["location_count"] == 1
    assert row["stock_quantity"] == batch.available_quantity

    locations = operations_client.get("/api/v1/operations/storage-locations/?is_active=true")
    assert locations.status_code == 200
    row = next(item for item in locations.data["results"] if item["id"] == str(location.pk))
    assert row["batch_count"] == 1
    assert row["stock_quantity"] == batch.available_quantity
