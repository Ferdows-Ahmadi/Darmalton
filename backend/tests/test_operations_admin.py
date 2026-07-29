import pytest
from django.contrib.admin.sites import AdminSite
from django.test import RequestFactory

from accounts.models import User
from catalog.admin import InventoryBatchAdmin, quarantine_inventory_batches
from catalog.models import InventoryBatch
from operations.admin import (
    InventoryTransactionAdmin,
    PurchaseOrderAdmin,
    ReturnRequestAdmin,
    SupplierAdmin,
)
from operations.models import (
    InventoryQualityInspection,
    InventoryTransaction,
    PurchaseOrder,
    ReturnRequest,
    Supplier,
)


@pytest.fixture
def admin_request(db):
    user = User.objects.create_superuser(
        email="admin-operations@example.test",
        password="Strong-Test-Password-123!",
    )
    request = RequestFactory().get("/admin/")
    request.user = user
    return request


@pytest.mark.django_db
def test_audit_models_and_workflow_records_cannot_be_added_or_deleted_in_admin(
    admin_request,
):
    site = AdminSite()
    assert InventoryTransactionAdmin(InventoryTransaction, site).has_add_permission(
        admin_request
    ) is False
    assert InventoryTransactionAdmin(InventoryTransaction, site).has_delete_permission(
        admin_request
    ) is False
    assert PurchaseOrderAdmin(PurchaseOrder, site).has_add_permission(admin_request) is False
    assert PurchaseOrderAdmin(PurchaseOrder, site).has_delete_permission(admin_request) is False
    assert ReturnRequestAdmin(ReturnRequest, site).has_add_permission(admin_request) is False
    assert ReturnRequestAdmin(ReturnRequest, site).has_delete_permission(admin_request) is False
    assert SupplierAdmin(Supplier, site).has_delete_permission(admin_request) is False


@pytest.mark.django_db
def test_inventory_admin_quarantine_uses_audited_inspection_service(
    admin_request,
    medicine,
    monkeypatch,
):
    batch = medicine.batches.get()
    model_admin = InventoryBatchAdmin(InventoryBatch, AdminSite())
    monkeypatch.setattr(model_admin, "message_user", lambda *args, **kwargs: None)
    quarantine_inventory_batches(
        model_admin,
        admin_request,
        InventoryBatch.objects.filter(pk=batch.pk),
    )
    batch.refresh_from_db()
    assert batch.quality_status == InventoryBatch.QualityStatus.QUARANTINED
    assert batch.is_active is False
    assert InventoryQualityInspection.objects.filter(
        batch=batch,
        inspected_by=admin_request.user,
        to_status=InventoryBatch.QualityStatus.QUARANTINED,
    ).exists()
