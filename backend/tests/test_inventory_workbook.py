import json
from datetime import date
from decimal import Decimal

import pytest
from openpyxl import Workbook

from catalog.inventory_workbook import import_workbook
from catalog.models import InventoryBatch, Medicine
from catalog.serializers import MedicineSerializer


@pytest.fixture
def sample_workbook(tmp_path, settings):
    settings.DEVELOPMENT_SAMPLE_DATA = True
    w = Workbook()
    m = w.active
    m.title = "Medicines"
    m.append(["Sample"])
    m.append(["Test fixture"])
    m.append(
        [
            "Medicine Code / SKU",
            "Medicine Name",
            "Generic Name / Active Ingredient",
            "Dari Name",
            "Strength",
            "Dosage Form",
            "Category",
            "Manufacturer",
            "Country of Manufacture",
            "Pack Size",
            "Prescription Required?",
            "Selling Price (AFN)",
            "Purchase/Cost Price (AFN)",
            "Barcode",
            "Description",
            "Storage Instructions",
            "Active?",
        ]
    )
    m.append(
        [
            "MED-0001",
            "Source Speling",
            "Ingredient",
            None,
            "500 mg",
            "Tablet",
            "Example",
            "Maker",
            "Pakistan",
            "10 tablets",
            "No",
            120,
            85,
            None,
            "Source description",
            None,
            "Yes",
        ]
    )
    s = w.create_sheet("Stock - Batches")
    s.append(["Sample"])
    s.append(["Test fixture"])
    s.append(
        [
            "Medicine Code / SKU",
            "Batch Number",
            "Quantity in Stock",
            "Expiry Date",
            "Purchase Price (AFN)",
            "Selling Price (AFN)",
            "Warehouse/Location",
            "Rack/Shelf",
            "Supplier",
            "Received Date",
        ]
    )
    s.append(["MED-0001"])
    path = tmp_path / "sample.xlsx"
    w.save(path)
    return path


@pytest.mark.django_db
def test_sample_import_dry_run_and_rerun_preserve_consumed_stock(sample_workbook, branch):
    report = import_workbook(sample_workbook, branch=branch, dry_run=True)
    assert report["medicine_rows"] == 1
    assert report["source_batch_rows"] == 1
    assert report["created"] == 1
    assert not Medicine.objects.exists()
    result = import_workbook(sample_workbook, branch=branch)
    assert result["batches_created"] == 1
    medicine = Medicine.objects.get(sku="MED-0001")
    assert medicine.brand_name == "Source Speling"
    assert medicine.list_price == Decimal("120")
    batch = InventoryBatch.objects.get(medicine=medicine)
    assert batch.available_quantity == 30
    assert batch.expiry_date == date(2029, 9, 2)
    assert batch.purchase_price == Decimal("84")
    assert batch.source_inventory["sample"] is True
    assert batch.source_inventory["source"]["Quantity in Stock"] is None
    assert batch.source_inventory["synthetic_development_values"] == {
        "Batch Number": "DEMO-MED-0001-202609",
        "Quantity in Stock": 30,
        "Expiry Date": "2029-09-02",
        "Selling Price (AFN)": 120.0,
        "Purchase Price (AFN)": 84.0,
        "Warehouse/Location": "Sample Main Pharmacy",
        "Rack/Shelf": "DEMO-01",
        "Supplier": "Synthetic development supplier",
        "Received Date": "2026-09-06",
    }
    batch.available_quantity = 7
    batch.save()
    rerun = import_workbook(sample_workbook, branch=branch)
    batch.refresh_from_db()
    assert rerun["batches_skipped"] == 1
    assert batch.available_quantity == 7
    public = MedicineSerializer(medicine).data
    assert public["price"] == "120.00"
    assert "source_inventory" not in public
    assert "purchase_price" not in public


@pytest.mark.django_db
def test_sample_import_maps_only_supplied_product_images(
    sample_workbook, branch, settings, tmp_path
):
    settings.MEDIA_ROOT = tmp_path
    product_dir = tmp_path / "products"
    product_dir.mkdir()
    (product_dir / "MED-0001.webp").write_bytes(b"test image placeholder")
    manifest = tmp_path / "manifest.json"
    manifest.write_text(
        json.dumps({"MED-0001": {"stored_path": "/products/MED-0001.webp"}}),
        encoding="utf-8",
    )

    report = import_workbook(
        sample_workbook,
        branch=branch,
        manifest_path=manifest,
        asset_root=tmp_path,
    )

    medicine = Medicine.objects.get(sku="MED-0001")
    assert report["images_mapped"] == 1
    assert report["missing_images"] == []
    assert medicine.images.get(is_primary=True).image.name == "products/MED-0001.webp"


@pytest.mark.django_db
def test_sample_import_rejects_production(sample_workbook, branch, settings):
    settings.PRODUCTION = True
    with pytest.raises(ValueError, match="non-production"):
        import_workbook(sample_workbook, branch=branch)
    assert not Medicine.objects.exists()
