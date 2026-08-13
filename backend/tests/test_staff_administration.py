from io import BytesIO

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework.test import APIClient

from accounts.models import User
from catalog.models import Category, Manufacturer, Medicine, RecordStatus


def png(name="catalog.png"):
    content = BytesIO()
    Image.new("RGB", (256, 256), "teal").save(content, format="PNG")
    return SimpleUploadedFile(name, content.getvalue(), content_type="image/png")


@pytest.fixture
def operations_client(db):
    user = User.objects.create_user(
        email="portal-operations@example.test",
        password="Strong-Test-Password-123!",
        role=User.Role.STAFF,
        is_staff=True,
    )
    client = APIClient()
    client.force_authenticate(user)
    return client, user


@pytest.mark.django_db
def test_staff_medicine_crud_uses_existing_catalogue_models(operations_client, medicine):
    client, _ = operations_client
    created = client.post(
        "/api/v1/staff/medicines/",
        {
            "sku": "STAFF-CRUD-1",
            "brand_name": "Portal medicine",
            "brand_name_dari": "دوای پنل",
            "generic_name": "Example",
            "manufacturer_id": str(medicine.manufacturer_id),
            "category_id": str(medicine.category_id),
            "dosage_form_id": str(medicine.dosage_form_id),
            "status": Medicine.Status.DRAFT,
            "prescription_required": True,
        },
        format="json",
    )
    assert created.status_code == 201
    updated = client.patch(
        f"/api/v1/staff/medicines/{created.data['id']}/",
        {"status": Medicine.Status.ACTIVE, "strength": "250 mg"},
        format="json",
    )
    assert updated.status_code == 200
    assert updated.data["status"] == Medicine.Status.ACTIVE
    assert Medicine.objects.get(pk=created.data["id"]).strength == "250 mg"


@pytest.mark.django_db
def test_category_crud_and_media_are_staff_managed(operations_client, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    client, _ = operations_client
    created = client.post(
        "/api/v1/staff/categories/",
        {
            "name": "Respiratory",
            "name_dari": "تنفسی",
            "slug": "respiratory",
            "display_order": 4,
            "status": RecordStatus.ACTIVE,
            "image": png(),
        },
        format="multipart",
    )
    assert created.status_code == 201
    assert created.data["image_url"].endswith(
        f"/api/v1/staff/categories/{created.data['id']}/image/"
    )
    guarded_image = client.get(created.data["image_url"])
    assert guarded_image.status_code == 200
    public = client.get("/api/v1/categories/")
    assert any(item["slug"] == "respiratory" for item in public.data)
    deactivated = client.patch(
        f"/api/v1/staff/categories/{created.data['id']}/",
        {"status": RecordStatus.INACTIVE},
        format="json",
    )
    assert deactivated.status_code == 200
    assert not Category.objects.get(pk=created.data["id"]).status == RecordStatus.ACTIVE


@pytest.mark.django_db
def test_catalogue_lookups_include_dosage_forms(api_client, medicine):
    response = api_client.get("/api/v1/dosage-forms/")
    assert response.status_code == 200
    assert any(item["id"] == str(medicine.dosage_form_id) for item in response.data)


@pytest.mark.django_db
def test_manufacturer_crud_logo_and_public_visibility(
    operations_client, api_client, settings, tmp_path
):
    settings.MEDIA_ROOT = tmp_path
    client, _ = operations_client
    created = client.post(
        "/api/v1/staff/manufacturers/",
        {
            "name": "Example Health",
            "name_dari": "نمونه سلامت",
            "country_code": "af",
            "website": "https://example.test",
            "display_order": 3,
            "status": RecordStatus.ACTIVE,
            "logo": png("manufacturer.png"),
        },
        format="multipart",
    )
    assert created.status_code == 201
    assert created.data["country_code"] == "AF"
    assert created.data["logo_url"].endswith(
        f"/api/v1/staff/manufacturers/{created.data['id']}/logo/"
    )
    assert client.get(created.data["logo_url"]).status_code == 200

    public = api_client.get("/api/v1/manufacturers/")
    visible = next(row for row in public.data if row["id"] == created.data["id"])
    assert visible["name_dari"] == "نمونه سلامت"
    assert visible["logo_url"].endswith(f"/api/v1/manufacturers/{created.data['id']}/logo/")

    deactivated = client.patch(
        f"/api/v1/staff/manufacturers/{created.data['id']}/",
        {"status": RecordStatus.INACTIVE},
        format="json",
    )
    assert deactivated.status_code == 200
    assert not any(
        row["id"] == created.data["id"] for row in api_client.get("/api/v1/manufacturers/").data
    )
    assert Manufacturer.objects.filter(pk=created.data["id"]).exists()


@pytest.mark.django_db
def test_used_manufacturer_must_be_deactivated_not_deleted(operations_client, medicine):
    client, _ = operations_client
    response = client.delete(f"/api/v1/staff/manufacturers/{medicine.manufacturer_id}/")
    assert response.status_code == 400
    assert Manufacturer.objects.filter(pk=medicine.manufacturer_id).exists()


@pytest.mark.django_db
def test_customer_cannot_manage_manufacturers(authenticated_client):
    response = authenticated_client.post(
        "/api/v1/staff/manufacturers/",
        {"name": "Blocked manufacturer"},
        format="json",
    )
    assert response.status_code == 403
