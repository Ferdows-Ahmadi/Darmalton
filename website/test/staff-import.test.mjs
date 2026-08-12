import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const component = fs.readFileSync("components/staff/StaffMedicineImport.tsx", "utf8");
const navigation = fs.readFileSync("lib/staff-navigation.ts", "utf8");

test("bulk import is visible only to administrators", () => {
  assert.match(navigation, /\/staff\/medicines\/import.*adminRoles/);
  assert.match(component, /viewer\?\.role !== "ADMIN"/);
});

test("bulk import requires preview before explicit confirmation", () => {
  assert.match(component, /staff\/medicine-imports\/preview\//);
  assert.match(component, /setConfirmOpen\(true\)/);
  assert.match(component, /staff\/medicine-imports\/\$\{job\.id\}\/confirm\//);
  assert.match(component, /summary\?\.error_count === 0/);
});

test("bulk import exposes all safe existing-record policies", () => {
  assert.match(component, /CREATE_NEW/);
  assert.match(component, /UPDATE_EXISTING/);
  assert.match(component, /SKIP_EXISTING/);
  assert.match(component, /موجودی هرگز بازنویسی نمی‌شود/);
});

test("bulk import presents grouped row-level errors and a template", () => {
  assert.match(component, /errorsBySheet/);
  assert.match(component, /item\.row/);
  assert.match(component, /item\.field/);
  assert.match(component, /medicine-imports\/template\//);
});
