import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { dashboardMetricsForRole } from "../lib/staff-dashboard.ts";
import { staffNavigation, staffNavigationForRole } from "../lib/staff-navigation.ts";

const shell = fs.readFileSync("components/staff/StaffShell.tsx", "utf8");

function paths(role) {
  return staffNavigationForRole(role).flatMap((group) => group.items.map(([href]) => href));
}

test("staff navigation is grouped without duplicate operational destinations", () => {
  const allPaths = staffNavigation.map(([href]) => href);
  assert.equal(new Set(allPaths).size, allPaths.length);
  assert.ok(allPaths.includes("/staff/medicines"));
  assert.ok(allPaths.includes("/staff/manufacturers"));
  assert.ok(allPaths.includes("/staff/cms/banners"));
});

test("sensitive navigation follows backend role permissions", () => {
  assert.equal(paths("STAFF").includes("/staff/prescriptions"), false);
  assert.equal(paths("PHARMACIST").includes("/staff/prescriptions"), true);
  assert.equal(paths("PHARMACIST").includes("/staff/users"), false);
  assert.equal(paths("ADMIN").includes("/staff/users"), true);
});

test("dashboard does not show inaccessible prescription work to ordinary staff", () => {
  assert.equal(dashboardMetricsForRole("STAFF").some(([key]) => key.includes("prescription")), false);
  assert.equal(dashboardMetricsForRole("ADMIN").some(([key]) => key === "new_prescriptions"), true);
});

test("nested operational routes suppress the broader parent active state", () => {
  assert.match(shell, /moreSpecificMatch/);
  assert.match(shell, /!moreSpecificMatch/);
});
