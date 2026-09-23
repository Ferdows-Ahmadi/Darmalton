import assert from "node:assert/strict";
import test from "node:test";
import { accountError, accountValidation } from "../lib/account-feedback.ts";

const fallback = "اتصال خود را بررسی و دوباره کوشش کنید.";
function failure(status, message) { return Object.assign(new Error(message), { status }); }

test("Dari account feedback contains API validation and transport errors", () => {
  for (const error of [failure(400, "Please correct the highlighted fields."), failure(404, "No Order matches the given query."), failure(403, "Permission denied."), failure(429, "Request was throttled."), failure(500, "Internal Server Error"), new TypeError("Failed to fetch"), new Error("Unexpected English response")]) {
    assert.doesNotMatch(accountError(error, "fa-AF", fallback), /[A-Za-z]/);
  }
  assert.match(accountError(failure(400, "Please correct the highlighted fields."), "fa-AF", fallback), /اصلاح/);
});

test("existing localized errors and other locale behavior remain intact", () => {
  const localized = "فقط فایل‌های JPG، PNG یا PDF پذیرفته می‌شود.";
  assert.equal(accountError(failure(400, localized), "fa-AF", fallback), localized);
  for (const locale of ["en"]) {
    assert.equal(accountError(new Error("Existing message"), locale, fallback), "Existing message");
  }
  assert.equal(accountError(null, "fa-AF", fallback), fallback);
});

test("prescription errors and native required validation have Dari feedback", () => {
  assert.equal(accountError(failure(400, "The selected prescription has expired."), "fa-AF", fallback), "اعتبار نسخه انتخاب‌شده پایان یافته است.");
  assert.equal(accountValidation({ valueMissing: true }), "این بخش را تکمیل کنید.");
  assert.doesNotMatch(accountValidation({ typeMismatch: true }), /[A-Za-z]/);
});
