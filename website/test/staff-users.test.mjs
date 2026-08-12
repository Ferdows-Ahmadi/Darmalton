import assert from "node:assert/strict";
import test from "node:test";

import {
  canManageUsers,
  staffRoles,
  userRoleLabels,
  validateTemporaryPassword
} from "../lib/staff-users.ts";

test("only administrators receive account-management controls", () => {
  assert.equal(canManageUsers("ADMIN"), true);
  assert.equal(canManageUsers("STAFF"), false);
  assert.equal(canManageUsers("PHARMACIST"), false);
  assert.equal(canManageUsers("CUSTOMER"), false);
});

test("new staff roles exclude customer self-registration", () => {
  assert.deepEqual(staffRoles, ["STAFF", "PHARMACIST", "ADMIN"]);
  assert.equal(userRoleLabels.CUSTOMER, "مشتری");
});

test("temporary passwords are required for creation but optional during edits", () => {
  assert.match(validateTemporaryPassword("", false), /۸/);
  assert.equal(validateTemporaryPassword("", true), "");
  assert.equal(validateTemporaryPassword("long-enough", false), "");
});
