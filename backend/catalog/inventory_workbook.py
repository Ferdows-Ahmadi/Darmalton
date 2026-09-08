"""Source-preserving inventory import. Raw source values are never public API fields."""

import hashlib
import json
from collections import Counter
from datetime import date, datetime, timedelta
from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.db import connection, transaction
from django.utils.text import slugify
from openpyxl import load_workbook

from .models import Category, DosageForm, InventoryBatch, Manufacturer, Medicine, MedicineImage


def clean(value):
    if isinstance(value, str):
        return value.strip() or None
    if isinstance(value, datetime | date):
        return value.date().isoformat() if isinstance(value, datetime) else value.isoformat()
    return value


def read_rows(sheet):
    values = list(sheet.values)
    headers = values[2]
    return [dict(zip(headers, map(clean, row), strict=False)) for row in values[3:] if row[0]]


def price(value):
    if value is None:
        return None
    result = Decimal(str(value))
    if not result.is_finite() or result < 0:
        raise ValueError("Prices must be finite and non-negative.")
    return result


def flag(value, *, allow_missing=False):
    if value is None and allow_missing:
        return False  # The exact source null remains in source_inventory.
    if str(value).lower() not in {"yes", "no"}:
        raise ValueError("Expected Yes or No flag.")
    return str(value).lower() == "yes"


def family_code(row):
    """Group only an exact brand/ingredient/form/manufacturer identity tuple."""
    identity = "|".join(
        str(row.get(field) or "").strip().casefold()
        for field in (
            "Medicine Name",
            "Generic Name / Active Ingredient",
            "Dosage Form",
            "Manufacturer",
        )
    )
    return f"family-{hashlib.sha256(identity.encode()).hexdigest()[:16]}"


def shopper_category(row):
    """Assign the development dataset to an explicit, non-clinical shopping layer."""
    text = " ".join(
        str(row.get(field) or "").casefold()
        for field in (
            "Medicine Name",
            "Generic Name / Active Ingredient",
            "Category",
            "Dosage Form",
        )
    )
    if any(value in text for value in ("vitamin", "supplement", "mineral", "omega")):
        return Medicine.ShopperCategory.VITAMINS_SUPPLEMENTS
    if any(value in text for value in ("baby", "infant", "pediatric", "paediatric")):
        return Medicine.ShopperCategory.BABY_CARE
    if any(value in text for value in ("skin", "cream", "ointment", "derma")):
        return Medicine.ShopperCategory.SKIN_CARE
    if any(value in text for value in ("device", "meter", "monitor", "thermometer")):
        return Medicine.ShopperCategory.MEDICAL_DEVICES
    if any(value in text for value in ("personal care", "hygiene", "shampoo", "soap")):
        return Medicine.ShopperCategory.PERSONAL_CARE
    return Medicine.ShopperCategory.MEDICINES


