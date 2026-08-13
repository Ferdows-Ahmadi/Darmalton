import assert from "node:assert/strict";
import test from "node:test";

import {
  apiAssetUrl,
  catalogueConfigs,
  catalogueResources,
  catalogueStatusLabel,
  validateCatalogueImage
} from "../lib/staff-catalogue.ts";

test("catalogue staff resources use the existing staff API routes", () => {
  assert.deepEqual(catalogueResources, ["medicines", "categories", "manufacturers"]);
  assert.equal(catalogueConfigs.medicines.endpoint, "staff/medicines/");
  assert.equal(catalogueConfigs.categories.endpoint, "staff/categories/");
  assert.equal(catalogueConfigs.manufacturers.endpoint, "staff/manufacturers/");
});

test("catalogue media routes stay behind the same-site authenticated proxy", () => {
  assert.equal(
    apiAssetUrl("http://backend:8000/api/v1/staff/categories/id/image/"),
    "/api/backend/staff/categories/id/image/"
  );
  assert.equal(
    apiAssetUrl("http://backend:8000/api/v1/staff/manufacturers/id/logo/"),
    "/api/backend/staff/manufacturers/id/logo/"
  );
  assert.equal(
    apiAssetUrl("http://backend:8000/static/medicine-fallback.svg"),
    "/api/assets/static/medicine-fallback.svg"
  );
  assert.equal(apiAssetUrl(""), "/api/assets/static/medicine-fallback.svg");
});

test("catalogue image validation rejects misleading local uploads", () => {
  assert.equal(validateCatalogueImage(null), "");
  assert.match(
    validateCatalogueImage(new File(["not an image"], "payload.txt", { type: "text/plain" })),
    /JPEG/
  );
  assert.equal(catalogueStatusLabel("RECALLED"), "جمع‌آوری‌شده");
});
