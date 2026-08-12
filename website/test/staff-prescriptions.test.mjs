import assert from "node:assert/strict";
import test from "node:test";

import {
  allowedPrescriptionActions,
  isPrescriptionReviewerRole,
  nextPageNumber,
  prescriptionStatuses
} from "../lib/staff-prescriptions.ts";

test("prescription actions expose only valid backend transitions", () => {
  assert.deepEqual(allowedPrescriptionActions("SUBMITTED", true), ["start-review"]);
  assert.deepEqual(allowedPrescriptionActions("UNDER_REVIEW", true), [
    "request-clarification",
    "approve",
    "reject"
  ]);
  assert.deepEqual(allowedPrescriptionActions("CLARIFICATION_REQUESTED", true), []);
  assert.deepEqual(allowedPrescriptionActions("APPROVED", true), ["expire"]);
  for (const status of ["REJECTED", "EXPIRED", "CANCELLED"]) {
    assert.deepEqual(allowedPrescriptionActions(status, true), []);
  }
});

test("only pharmacists and administrators receive review controls", () => {
  assert.equal(isPrescriptionReviewerRole("PHARMACIST"), true);
  assert.equal(isPrescriptionReviewerRole("ADMIN"), true);
  assert.equal(isPrescriptionReviewerRole("STAFF"), false);
  assert.equal(isPrescriptionReviewerRole("CUSTOMER"), false);
  assert.deepEqual(allowedPrescriptionActions("SUBMITTED", false), []);
});

test("prescription status and pagination helpers cover the API contract", () => {
  assert.deepEqual(prescriptionStatuses, [
    "SUBMITTED",
    "UNDER_REVIEW",
    "CLARIFICATION_REQUESTED",
    "APPROVED",
    "REJECTED",
    "EXPIRED",
    "CANCELLED"
  ]);
  assert.equal(nextPageNumber("https://api.test/staff/prescriptions/?page=3"), 3);
  assert.equal(nextPageNumber("https://api.test/staff/prescriptions/"), 1);
  assert.equal(nextPageNumber(null), null);
});
