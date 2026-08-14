import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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

test("the direct user-management route resolves the viewer before privileged data or controls", async () => {
  const source = await readFile(
    new URL("../components/staff/StaffUserManager.tsx", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /Promise\.all\(\[apiFetch<User>\("auth\/me\/"\)/);
  assert.match(source, /const profile=await apiFetch<User>\("auth\/me\/"\)/);
  assert.match(source, /if\(!canManageUsers\(profile\.role\)\).*return;/s);
  assert.match(source, /if\(busy&&!viewer\)return/);
  assert.match(source, /if\(!viewer\|\|!canManageUsers\(viewer\.role\)\)return/);
});
