import assert from "node:assert/strict";
import test from "node:test";
import { catalogueApiQuery, cataloguePath, catalogueUrl, matchesManufacturerRoute } from "../lib/catalogue-context.ts";

const contexts = [
  { kind: "category", value: "antibiotic", label: "Antibiotics" },
  { kind: "manufacturer", value: "Getz pharma", label: "Getz pharma" }
];

for (const context of contexts) {
  test(`${context.kind}: pagination retains the path and every supported active filter`, () => {
    const query = new URLSearchParams("search=am&category=antibiotic&manufacturer=Getz+pharma&shopper_category=medicines&ordering=-price&in_stock=true&min_price=10&max_price=900&prescription_required=true&page=1");
    const next = new URL(catalogueUrl(query, "page", "2", context), "http://local");
    assert.equal(next.pathname, cataloguePath(context));
    const api = catalogueApiQuery(next.searchParams, context);
    for (const [key, value] of query) {
      assert.equal(api.get(key), key === "page" ? "2" : key === context.kind ? context.value : value, key);
    }
    assert.equal(api.get("family_listing"), "true");
  });

  test(`${context.kind}: sort resets pagination and cannot override the path constraint`, () => {
    const query = new URLSearchParams(`${context.kind}=wrong&page=3&search=am&in_stock=true&min_price=0&max_price=500`);
    const sorted = new URL(catalogueUrl(query, "ordering", "price", context), "http://local");
    assert.equal(sorted.pathname, cataloguePath(context));
    assert.equal(sorted.searchParams.has("page"), false);
    const api = catalogueApiQuery(sorted.searchParams, context);
    assert.equal(api.get(context.kind), context.value);
    assert.equal(api.get("ordering"), "price");
    assert.equal(api.get("min_price"), "0");
    assert.equal(api.get("max_price"), "500");
    assert.equal(api.get("in_stock"), "true");
    assert.equal(api.get("search"), "am");
    assert.equal(catalogueApiQuery(query, context).get(context.kind), context.value);
  });

  test(`${context.kind}: a submitted filter form and clear retain the canonical context`, () => {
    const form = new URLSearchParams("search=&in_stock=true&min_price=50&max_price=600&ordering=-price&category=antibiotic");
    const api = catalogueApiQuery(form, context);
    assert.equal(api.get(context.kind), context.value);
    assert.equal(api.get("category"), "antibiotic");
    assert.equal(api.get("ordering"), "-price");
    assert.equal(api.has("search"), false);
    const cleared = catalogueApiQuery(new URLSearchParams(), context);
    assert.equal(cleared.get(context.kind), context.value);
    assert.equal(cleared.get("ordering"), "name");
    assert.equal(cleared.has("min_price"), false);
  });
}

test("Shop remains independent and manufacturer names are encoded exactly once", () => {
  assert.equal(cataloguePath(), "/shop");
  const sorted = new URL(catalogueUrl(new URLSearchParams("category=antibiotic&page=2&manufacturer=Getz+pharma"), "ordering", "price"), "http://local");
  assert.equal(sorted.pathname, "/shop");
  assert.equal(sorted.searchParams.get("manufacturer"), "Getz pharma");
  assert.equal(sorted.searchParams.get("category"), "antibiotic");
  assert.equal(sorted.searchParams.has("page"), false);
  const context = { kind: "manufacturer", value: "A & B 100%", label: "A & B 100%" };
  assert.equal(cataloguePath(context), "/manufacturers/A%20%26%20B%20100%25");
  assert.equal(catalogueApiQuery(new URLSearchParams(), context).get("manufacturer"), context.value);
  assert.equal(matchesManufacturerRoute("Getz pharma", "Getz%20pharma"), true);
  assert.equal(matchesManufacturerRoute("Getz pharma", "getz pharma"), true);
  assert.equal(matchesManufacturerRoute(context.value, "A%20%26%20B%20100%25"), true);
  assert.equal(matchesManufacturerRoute(context.value, "A & B 100%"), true);
  assert.equal(matchesManufacturerRoute("Getz pharma", "another manufacturer"), false);
});
