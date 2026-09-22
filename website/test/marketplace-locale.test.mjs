import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { marketplaceCopy, marketplaceText } from "../lib/marketplace-copy.ts";
import { cmsText } from "../lib/cms-locale.ts";
import { textFor } from "../lib/locale.ts";
import { checkoutError } from "../lib/checkout-feedback.ts";
import * as storefront from "../lib/storefront.ts";

const require = createRequire(import.meta.url);
function loadComponent(path, dependencies) {
  const output = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS }
  }).outputText;
  const loaded = { exports: {} };
  const resolve = name => dependencies[name] ?? (name.startsWith("react") ? require(name) : name.endsWith(".css") ? { default: {} } : {});
  new Function("require", "module", "exports", output)(resolve, loaded, loaded.exports);
  return loaded.exports;
}
function nodes(tree) {
  if (!tree || typeof tree !== "object") return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (typeof tree.type === "function") return nodes(tree.type(tree.props));
  return [tree, ...nodes(tree.props?.children)];
}
function content(tree) {
  if (Array.isArray(tree)) return tree.map(content).join("");
  if (typeof tree === "string" || typeof tree === "number") return String(tree);
  if (!tree) return "";
  if (typeof tree.type === "function") return content(tree.type(tree.props));
  return content(tree.props?.children);
}
const { MarketplaceHome } = loadComponent("../components/home/MarketplaceHome.tsx", {
  "next/link": { default: "a" }, "next/image": { default: "img" },
  "@/lib/marketplace-copy": { marketplaceText }, "@/lib/cms-locale": { cmsText },
  "@/lib/storefront": storefront,
  "@/components/HeroCarousel": { HeroCarousel: "hero" },
  "@/components/MedicineCard": { MedicineCard: "medicine-card" },
  "@/components/PublicAnnouncements": { PublicAnnouncements: "announcements" },
  "@/components/StoreUI": { State: "state" }
});
// Pure unit fixtures only; never persisted to the API or used for screenshots.
const medicines = Array.from({ length: 40 }, (_, i) => ({
  id: `fixture-${i}`, sku: `sku-${i}`, family_code: `family-${i}`, strength: "5mg",
  brand_name: "Untranslated Brand", prescription_required: i < 20,
  shopper_category: i < 20 ? "medicines" : i < 28 ? "vitamins-supplements" : "personal-care"
}));
const data = {
  cms: { heroes: [], announcements: [], featuredMedicines: [], articles: [] }, medicines,
  categories: [{ id: "category", name: "Antibiotic", slug: "antibiotic" }],
  manufacturers: [{ id: "maker", name: "Original Maker", product_count: 1 }]
};

test("Pashto reuses marketplace structure, destinations, assets and source medicine data", () => {
  const before = JSON.stringify(data);
  const fa = nodes(MarketplaceHome({ ...data, locale: "fa-AF" }));
  const ps = nodes(MarketplaceHome({ ...data, locale: "ps-AF" }));
  const geometry = tree => tree.map(({ type, props }) => ({ type, href: props.href, src: props.src, width: props.width, height: props.height, medicine: props.medicine, presentation: props.presentation }));
  assert.deepEqual(geometry(ps), geometry(fa));
  assert.equal(JSON.stringify(data), before);
  const faHeadings = fa.filter(n => n.type === "h2").map(content);
  const psHeadings = ps.filter(n => n.type === "h2").map(content);
  assert.deepEqual(faHeadings.slice(0, 3), ["داروها و محصولات صحی", "ویتامین‌ها و مکمل‌ها", "محصولات بدون نسخه"]);
  assert.deepEqual(psHeadings.slice(0, 3), ["درمل او روغتیایي توکي", "ویټامینونه او بشپړوونکي", "بې نسخې توکي"]);
  assert.equal(ps.find(n => n.type === "nav").props["aria-label"], "چټک لاسرسی");
  const psText = content(MarketplaceHome({ ...data, locale: "ps-AF" }));
  for (const copy of Object.values(marketplaceCopy)) assert.ok(!psText.includes(copy["fa-AF"]), `Dari UI leaked: ${copy["fa-AF"]}`);
});

test("homepage CMS source titles stay source content when Pashto fields do not exist", () => {
  const cms = { ...data.cms, articles: [{ id: "fixture", slug: "fixture", title: "Original source title", title_dari: "عنوان اصلی" }] };
  const ps = nodes(MarketplaceHome({ ...data, cms, locale: "ps-AF" }));
  const fa = nodes(MarketplaceHome({ ...data, cms, locale: "fa-AF" }));
  assert.equal(content(ps.find(n => n.props.href === "/health/fixture")), "Original source title←");
  assert.equal(content(fa.find(n => n.props.href === "/health/fixture")), "عنوان اصلی←");
});

test("Pashto marketplace cart action shows localized UI fallback without raw backend text", async () => {
  const messages = [];
  let state = 0;
  const { AddToCart } = loadComponent("../components/AddToCart.tsx", {
    react: { useState: () => ++state === 1 ? [false, () => {}] : ["", value => messages.push(value)] },
    "./LocaleProvider": { useLocale: () => ({ locale: "ps-AF", t: key => textFor("ps-AF", key) }) },
    "next/navigation": { useRouter: () => ({ push: () => {} }) },
    "@/lib/api": { ApiError: class extends Error {}, apiFetch: async () => { throw new Error("PRIVATE_BACKEND_SENTINEL"); } },
    "@/lib/checkout-feedback": { checkoutError }
  });
  const tree = AddToCart({ medicine: medicines[0], disabled: false, localizedFeedback: true });
  await nodes(tree).find(n => n.type === "button").props.onClick();
  assert.equal(messages.at(-1), textFor("ps-AF", "connection"));
  assert.doesNotMatch(messages.at(-1), /PRIVATE_BACKEND_SENTINEL/);
});
