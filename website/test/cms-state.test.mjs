import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { cmsText } from "../lib/cms-locale.ts";
import { textFor } from "../lib/locale.ts";
import { createRequire } from "node:module";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Render the real TSX components with only framework/context boundaries stubbed.
const require = createRequire(import.meta.url);
function loadComponent(path, dependencies = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const compiledModule = { exports: {} };
  const dependency = name => {
    if (name in dependencies) return dependencies[name];
    if (name.endsWith("LocaleProvider")) return { useLocale: () => ({ locale: "fa-AF", t: key => textFor("fa-AF", key) }) };
    if (name.endsWith(".css")) return { default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (name === "next/link") return { default: ({ children, ...props }) => React.createElement("a", props, children) };
    return require(name);
  };
  new Function("require", "module", "exports", compiled)(dependency, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}

test("CMS selects real Dari fields and preserves source fallback without translation", () => {
  assert.equal(cmsText("Original source", "متن اصلی", "fa-AF"), "متن اصلی");
  assert.equal(cmsText("Original source", "", "fa-AF"), "Original source");
  assert.equal(cmsText("", "", "fa-AF"), "");
  assert.equal(cmsText("Source", "متن", "en"), "Source");
  // Schema has no Pashto fields; this is explicitly a source fallback, not Pashto content.
  assert.equal(cmsText("Source", "متن", "ps-AF"), "Source");
});

test("Dari missing-content and loading UI have distinct localized messages", () => {
  const keys = ["notFound", "missingArticle", "missingCms", "loading", "retry", "generalError"];
  const labels = keys.map(key => textFor("fa-AF", key));
  assert.equal(new Set(labels).size, keys.length);
  for (const label of labels) { assert.match(label, /[\u0600-\u06ff]/); assert.doesNotMatch(label, /[A-Za-z]/); }
});

test("error boundary passes retry without rendering raw error data; Shop reuses localized loading", () => {
  const error = readFileSync(new URL("../app/error.tsx", import.meta.url), "utf8");
  assert.match(error, /retry=\{reset\}/);
  assert.doesNotMatch(error, /error\.(message|stack|digest)/);
  const loading = readFileSync(new URL("../app/loading.tsx", import.meta.url), "utf8");
  assert.match(loading, /aria-label=\{t\("loading"\)\}/);
  assert.match(loading, /aria-hidden="true"/);
  assert.match(readFileSync(new URL("../app/shop/loading.tsx", import.meta.url), "utf8"), /export \{ default \} from "\.\.\/loading"/);
});

test("real error component renders safe Dari feedback and its button invokes the supplied reset", () => {
  const { ApplicationState } = loadComponent("../components/ApplicationState.tsx");
  const { default: ErrorBoundary } = loadComponent("../app/error.tsx", { "@/components/ApplicationState": { ApplicationState } });
  let resets = 0;
  const reset = () => { resets++; };
  const html = renderToStaticMarkup(React.createElement(ErrorBoundary, { error: new Error("PRIVATE_DEBUG_SENTINEL"), reset }));
  assert.match(html, /role="alert"/);
  assert.match(html, /مشکلی پیش آمد/);
  assert.match(html, /کوشش دوباره/);
  assert.doesNotMatch(html, /PRIVATE_DEBUG_SENTINEL/);
  const state = ApplicationState({ title: "generalError", body: "connection", retry: reset });
  const button = state.props.children.props.children.find(child => child?.type === "button");
  button.props.onClick();
  assert.equal(resets, 1);
});

test("real loading component exposes a Dari status and hides decorative skeletons", () => {
  const { default: Loading } = loadComponent("../app/loading.tsx");
  const html = renderToStaticMarkup(React.createElement(Loading));
  assert.match(html, /role="status" aria-label="در حال بارگذاری…"/);
  assert.match(html, /aria-hidden="true"/);
  assert.doesNotMatch(html, /aria-label="Loading"/);
});
