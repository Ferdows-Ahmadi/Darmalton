from datetime import timedelta
from decimal import Decimal

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User
from catalog.models import (
    Category,
    DosageForm,
    InventoryBatch,
    Manufacturer,
    Medicine,
    Pharmacy,
    PharmacyBranch,
)


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="buyer@example.test", password="Strong-Test-Password-123!"
    )


@pytest.fixture
def other_user(db):
    return User.objects.create_user(
        email="other@example.test", password="Strong-Test-Password-123!"
    )


@pytest.fixture
def branch(db):
    pharmacy = Pharmacy.objects.create(name="Test Pharmacy", license_number="TEST-LICENSE")
    return PharmacyBranch.objects.create(
        pharmacy=pharmacy, name="Test Branch", address_text="Test address"
    )


@pytest.fixture
def medicine(db, branch):
    category = Category.objects.create(name="Pain", slug="pain")
    manufacturer = Manufacturer.objects.create(name="Maker")
    form = DosageForm.objects.create(code="TABLET", name="Tablet")
    item = Medicine.objects.create(
        sku="TEST-001",
        brand_name="TestMed",
        generic_name="Test Ingredient",
        manufacturer=manufacturer,
        category=category,
        dosage_form=form,
        strength="500 mg",
    )
    InventoryBatch.objects.create(
        medicine=item,
        branch=branch,
        batch_number="B-LATE",
        expiry_date=timezone.localdate() + timedelta(days=200),
        available_quantity=5,
        purchase_price=Decimal("6.00"),
        selling_price=Decimal("10.00"),
    )
    return item


@pytest.fixture
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client
