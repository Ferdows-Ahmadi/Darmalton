import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { accountError, accountValidation } from "../lib/account-feedback.ts";
import { checkoutError } from "../lib/checkout-feedback.ts";
import { customerCopy, customerText } from "../lib/customer-copy.ts";
import { marketplaceCopy, marketplaceText } from "../lib/marketplace-copy.ts";
import { textFor } from "../lib/locale.ts";
const require = createRequire(import.meta.url);
function component(path, dependencies) {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const compiled = { exports: {} };
  const resolve = name => dependencies[name] ?? (name.startsWith("react") ? require(name) : name.endsWith(".css") ? { default: { shell: "approved-shell" } } : {});
  new Function("require", "module", "exports", code)(resolve, compiled, compiled.exports);
  return compiled.exports;
}
function nodes(tree) { return !tree || typeof tree !== "object" ? [] : Array.isArray(tree) ? tree.flatMap(nodes) : [tree, ...nodes(tree.props?.children)]; }

test("English customer and marketplace UI dictionaries are complete and English", () => {
  for (const key of Object.keys(customerCopy)) {
    assert.ok(customerText("en", key)?.trim(), key);
    assert.doesNotMatch(customerText("en", key), /[\u0600-\u06ff]/);
  }
  for (const key of Object.keys(marketplaceCopy)) {
    assert.ok(marketplaceText("en", key)?.trim(), key);
    assert.doesNotMatch(marketplaceText("en", key), /[\u0600-\u06ff]/);
  }
});

test("English account and checkout feedback contains arbitrary backend and field text", () => {
  const fallback = "Check your connection and try again.";
  for (const status of [undefined, 400, 401, 403, 404, 413, 422, 429, 500]) {
    const error = Object.assign(new Error("PRIVATE_TRACE"), { status, fields: { detail: ["PRIVATE_TRACE"] } });
    for (const map of [accountError, checkoutError]) assert.doesNotMatch(map(error, "en", fallback), /PRIVATE_TRACE/);
  }
  assert.equal(accountError(new Error("An approved prescription is required."), "en", fallback), "An approved prescription is required.");
  assert.match(checkoutError(new Error("Insufficient stock for PRIVATE_MEDICINE."), "en", fallback), /not enough stock/);
  assert.doesNotMatch(checkoutError(new Error("Insufficient stock for PRIVATE_MEDICINE."), "en", fallback), /PRIVATE_MEDICINE/);
  assert.equal(accountValidation({ valueMissing: true }, "en"), "Complete this field.");
});

test("all locales use the approved account shell and normalize alias active states", () => {
  for (const language of ["en", "fa-AF", "ps-AF"]) {
    for (const [path, target] of [["/account/profile", "/account/profile"], ["/account/addresses/unit/edit", "/account/addresses"], ["/orders/unit", "/account/orders"], ["/notifications", "/account/notifications"], ["/prescriptions/success/unit", "/account/prescriptions"]]) {
      const { AccountShell } = component("../components/AccountShell.tsx", {
        "next/link": { default: "a" }, "next/navigation": { usePathname: () => path },
        "./LocaleProvider": { useLocale: () => ({ locale: language, t: key => textFor(language, key) }) }
      });
      const tree = AccountShell({ children: "content" });
      assert.match(tree.props.className, /approved-shell/);
      assert.deepEqual(nodes(tree).filter(n => n.props["aria-current"] === "page").map(n => n.props.href), [target]);
    }
  }
});

test("locale switching refreshes in place, persists locale and changes document direction", () => {
  const previous = globalThis.document;
  try {
    for (const initial of ["en", "fa-AF", "ps-AF"]) {
      const effects = [], changes = [];
      let refreshes = 0;
      globalThis.document = { cookie: "", documentElement: {} };
      const { LocaleProvider } = component("../components/LocaleProvider.tsx", {
        react: { createContext: () => ({ Provider: "context" }), useState: () => [initial, next => changes.push(next)], useEffect: effect => effects.push(effect) },
        "react-dom": { flushSync: action => action() },
        "next/navigation": { useRouter: () => ({ refresh: () => refreshes++ }) }
      });
      const tree = LocaleProvider({ locale: initial, children: "existing route and cart" });
      effects.forEach(effect => effect());
      assert.equal(document.documentElement.dir, initial === "en" ? "ltr" : "rtl");
      for (const next of ["fa-AF", "ps-AF", "en"]) tree.props.value.setLocale(next);
      assert.equal(refreshes, 3);
      assert.deepEqual(changes.slice(-3), ["fa-AF", "ps-AF", "en"]);
      assert.match(document.cookie, /^darmalton_locale=en; Path=\//);
      assert.equal(tree.props.children, "existing route and cart");
    }
  } finally { globalThis.document = previous; }
});
