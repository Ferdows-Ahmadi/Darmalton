import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { proxiedAssetUrl } from "../lib/normalize-backend-payload.ts";

const publicCms = readFileSync(
  new URL("../lib/public-cms.ts", import.meta.url),
  "utf8"
);
const home = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const heroCarousel = readFileSync(
  new URL("../components/HeroCarousel.tsx", import.meta.url),
  "utf8"
);
const articleIndex = readFileSync(
  new URL("../app/health-articles/page.tsx", import.meta.url),
  "utf8"
);
const articleDetail = readFileSync(
  new URL("../app/health-articles/[slug]/page.tsx", import.meta.url),
  "utf8"
);
const infoPage = readFileSync(
  new URL("../app/pages/[slug]/page.tsx", import.meta.url),
  "utf8"
);

test("public CMS reads only anonymous visibility-filtered collections", () => {
  assert.match(publicCms, /publicApi<PageResult<T>>/);
  assert.match(publicCms, /placement=HOME_HERO/);
  assert.match(publicCms, /placement=HOME_FEATURED/);
  assert.match(publicCms, /cms\/health-articles/);
  assert.doesNotMatch(publicCms, /apiFetch|status=PUBLISHED|is_active=true/);
});

test("public CMS media remains behind the same-site guarded asset proxy", () => {
  assert.equal(
    proxiedAssetUrl("http://backend:8000/api/v1/cms/banners/id/image/"),
    "/api/assets/api/v1/cms/banners/id/image"
  );
  assert.equal(
    proxiedAssetUrl("/api/v1/cms/health-articles/id/image/"),
    "/api/assets/api/v1/cms/health-articles/id/image"
  );
  assert.equal(
    proxiedAssetUrl("http://backend:8000/api/v1/cms/announcements/id/image/"),
    "http://backend:8000/api/v1/cms/announcements/id/image/"
  );
});

test("Home uses CMS with curated zero-state fallbacks", () => {
  assert.match(home, /publicHomeCms/);
  assert.match(home, /<HeroCarousel slides=\{heroes\}/);
  assert.match(heroCarousel, /health-delivered\.webp/);
  assert.match(heroCarousel, /t\("heroTitle"\)/);
  assert.match(home, /cmsFamilies\.length/);
  assert.match(home, /articles\.length > 0/);
});

test("public CMS routes provide list, detail, and informational zero states", () => {
  assert.match(articleIndex, /هنوز مقاله‌ای منتشر نشده است/);
  assert.match(articleDetail, /if \(!article\) notFound\(\)/);
  assert.match(infoPage, /if \(!page\) notFound\(\)/);
});
