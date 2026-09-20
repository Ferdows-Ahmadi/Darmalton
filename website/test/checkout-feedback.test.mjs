import assert from "node:assert/strict";
import test from "node:test";
import { checkoutError, missingCheckoutFields } from "../lib/checkout-feedback.ts";

const fallback = "سفارش ثبت نشد. دوباره کوشش کنید.";
const failure = (message, status = 400, fields = {}) => Object.assign(new Error(message), { status, fields });

test("checkout maps stock, price and prescription failures without displaying backend data", () => {
  for (const message of [
    "Insufficient stock for Example medicine.", "Price is not available for Example medicine.",
    "Example medicine is no longer available.", "Example medicine requires an approved prescription.",
    "The selected prescription has expired.", "This prescription has already been used for an order.",
    "This medicine is not authorized by the selected prescription.",
    "Only 2 units are authorized by this prescription.",
    "One order cannot use more than one prescription authorization."
  ]) {
    const text = checkoutError(failure(message), "fa-AF", fallback);
    assert.match(text, /[\u0600-\u06ff]/);
    assert.doesNotMatch(text, /Example|prescription|stock|Price/);
    assert.notEqual(text, "معلومات واردشده را بررسی و اصلاح کنید.");
  }
});

test("checkout localizes field validation and transport/auth errors safely", () => {
  assert.match(checkoutError(failure("Please correct the highlighted fields.", 400, { recipient_phone: ["Invalid phone"] }), "fa-AF", fallback), /شماره تماس/);
  assert.match(checkoutError(failure("Please correct the highlighted fields.", 400, { address_id: ["Invalid pk"] }), "fa-AF", fallback), /آدرس معتبر/);
  assert.match(checkoutError(failure("Please correct the highlighted fields.", 400, { non_field_errors: ["Your cart is empty."] }), "fa-AF", fallback), /خالی/);
  assert.match(checkoutError(failure("Unauthorized", 401), "fa-AF", fallback), /وارد حساب/);
  assert.match(checkoutError(failure("SQL traceback", 500), "fa-AF", fallback), /موقتاً/);
  assert.match(checkoutError(new TypeError("Failed to fetch"), "fa-AF", fallback), /اتصال/);
});

test("unknown server text including mixed-language debug output never leaks", () => {
  for (const message of ["SELECT secret FROM customers", "خطا: raw debug trace", "<script>alert(1)</script>"]) {
    assert.equal(checkoutError(new Error(message), "fa-AF", fallback), fallback);
    assert.equal(checkoutError(new Error(message), "en", "Could not place order."), "Could not place order.");
  }
});

test("new delivery address validation rejects blank required fields but accepts optional blanks", () => {
  const required = ["recipient_name", "recipient_phone", "province", "city", "street_address"];
  assert.deepEqual(missingCheckoutFields({}), required);
  assert.deepEqual(missingCheckoutFields(Object.fromEntries(required.map(key => [key, "  "]))), required);
  assert.deepEqual(missingCheckoutFields({ recipient_name: "Local test", recipient_phone: "0700000000", province: "Kabul", city: "Kabul", street_address: "Local test", district: "", landmark: "" }), []);
});
