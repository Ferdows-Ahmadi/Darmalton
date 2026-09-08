import assert from "node:assert/strict";
import test from "node:test";

import {
  groupMedicineFamilies,
  shopperHealthNeeds
} from "../lib/storefront.ts";

function medicine(id, strength) {
  return { id, sku: id, family_code: "family-example", strength };
}

test("family listing metadata keeps one card with exact SKU variants", () => {
  const first = medicine("MED-1", "5 mg");
  const second = medicine("MED-2", "10 mg");
  const families = groupMedicineFamilies([
    { ...first, family_variants: [first, second] }
  ]);

  assert.equal(families.length, 1);
  assert.deepEqual(families[0].variants.map((variant) => variant.id), ["MED-2", "MED-1"]);
});

test("shopper health needs localize, deduplicate, and hide raw internal labels", () => {
  const categories = [
    { id: "1", slug: "antibiotic", name: "Antibiotic" },
    { id: "2", slug: "antibacterial", name: "Antibacterial" },
    { id: "3", slug: "brain-improve", name: "brain improve" },
    { id: "4", slug: "pain-relief", name: "Pain Relief" }
  ];

  const dari = shopperHealthNeeds(categories, "fa-AF");
  assert.deepEqual(dari.map((need) => need.key), ["antibiotics", "pain-relief"]);
  assert.deepEqual(dari.map((need) => need.label), ["آنتی‌بیوتیک‌ها", "تسکین درد"]);
});
