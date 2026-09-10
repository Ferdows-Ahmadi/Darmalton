import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sources = await Promise.all(
  [
    "../lib/server-api.ts",
    "../app/api/auth/_shared.ts",
    "../app/api/backend/[...path]/route.ts",
    "../app/api/assets/[...path]/route.ts"
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8"))
);

test("all internal backend requests preserve the trusted HTTPS scheme", () => {
  for (const source of sources) {
    assert.match(source, /API_INTERNAL_FORWARDED_PROTO/);
    assert.match(source, /X-Forwarded-Proto/);
  }
});

test("the asset proxy does not pin temporary image fallbacks in the server cache", () => {
  assert.match(sources[3], /cache: "no-store"/);
  assert.doesNotMatch(sources[3], /cache: "force-cache"/);
});
