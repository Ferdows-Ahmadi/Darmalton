# Local sample inventory

The user clarified on 2026-09-06 that the workbook is development/demo data. This supersedes the master prompt's instruction to leave operational blanks empty.

The importer requires `DEVELOPMENT_SAMPLE_DATA=true`, non-production settings and a local database host. Rebuild validation uses only `darmalton_final_rebuild` on localhost port 55432. It does not load production environment files.

For this rebuild, the mapped sample product files live under `website/public/products`. Run the local backend that reads the imported image records with `DJANGO_MEDIA_ROOT` set to the absolute `website/public` directory. This is local sample-data wiring only; production media configuration remains unchanged.

Deterministic defaults, where `n` is the SKU number:

- Missing quantity: `20 + (n % 6) * 10` units.
- Missing expiry: 2029-09-01 plus `n` days.
- Missing batch: `DEMO-MED-XXXX-202609`.
- Selling price: preserve medicine sheet price; otherwise batch price; otherwise synthetic `100 + (n % 5) * 20` AFN.
- Missing batch purchase price: 70% of selling price, rounded to two decimals.
- Missing location/shelf/supplier/receipt date: explicitly sample labels and 2026-09-06.
- The 11 medicines without a stock row receive separately documented synthetic batches so the full demo catalogue can be exercised. The 50 source batch rows remain identifiable.

Product identity, spelling, strength, dosage form, manufacturer, source prescription flags and activity are preserved. Original source rows and a per-field map of generated values remain in private `source_inventory` JSON fields excluded from public serializers. Missing clinical values remain in that source record and are never synthesized.

The workbook repeats some barcodes across distinct SKUs. Those exact values remain in each medicine's source record; ambiguous barcodes are not inserted into the existing unique lookup field. No replacement barcode is generated. SKU is always the import key.

Rerunning an identical workbook updates product metadata but skips existing imported batches, preserving stock already consumed by orders. Changed source batches or unrelated batch conflicts fail the transaction for reconciliation instead of silently overwriting inventory. Dry runs roll back all database writes.

All displayed prices are server-owned. Cost and provenance are not exposed through customer APIs.
