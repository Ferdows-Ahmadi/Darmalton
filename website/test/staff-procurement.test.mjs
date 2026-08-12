import assert from "node:assert/strict";
import test from "node:test";
import { purchaseActions, purchaseStatusLabel, receiptOutstanding } from "../lib/staff-procurement.ts";

test("purchase controls mirror service state transitions", () => {
  assert.deepEqual([...purchaseActions("DRAFT")], ["submit", "cancel"]);
  assert.deepEqual([...purchaseActions("SUBMITTED")], ["approve", "cancel"]);
  assert.deepEqual([...purchaseActions("APPROVED")], ["receive"]);
  assert.deepEqual([...purchaseActions("RECEIVED")], []);
});
test("receipt quantities cannot expose a negative outstanding value", () => {
  assert.equal(receiptOutstanding(10, 4), 6);
  assert.equal(receiptOutstanding(10, 11), 0);
  assert.equal(purchaseStatusLabel("PARTIALLY_RECEIVED"), "دریافت جزئی");
});
