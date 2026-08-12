from datetime import timedelta
from io import BytesIO

import pytest
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django.utils import timezone
from openpyxl import Workbook

from accounts.models import User
from catalog.bulk_import import MEDICINE_HEADERS, STOCK_HEADERS, confirm_import
from catalog.models import (
    Category,
    DosageForm,
    InventoryBatch,
    Manufacturer,
    Medicine,
    MedicineImportJob,
)
from operations.models import InventoryTransaction, StorageLocation, Supplier, Warehouse


def make_upload(*, sku="NEW-001", barcode="998877", invalid_category=False):
    workbook = Workbook()
    medicines = workbook.active
    medicines.title = "Medicines"
    medicines.append(MEDICINE_HEADERS)
    medicines.append(
        (
            sku,
            "Imported medicine",
            "Ingredient",
            "داروی واردشده",
            "500 mg",
            "Tablet",
            "Missing" if invalid_category else "Pain",
            "Import Maker",
            "AF",
            "24 tablets",
            "No",
            "120",
            "80",
            barcode,
            "Description",
            "Keep dry",
            "Yes",
        )
    )
    stock = workbook.create_sheet("Stock - Batches")
    stock.append(STOCK_HEADERS)
    stock.append(
        (
            sku,
            "IMPORT-BATCH-1",
            12,
            timezone.localdate() + timedelta(days=365),
            "80",
            "120",
            "MAIN/L1",
            "R1/S1",
            "SUP-1",
            timezone.localdate(),
        )
    )
    content = BytesIO()
    workbook.save(content)
    workbook.close()
    return SimpleUploadedFile(
        "medicines.xlsx",
        content.getvalue(),
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@pytest.fixture
def import_references(db, branch):
    Category.objects.create(name="Pain", slug="import-pain")
    DosageForm.objects.get_or_create(code="TABLET", defaults={"name": "Tablet"})
    warehouse = Warehouse.objects.create(branch=branch, code="MAIN", name="Main")
    StorageLocation.objects.create(
        warehouse=warehouse,
        code="L1",
        name="Rack one",
        rack="R1",
        shelf="S1",
    )
    Supplier.objects.create(
        code="SUP-1",
        company_name="Supplier one",
        contact_name="Contact",
        primary_phone="0700000000",
        address="Kabul",
    )


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        email="catalog-admin@example.test",
        password="Strong-Test-Password-123!",
        role=User.Role.ADMIN,
        is_staff=True,
    )


@pytest.mark.django_db
def test_bulk_import_rejects_non_administrator(api_client, import_references):
    staff = User.objects.create_user(
        email="catalog-staff@example.test",
        password="Strong-Test-Password-123!",
        role=User.Role.STAFF,
        is_staff=True,
    )
    api_client.force_authenticate(staff)
    response = api_client.post(
        reverse("staff-medicine-import-preview"),
        {"mode": MedicineImportJob.Mode.CREATE_NEW, "file": make_upload()},
        format="multipart",
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_bulk_import_rejects_malformed_workbook(api_client, admin_user):
    api_client.force_authenticate(admin_user)
    upload = SimpleUploadedFile("bad.xlsx", b"not a workbook")
    response = api_client.post(
        reverse("staff-medicine-import-preview"),
        {"mode": MedicineImportJob.Mode.CREATE_NEW, "file": upload},
        format="multipart",
    )
    assert response.status_code == 400
    assert "malformed" in str(response.data).lower()


@pytest.mark.django_db
def test_preview_reports_invalid_reference_without_mutation(
    api_client, admin_user, import_references
):
    api_client.force_authenticate(admin_user)
    response = api_client.post(
        reverse("staff-medicine-import-preview"),
        {
            "mode": MedicineImportJob.Mode.CREATE_NEW,
            "file": make_upload(invalid_category=True),
        },
        format="multipart",
    )
    assert response.status_code == 201
    assert response.data["validation_report"]["summary"]["error_count"] == 1
    assert response.data["validation_report"]["errors"][0]["row"] == 2
    assert not Medicine.objects.filter(sku="NEW-001").exists()


@pytest.mark.django_db
def test_preview_reports_duplicate_sku_and_barcode(api_client, admin_user, import_references):
    api_client.force_authenticate(admin_user)
    medicine = Medicine.objects.create(
        sku="EXISTING-001",
        brand_name="Existing",
        manufacturer=Manufacturer.objects.create(name="Existing Maker"),
        category=Category.objects.get(name="Pain"),
        dosage_form=DosageForm.objects.get(code="TABLET"),
        barcode="998877",
    )
    response = api_client.post(
        reverse("staff-medicine-import-preview"),
        {
            "mode": MedicineImportJob.Mode.CREATE_NEW,
            "file": make_upload(sku=medicine.sku),
        },
        format="multipart",
    )
    assert response.status_code == 201
    messages = [item["message"] for item in response.data["validation_report"]["errors"]]
    assert any("already exists" in item for item in messages)


@pytest.mark.django_db
def test_confirm_import_creates_batch_and_immutable_ledger(
    api_client, admin_user, import_references
):
    api_client.force_authenticate(admin_user)
    preview = api_client.post(
        reverse("staff-medicine-import-preview"),
        {"mode": MedicineImportJob.Mode.CREATE_NEW, "file": make_upload()},
        format="multipart",
    )
    assert preview.status_code == 201
    assert preview.data["validation_report"]["summary"]["error_count"] == 0
    confirmed = api_client.post(
        reverse("staff-medicine-import-confirm", kwargs={"pk": preview.data["id"]}),
        {},
        format="json",
    )
    assert confirmed.status_code == 200
    assert confirmed.data["status"] == MedicineImportJob.Status.COMPLETED
    medicine = Medicine.objects.get(sku="NEW-001")
    assert medicine.storage_instructions == "Keep dry"
    batch = InventoryBatch.objects.get(medicine=medicine, batch_number="IMPORT-BATCH-1")
    assert batch.available_quantity == 12
    assert batch.quality_status == InventoryBatch.QualityStatus.PENDING
    movement = InventoryTransaction.objects.get(batch=batch)
    assert movement.transaction_type == InventoryTransaction.TransactionType.PURCHASE
    assert movement.resulting_quantity == 12


@pytest.mark.django_db
def test_confirm_import_rolls_back_every_change_on_failure(
    monkeypatch, admin_user, import_references
):
    from catalog import bulk_import

    upload = make_upload()
    job = bulk_import.build_import_preview(
        upload=upload,
        mode=MedicineImportJob.Mode.CREATE_NEW,
        actor=admin_user,
    )

    def fail_ledger(**kwargs):
        raise ValidationError("simulated ledger failure")

    monkeypatch.setattr(bulk_import, "record_inventory_change", fail_ledger)
    with pytest.raises(ValidationError, match="simulated"):
        confirm_import(job=job, actor=admin_user)
    assert not Medicine.objects.filter(sku="NEW-001").exists()
    job.refresh_from_db()
    assert job.status == MedicineImportJob.Status.PREVIEWED
