import assert from "node:assert/strict";
import test from "node:test";

import { formatMoney, formatNumber } from "../lib/locale.ts";

test("customer numbers use deterministic English and RTL digits", () => {
  assert.equal(formatNumber(1234, "en"), "1,234");
  assert.equal(formatNumber(1234, "fa-AF"), "۱,۲۳۴");
  assert.equal(formatNumber(1234, "ps-AF"), "۱,۲۳۴");
});

test("money formatting does not depend on browser Intl support", () => {
  assert.equal(formatMoney("60", "en"), "60 AFN");
  assert.equal(formatMoney("60", "fa-AF"), "۶۰ افغانی");
  assert.equal(formatMoney("60", "ps-AF"), "۶۰ افغانۍ");
});
