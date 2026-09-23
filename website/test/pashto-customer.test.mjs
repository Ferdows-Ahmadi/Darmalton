import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { accountError, accountValidation } from "../lib/account-feedback.ts";
import { checkoutError } from "../lib/checkout-feedback.ts";
import { customerCopy, customerText } from "../lib/customer-copy.ts";
import * as locale from "../lib/locale.ts";
import * as storefront from "../lib/storefront.ts";
import { cmsText } from "../lib/cms-locale.ts";

const require = createRequire(import.meta.url);
function component(path, dependencies = {}) {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS }
  }).outputText;
  const compiled = { exports: {} };
  const resolve = name => dependencies[name] ?? ({ "next/link": { default: "a" }, "@/lib/locale": locale, "@/lib/customer-copy": { customerText }, "@/lib/storefront": storefront }[name]) ?? (name.startsWith("react") ? require(name) : name.endsWith(".css") ? { default: {} } : {});
  new Function("require", "module", "exports", code)(resolve, compiled, compiled.exports);
  return compiled.exports;
}
function nodes(tree) {
  if (!tree || typeof tree !== "object") return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
function text(tree) {
  if (Array.isArray(tree)) return tree.map(text).join("");
  if (typeof tree === "string" || typeof tree === "number") return String(tree);
  return tree ? text(tree.props?.children) : "";
}
const failure = (message, status, fields) => Object.assign(new Error(message), { status, fields });

test("Pashto history timestamps avoid English ICU fallback and preserve Dari and English formatting", () => {
  const value = "2026-09-20T15:42:30Z";
  const options = { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" };
  assert.equal(locale.formatDateTime(value, "ps-AF", options), "۲۰/۰۹/۲۰۲۶, ۱۵:۴۲");
  assert.equal(locale.formatDateTime(value, "ps-AF", { timeZone: "UTC" }), "۲۰/۰۹/۲۰۲۶, ۱۵:۴۲:۳۰");
  for (const language of ["fa-AF", "en"]) {
    assert.equal(locale.formatDateTime(value, language, options), new Date(value).toLocaleString(language, options));
  }
});

test("Pashto account, upload and checkout feedback never passes through unknown server text", () => {
  const fallback = locale.textFor("ps-AF", "connection");
  for (const status of [undefined, 400, 401, 403, 404, 413, 422, 429, 500]) {
    for (const message of ["PRIVATE_TRACE", "خطای داخلی PRIVATE_TRACE", "Please correct the highlighted fields."]) {
      for (const map of [accountError, checkoutError]) {
        const result = map(failure(message, status), "ps-AF", fallback);
        assert.doesNotMatch(result, /PRIVATE_TRACE|Please correct|خطای داخلی/);
        assert.match(result, /[\u0600-\u06ff]/);
      }
    }
  }
  assert.equal(accountError(failure("The selected prescription has expired.", 400), "ps-AF", fallback), "د ټاکل شوې نسخې اعتبار پای ته رسېدلی دی.");
  assert.match(checkoutError(failure("Insufficient stock for PRIVATE_MEDICINE.", 400), "ps-AF", fallback), /موجودي/);
  assert.match(checkoutError(failure("Validation", 400, { recipient_phone: ["Invalid"] }), "ps-AF", fallback), /شمېره/);
  assert.equal(accountValidation({ valueMissing: true }, "ps-AF"), "دا برخه بشپړه کړئ.");
  assert.equal(accountValidation({ valueMissing: true }, "fa-AF"), "این بخش را تکمیل کنید.");
});

test("extracted customer literals preserve Dari exactly and have nonempty Pashto counterparts", () => {
  for (const [dari, pashto] of Object.entries(customerCopy)) {
    assert.equal(customerText("fa-AF", dari), dari);
    assert.equal(customerText("ps-AF", dari), pashto);
    assert.ok(pashto.trim());
  }
});

test("product locales share exact structure, SKU routes, stock, price and original data", () => {
  const { ProductDetail } = component("../components/ProductDetail.tsx");
  const medicine = { id: "unit-only", sku: "SKU-5", brand_name: "Original Brand", dosage_form: { name: "Tablet", name_dari: "تابلیت", name_pashto: "ګولۍ" }, strength: "5mg", pack_size: "20 tablets", price: "100", available_quantity: 5, in_stock: true, description_dari: "اصل معلومات", description_pashto: "اصلي معلومات" };
  const variants = [medicine, { ...medicine, id: "unit-only-10", strength: "10mg" }];
  const input = JSON.stringify({ medicine, variants });
  const fa = ProductDetail({ medicine, variants, locale: "fa-AF" });
  const ps = ProductDetail({ medicine, variants, locale: "ps-AF" });
  const structure = tree => nodes(tree).map(n => ({ type: n.type, href: n.props.href, className: n.props.className, medicine: n.props.medicine, width: n.props.width, height: n.props.height, current: n.props["aria-current"] }));
  assert.deepEqual(structure(ps), structure(fa));
  assert.equal(JSON.stringify({ medicine, variants }), input);
  assert.match(text(fa), /معلومات محصول.*اصل معلومات/);
  assert.match(text(ps), /د توکي معلومات.*اصلي معلومات/);
  assert.match(text(ps), /SKU-5/);
  assert.doesNotMatch(text(ps), /قیمت فعلی|تولیدکننده|الزامی است/);
  assert.equal(cmsText("Original English", "اصل دری", "ps-AF"), "Original English");
});

test("Pashto profile save keeps the existing API language preference instead of sending unsupported ps-AF", async () => {
  for (const language of ["ps-AF", "fa-AF", "en"]) {
    const requests = [];
    let state = 0;
    const { ProfileEditor } = component("../components/ProfileEditor.tsx", {
      react: { useState: () => [[{ first_name: "", last_name: "", email: "", phone: "" }, () => {}], [false, () => {}], ["", () => {}]][state++], useEffect: () => {} },
      "./LocaleProvider": { useLocale: () => ({ locale: language, t: key => locale.textFor(language, key) }) },
      "next/navigation": { useRouter: () => ({}) },
      "@/lib/api": { apiFetch: async (path, options) => { requests.push(JSON.parse(options.body)); return {}; } }
    });
    const original = globalThis.FormData;
    globalThis.FormData = class { entries() { return [["first_name", "Unit"], ["last_name", "Test"]]; } };
    try { await nodes(ProfileEditor()).find(n => n.type === "form").props.onSubmit({ preventDefault() {}, currentTarget: {} }); }
    finally { globalThis.FormData = original; }
    assert.equal(requests.length, 1);
    assert.equal(requests[0].preferred_language, language === "ps-AF" ? undefined : language === "fa-AF" ? "fa" : "en");
  }
});