@transaction.atomic
def import_workbook(path, *, branch, dry_run=False, manifest_path=None, asset_root=None):
    if settings.PRODUCTION or not getattr(settings, "DEVELOPMENT_SAMPLE_DATA", False):
        raise ValueError(
            "Sample import requires DEVELOPMENT_SAMPLE_DATA=true and non-production settings."
        )
    if connection.settings_dict.get("HOST") not in {"127.0.0.1", "localhost", ""}:
        raise ValueError("Sample import is restricted to a local database host.")
    workbook = load_workbook(path, data_only=True, read_only=True)
    try:
        medicines = read_rows(workbook["Medicines"])
        batches = read_rows(workbook["Stock - Batches"])
    finally:
        workbook.close()
    skus = [r["Medicine Code / SKU"] for r in medicines]
    barcode_counts = Counter(str(r["Barcode"]) for r in medicines if r["Barcode"])
    if len(skus) != len(set(skus)):
        raise ValueError("Duplicate medicine SKUs in workbook.")
    report = dict(
        medicine_rows=len(medicines),
        source_batch_rows=len(batches),
        created=0,
        updated=0,
        skipped=0,
        inactive=0,
        batches_created=0,
        batches_skipped=0,
        images_mapped=0,
        missing_images=[],
        dry_run=dry_run,
    )
    report["synthetic_fields"] = {}
    report["synthetic_batches"] = 0
    manifest = json.loads(Path(manifest_path).read_text()) if manifest_path else {}
    for row in medicines:
        sku = row["Medicine Code / SKU"]
        category = None
        if row["Category"]:
            category, _ = Category.objects.get_or_create(
                slug=slugify(row["Category"]), defaults={"name": row["Category"]}
            )
        manufacturer = None
        if row["Manufacturer"]:
            manufacturer, _ = Manufacturer.objects.get_or_create(name=row["Manufacturer"])
        form, _ = DosageForm.objects.get_or_create(
            name=row["Dosage Form"],
            defaults={
                "code": slugify(row["Dosage Form"])[:25]
                + "-"
                + hashlib.sha256(row["Dosage Form"].encode()).hexdigest()[:8]
            },
        )
        active = flag(row["Active?"])
        defaults = dict(
            brand_name=row["Medicine Name"],
            brand_name_dari=row["Dari Name"] or "",
            generic_name=row["Generic Name / Active Ingredient"] or "",
            strength=row["Strength"] or "",
            dosage_form=form,
            category=category,
            manufacturer=manufacturer,
            country_of_manufacture=row["Country of Manufacture"] or "",
            pack_size=row["Pack Size"] or "",
            barcode=(
                str(row["Barcode"])
                if row["Barcode"] and barcode_counts[str(row["Barcode"])] == 1
                else None
            ),
            description=row["Description"] or "",
            storage_instructions=row["Storage Instructions"] or "",
            prescription_required=flag(row["Prescription Required?"], allow_missing=True),
            family_code=family_code(row),
            shopper_category=shopper_category(row),
            status=Medicine.Status.ACTIVE if active else Medicine.Status.INACTIVE,
            list_price=price(row["Selling Price (AFN)"]),
            source_inventory=row,
        )
        # Parse cost to validate without copying it to public fields.
        price(row["Purchase/Cost Price (AFN)"])
        obj, created = Medicine.objects.update_or_create(sku=sku, defaults=defaults)
        report["created" if created else "updated"] += 1
        report["inactive"] += not active
        image = manifest.get(sku, {})
        if image.get("stored_path") and asset_root:
            image_path = Path(asset_root).resolve() / image["stored_path"].lstrip("/")
            if (
                not image_path.resolve().is_relative_to(Path(asset_root).resolve())
                or not image_path.is_file()
            ):
                raise ValueError(f"Missing or invalid mapped image for {sku}.")
            # Reference optimized files in the configured media root; no file writes in dry runs.

            relative = image_path.resolve().relative_to(Path(settings.MEDIA_ROOT).resolve())
            MedicineImage.objects.update_or_create(
                medicine=obj,
                image=relative.as_posix(),
                defaults={"alt_text": f"{obj.brand_name} {obj.strength}"[:180], "is_primary": True},
            )
            report["images_mapped"] += 1
        else:
            report["missing_images"].append(sku)
    source_skus = {r["Medicine Code / SKU"] for r in batches}
    for sku in skus:
        if sku not in source_skus:
            batches.append({"Medicine Code / SKU": sku})
            report["synthetic_batches"] += 1
    seen = set()
    for row in batches:
        sku = row["Medicine Code / SKU"]
        if sku not in skus:
            raise ValueError(f"Stock references missing medicine {sku}.")
        original_row = dict(row)
        number = str(row.get("Batch Number")) if row.get("Batch Number") is not None else None
        medicine = Medicine.objects.get(sku=sku)
        index = int(sku.split("-")[-1])
        sale = medicine.list_price
        if sale is None:
            sale = price(row.get("Selling Price (AFN)"))
        if sale is None:
            sale = Decimal(100 + (index % 5) * 20)
        defaults = {
            "Batch Number": f"DEMO-{sku}-202609",
            "Quantity in Stock": 20 + (index % 6) * 10,
            "Expiry Date": (date(2029, 9, 1) + timedelta(days=index)).isoformat(),
            "Selling Price (AFN)": float(sale),
            "Purchase Price (AFN)": float((sale * Decimal("0.70")).quantize(Decimal("0.01"))),
            "Warehouse/Location": "Sample Main Pharmacy",
            "Rack/Shelf": f"DEMO-{1 + index // 10:02}",
            "Supplier": "Synthetic development supplier",
            "Received Date": "2026-09-06",
        }
        generated = {k: v for k, v in defaults.items() if row.get(k) is None}
        row = {**row, **generated}
        report["synthetic_fields"][sku] = list(generated)
        source_record = {
            "source": original_row,
            "synthetic_development_values": generated,
            "sample": True,
        }
        number = str(row["Batch Number"])
        key = f"darmalton-workbook:{sku}:{number or 'unspecified'}"
        if key in seen:
            raise ValueError(f"Ambiguous duplicate stock row for {sku}.")
        seen.add(key)
        quantity = row["Quantity in Stock"]
        if quantity is not None and (int(quantity) != quantity or quantity < 0):
            raise ValueError(f"Invalid stock quantity for {sku}.")
        existing = InventoryBatch.objects.select_for_update().filter(source_import_key=key).first()
        if existing:
            if existing.branch_id != branch.pk or existing.source_inventory != source_record:
                raise ValueError(
                    f"Imported batch changed for {sku}; reconcile it through inventory operations."
                )
            # Never replenish already sold stock when the identical workbook is rerun.
            report["batches_skipped"] += 1
            continue
        medicine = Medicine.objects.get(sku=sku)
        if (
            number
            and InventoryBatch.objects.filter(
                branch=branch, medicine=medicine, batch_number=number
            ).exists()
        ):
            raise ValueError(f"Existing unrelated batch conflicts with {sku}/{number}.")
        InventoryBatch.objects.create(
            source_import_key=key,
            source_inventory=source_record,
            medicine=medicine,
            branch=branch,
            batch_number=number,
            available_quantity=quantity,
            expiry_date=row["Expiry Date"],
            purchase_price=price(row["Purchase Price (AFN)"]),
            selling_price=medicine.list_price
            if medicine.list_price is not None
            else price(row["Selling Price (AFN)"]),
            source_location=row["Warehouse/Location"],
            source_shelf=row["Rack/Shelf"],
            source_supplier=row["Supplier"],
            received_date=row["Received Date"],
        )
        report["batches_created"] += 1
    if dry_run:
        transaction.set_rollback(True)
    return report
