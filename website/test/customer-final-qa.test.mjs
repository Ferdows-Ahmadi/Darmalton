import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { checkoutError } from "../lib/checkout-feedback.ts";
import { textFor } from "../lib/locale.ts";
import { accountError } from "../lib/account-feedback.ts";
import { customerText } from "../lib/customer-copy.ts";

const require = createRequire(import.meta.url);
function component(path, dependencies) {
  const compiled = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS }
  }).outputText;
  const compiledModule = { exports: {} };
  const dependency = name => name in dependencies ? dependencies[name] : name.startsWith("react") ? require(name) : name.endsWith(".css") ? { default: {} } : {};
  new Function("require", "module", "exports", compiled)(dependency, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}
const locale = { useLocale: () => ({ locale: "fa-AF", t: key => textFor("fa-AF", key) }) };
class ApiError extends Error { constructor(status, message) { super(message); this.status = status; } }
const medicine = { id: "local-test", brand_name: "Original medicine", brand_name_dari: "", brand_name_pashto: "", strength: "5mg", pack_size: "20", available_quantity: 5 };
function elements(tree) {
  if (!tree || typeof tree !== "object") return [];
  if (Array.isArray(tree)) return tree.flatMap(elements);
  return [tree, ...elements(tree.props?.children)];
}

test("real AddToCart failure handler localizes server errors without exposing backend text", async () => {
  const messages = [], routes = [];
  let state = 0;
  const { AddToCart } = component("../components/AddToCart.tsx", {
    react: { useState: () => ++state === 1 ? [false, () => {}] : ["", value => messages.push(value)] },
    "./LocaleProvider": locale,
    "next/navigation": { useRouter: () => ({ push: path => routes.push(path) }) },
    "@/lib/api": { ApiError, apiFetch: async () => { throw new ApiError(500, "PRIVATE_DEBUG_SENTINEL"); } },
    "@/lib/checkout-feedback": { checkoutError }
  });
  const tree = AddToCart({ medicine, disabled: false });
  await elements(tree).find(node => node.type === "button").props.onClick();
  assert.match(messages.at(-1), /موقتاً/);
  assert.doesNotMatch(messages.at(-1), /PRIVATE_DEBUG_SENTINEL/);
  assert.deepEqual(routes, []);
});

test("real AddToCart retains guest fallback and Rx routing", async () => {
  const routes = [], additions = [];
  const { AddToCart } = component("../components/AddToCart.tsx", {
    react: { useState: initial => [initial, () => {}] },
    "./LocaleProvider": locale,
    "next/navigation": { useRouter: () => ({ push: path => routes.push(path) }) },
    "@/lib/api": { ApiError, apiFetch: async () => { throw new ApiError(401, "Unauthorized"); } },
    "@/lib/guest-cart": { addGuestCartItem: item => additions.push(item) },
    "@/lib/checkout-feedback": { checkoutError }
  });
  for (const prescriptionRequired of [false, true]) {
    const tree = AddToCart({ medicine, disabled: false, prescriptionRequired });
    await elements(tree).find(node => node.type === "button").props.onClick();
  }
  assert.deepEqual(additions, [medicine]);
  assert.deepEqual(routes, ["/cart", "/prescriptions/upload?medicineId=local-test"]);
});

test("real authenticated cart update and remove handlers suppress raw request failures", async () => {
  const messages = [], requests = [];
  const cart = { item_count: 1, subtotal: "100", items: [{ id: "line", medicine, quantity: 1, available_quantity: 5, unit_price: "100", line_total: "100" }] };
  let state = 0;
  const { default: Cart } = component("../app/cart/page.tsx", {
    react: { useState: () => [[cart, () => {}], ["", value => messages.push(value)], [false, () => {}], [[], () => {}]][state++], useEffect: () => {}, useCallback: fn => fn },
    "@/components/LocaleProvider": locale,
    "@/components/AuthStateProvider": { useAuthenticated: () => true },
    "@/lib/locale": { formatMoney: value => value, formatNumber: value => String(value), productName: item => item.brand_name },
    "@/lib/storefront": { localizedPackSize: value => value },
    "@/lib/customer-copy": { customerText },
    "@/lib/api": { ApiError, apiFetch: async (path, options) => { requests.push([path, options.method]); throw new ApiError(500, "PRIVATE_DEBUG_SENTINEL"); } },
    "@/lib/checkout-feedback": { checkoutError }
  });
  const buttons = elements(Cart()).filter(node => node.type === "button");
  await buttons.find(node => node.props["aria-label"] === "افزایش تعداد").props.onClick();
  await buttons.find(node => node.props.children === textFor("fa-AF", "remove")).props.onClick();
  assert.deepEqual(requests, [["cart/items/line/", "PATCH"], ["cart/items/line/", "DELETE"]]);
  assert.equal(messages.length, 2);
  for (const message of messages) { assert.match(message, /موقتاً/); assert.doesNotMatch(message, /PRIVATE_DEBUG_SENTINEL/); }
});

test("account overview leaves loading for a localized request error and retains the login redirect", async () => {
  for (const status of [500, 401]) {
    let position = 0, effect;
    const values = [null, 0, 0, ""], routes = [];
    const { default: Account } = component("../app/account/page.tsx", {
      react: { useState: () => { const index = position++; return [values[index], value => { values[index] = value; }]; }, useEffect: fn => { effect = fn; } },
      "@/components/LocaleProvider": locale,
      "next/navigation": { useRouter: () => ({ push: path => routes.push(path) }) },
      "@/lib/api": { ApiError, apiFetch: async () => { throw new ApiError(status, "PRIVATE_DEBUG_SENTINEL"); } },
      "@/lib/account-feedback": { accountError },
      "@/lib/auth-navigation": { loginPath: path => `/login?returnTo=${encodeURIComponent(path)}` }
    });
    Account(); effect();
    await new Promise(resolve => setImmediate(resolve));
    position = 0;
    const tree = Account();
    if (status === 500) {
      const alert = elements(tree).find(node => node.props?.role === "alert");
      assert.match(alert.props.children, /موقتاً/);
      assert.doesNotMatch(alert.props.children, /PRIVATE_DEBUG_SENTINEL/);
      assert.equal(elements(tree).some(node => node.props?.className === "loading"), false);
    } else assert.deepEqual(routes, ["/login?returnTo=%2Faccount"]);
  }
});
