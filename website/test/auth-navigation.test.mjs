import assert from "node:assert/strict";
import test from "node:test";

import {
  isStaffRole,
  postLoginPath,
  safeReturnPath,
  safeStaffReturnPath,
  staffLoginPath
} from "../lib/auth-navigation.ts";

test("public return paths stay local", () => {
  assert.equal(safeReturnPath("/orders?status=open"), "/orders?status=open");
  assert.equal(safeReturnPath("https://evil.example/staff"), "/shop");
  assert.equal(safeReturnPath("//evil.example/staff"), "/shop");
});

test("staff return paths cannot escape the staff portal", () => {
  assert.equal(safeStaffReturnPath("/staff/orders?status=PENDING"), "/staff/orders?status=PENDING");
  assert.equal(safeStaffReturnPath("/shop"), "/staff");
  assert.equal(safeStaffReturnPath("/staff/login"), "/staff");
  assert.equal(
    staffLoginPath("/staff/prescriptions"),
    "/staff/login?returnTo=%2Fstaff%2Fprescriptions"
  );
  assert.equal(
    staffLoginPath("/staff/cms/banners"),
    "/staff/login?returnTo=%2Fstaff%2Fcms%2Fbanners"
  );
});

test("post-login routing separates staff and customer roles", () => {
  for (const role of ["STAFF", "ADMIN", "PHARMACIST"]) {
    assert.equal(isStaffRole(role), true);
    assert.equal(postLoginPath(role, "customer"), "/staff");
    assert.equal(
      postLoginPath(role, "staff", "/staff/inventory"),
      "/staff/inventory"
    );
    assert.equal(
      postLoginPath(role, "staff", "/staff/cms/pages"),
      "/staff/cms/pages"
    );
  }
  assert.equal(isStaffRole("CUSTOMER"), false);
  assert.equal(postLoginPath("CUSTOMER", "customer"), "/shop");
  assert.equal(postLoginPath("CUSTOMER", "staff", "/staff"), null);
});
