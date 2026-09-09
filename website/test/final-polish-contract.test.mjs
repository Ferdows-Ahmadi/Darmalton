import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const addressBook = read("../components/AddressBook.tsx");
const addressEditor = read("../components/AddressEditor.tsx");
const infoPage = read("../components/StaticInfoPage.tsx");
const appPage = read("../app/app/page.tsx");
const medicineDetail = read("../app/medicines/[id]/page.tsx");
const polish = read("../app/polish.css");

test("saved-address empty state points to the address form", () => {
  assert.match(addressBook, /actionHref="\/account\/addresses\/new"/);
  assert.match(addressBook, /actionLabel="newAddress"/);
});

test("geolocation asks for contextual permission before browser access", () => {
  assert.match(addressEditor, /setLocationPrompt\(true\)/);
  assert.match(addressEditor, /role="dialog"/);
  assert.match(addressEditor, /navigator\.geolocation\.getCurrentPosition/);
  assert.match(addressEditor, /locationCopy\.denied/);
});

test("information routes use distinct help, faq, and about compositions", () => {
  assert.match(infoPage, /variant === "faq"/);
  assert.match(infoPage, /<details/);
  assert.match(infoPage, /info-page-\$\{variant\}/);
  assert.match(infoPage, /variant === "help"/);
  assert.match(infoPage, /"about" \| "help" \| "faq"/);
});

test("app page uses the supplied visual asset family", () => {
  assert.match(appPage, /APP-01_Hero_Dual_Phones\.png/);
  assert.match(appPage, /APP-02_App_Screen_In_Hand\.png/);
  assert.match(appPage, /APP-10_Delivery_Illustration\.png/);
  assert.match(appPage, /APP-12_Prescription_Illustration\.png/);
});

test("localized product pages do not expose untranslated descriptions", () => {
  assert.match(medicineDetail, /\? medicine\.description_pashto\s*:\s*medicine\.description_dari/);
  assert.doesNotMatch(medicineDetail, /description_pashto \|\| medicine\.description/);
});

test("mobile account navigation stays scrollable without a visible scrollbar", () => {
  assert.match(polish, /\.account-nav\{position:static;scrollbar-width:none\}/);
  assert.match(polish, /\.account-nav::\-webkit-scrollbar\{display:none\}/);
});
