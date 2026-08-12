import assert from "node:assert/strict";
import test from "node:test";

import { apiFetch } from "../lib/api.ts";
import {
  cmsResourceConfigs,
  cmsResources,
  cmsVisibility,
  cmsVisibilityLabels,
  isCmsResource,
  validateCmsSchedule
} from "../lib/staff-cms.ts";
import { staffNavigation } from "../lib/staff-navigation.ts";

function record(overrides = {}) {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    status: "PUBLISHED",
    is_active: true,
    display_order: 0,
    publish_from: "2026-08-05T09:00:00Z",
    publish_until: null,
    published_at: "2026-08-05T09:00:00Z",
    created_at: "2026-08-05T08:00:00Z",
    updated_at: "2026-08-05T09:00:00Z",
    ...overrides
  };
}

test("staff navigation exposes one dedicated CMS destination", () => {
  const entries = staffNavigation.filter(([href]) => href === "/staff/cms");
  assert.equal(entries.length, 1);
  assert.match(entries[0][1], /محتوا/);
});

test("health articles have a dedicated CMS collection", () => {
  assert.ok(cmsResources.includes("health-articles"));
  assert.equal(cmsResourceConfigs["health-articles"].endpoint, "cms/health-articles/");
  assert.equal(cmsResourceConfigs["health-articles"].hasImage, true);
});

test("CMS resources match the documented API collection routes", () => {
  assert.deepEqual(cmsResources, [
    "banners",
    "announcements",
    "pages",
    "health-articles",
    "featured-medicines"
  ]);
  for (const resource of cmsResources) {
    assert.equal(isCmsResource(resource), true);
    assert.equal(cmsResourceConfigs[resource].endpoint, `cms/${resource}/`);
  }
  assert.equal(isCmsResource("customers"), false);
  assert.equal(cmsResourceConfigs.banners.hasImage, true);
  assert.equal(cmsResourceConfigs.pages.hasImage, true);
  assert.equal(cmsResourceConfigs.announcements.hasImage, false);
});

test("CMS visibility distinguishes workflow and scheduling states", () => {
  const now = new Date("2026-08-05T10:00:00Z");
  assert.equal(cmsVisibility(record({ status: "DRAFT" }), now), "DRAFT");
  assert.equal(cmsVisibility(record({ status: "ARCHIVED" }), now), "ARCHIVED");
  assert.equal(cmsVisibility(record({ is_active: false }), now), "INACTIVE");
  assert.equal(
    cmsVisibility(record({ publish_from: "2026-08-05T11:00:00Z" }), now),
    "SCHEDULED"
  );
  assert.equal(
    cmsVisibility(record({ publish_until: "2026-08-05T10:00:00Z" }), now),
    "EXPIRED"
  );
  assert.equal(cmsVisibility(record(), now), "PUBLISHED");
  for (const state of ["DRAFT", "ARCHIVED", "INACTIVE", "SCHEDULED", "EXPIRED", "PUBLISHED"]) {
    assert.ok(cmsVisibilityLabels[state]);
  }
});

test("publication scheduling rejects an end before its start", () => {
  assert.equal(validateCmsSchedule("", ""), "");
  assert.equal(
    validateCmsSchedule("2026-08-05T12:00", "2026-08-05T11:00").length > 0,
    true
  );
  assert.equal(validateCmsSchedule("2026-08-05T11:00", "2026-08-05T12:00"), "");
});

test("API client preserves browser multipart boundaries for image uploads", async () => {
  const originalFetch = globalThis.fetch;
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return new Response(JSON.stringify({ id: "created" }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  };

  try {
    const body = new FormData();
    body.append("title_dari", "بنر آزمایشی");
    await apiFetch("cms/banners/", { method: "POST", body });
    assert.equal(captured.url, "/api/backend/cms/banners/");
    assert.equal(new Headers(captured.options.headers).has("Content-Type"), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
