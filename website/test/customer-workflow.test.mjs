import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const prescriptions = readFileSync(
  new URL("../app/prescriptions/page.tsx", import.meta.url),
  "utf8"
);
const notifications = readFileSync(
  new URL("../app/notifications/page.tsx", import.meta.url),
  "utf8"
);

test("approved prescriptions use the atomic server bundle action", () => {
  assert.match(prescriptions, /add-authorized-to-cart/);
  assert.doesNotMatch(prescriptions, /cart\/items\/.*authorized\.medicine_id/s);
  assert.match(prescriptions, /سفارش ساخته نمی‌شود/);
});

test("notification center supports persistent read state and resource links", () => {
  assert.match(notifications, /notifications\/read-all\//);
  assert.match(notifications, /notifications\/\$\{item\.id\}\/read\//);
  assert.match(notifications, /\/orders\/\$\{item\.order_id\}/);
  assert.match(notifications, /\/prescriptions/);
});
