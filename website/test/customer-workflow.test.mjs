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
const account = readFileSync(new URL("../app/account/page.tsx", import.meta.url), "utf8");
const orderDetail = readFileSync(new URL("../app/orders/[id]/page.tsx", import.meta.url), "utf8");
const authForm = readFileSync(new URL("../components/AuthForm.tsx", import.meta.url), "utf8");
const googleButton = readFileSync(new URL("../components/GoogleSignInButton.tsx", import.meta.url), "utf8");
const authState = readFileSync(new URL("../components/AuthStateProvider.tsx", import.meta.url), "utf8");
const cart = readFileSync(new URL("../app/cart/page.tsx", import.meta.url), "utf8");
const medicineCard = readFileSync(new URL("../components/MedicineCard.tsx", import.meta.url), "utf8");
const medicineDetail = readFileSync(
  new URL("../components/ProductDetail.tsx", import.meta.url),
  "utf8"
);
const header = readFileSync(new URL("../components/Header.tsx", import.meta.url), "utf8");

test("approved prescriptions use the atomic server bundle action", () => {
  assert.match(prescriptions, /add-authorized-to-cart/);
  assert.doesNotMatch(prescriptions, /cart\/items\/.*authorized\.medicine_id/s);
  assert.match(prescriptions, /سفارش ساخته نمی‌شود/);
});

test("family cards require a strength choice before adding an exact SKU", () => {
  assert.match(medicineCard, /variants\.length>1/);
  assert.match(medicineCard, /chooseStrength/);
  assert.match(medicineCard, /<AddToCart medicine=\{medicine\}/);
  assert.match(medicineDetail, /href=\{`\/medicines\/\$\{variant\.id\}`\}/);
  assert.match(medicineDetail, /<AddToCart medicine=\{medicine\}/);
});

test("logout clears the Google chooser before returning home", () => {
  assert.match(header, /fetch\("\/api\/auth\/logout",\{method:"POST"\}\)/);
  assert.match(header, /disableAutoSelect\(\)/);
  assert.match(header, /router\.push\("\/"\)/);
});

test("notification center supports persistent read state and resource links", () => {
  assert.match(notifications, /notifications\/read-all\//);
  assert.match(notifications, /notifications\/\$\{item\.id\}\/read\//);
  assert.match(notifications, /\/orders\/\$\{item\.order_id\}/);
  assert.match(notifications, /\/prescriptions/);
});

test("customer pages hide unsupported wallet and tracking actions", () => {
  assert.doesNotMatch(account, /کیف پول/);
  assert.doesNotMatch(orderDetail, /موقعیت زنده پیک|tracking-placeholder/);
  assert.match(authForm, /GoogleSignInButton/);
  assert.match(authForm, /locale=\{locale\}/);
  assert.match(authForm, /google_email_unverified/);
  assert.match(authForm, /synchronizeGuestCart/);
  assert.match(authForm, /finishAuthentication\(payload\.user\)/);
  assert.doesNotMatch(authForm, /Apple|apple/i);
});

test("Google remains a recognizable but honest entry point without local credentials", () => {
  assert.doesNotMatch(authForm, /googleClientId &&/);
  assert.match(googleButton, /google-entry-button/);
  assert.match(googleButton, /disabled aria-describedby/);
  assert.match(googleButton, /#4285F4/);
  assert.match(googleButton, /accounts\.id\.initialize/);
});

test("guest cart uses the server-provided auth state before probing protected APIs", () => {
  assert.match(authState, /createContext\(false\)/);
  assert.match(cart, /if \(!authenticated\)/);
  assert.match(cart, /setCart\(guestCart\(\)\)/);
});
