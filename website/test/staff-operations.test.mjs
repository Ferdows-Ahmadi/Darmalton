import assert from "node:assert/strict";
import test from "node:test";

import { operationsConfigs, operationsStatusLabel } from "../lib/staff-operations.ts";

test("ordinary supplier and location workflows stay inside staff APIs", () => {
  assert.equal(operationsConfigs.suppliers.endpoint, "operations/suppliers/");
  assert.equal(operationsConfigs.warehouses.endpoint, "operations/warehouses/");
  assert.equal(operationsConfigs.locations.endpoint, "operations/storage-locations/");
  assert.equal(JSON.stringify(operationsConfigs).includes("/admin"), false);
});

test("operational forms expose safe activity controls and physical location fields", () => {
  assert.ok(operationsConfigs.suppliers.fields.some((field) => field.key === "pharmacy_license_number"));
  assert.ok(operationsConfigs.warehouses.fields.some((field) => field.key === "branch"));
  assert.ok(operationsConfigs.locations.fields.some((field) => field.key === "rack"));
  assert.equal(operationsStatusLabel(true), "بلی");
  assert.equal(operationsStatusLabel(null), "—");
});
