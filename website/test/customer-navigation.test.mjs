import assert from "node:assert/strict";
import test from "node:test";
import { desktopCustomerSection, isCustomerRoute, mobileCustomerSection } from "../lib/customer-navigation.ts";

test("customer chrome covers utility and detail routes but excludes internal namespaces", () => {
  for (const path of ["/", "/about", "/faq", "/checkout/login", "/categories/antibiotic", "/manufacturers/Getz", "/pages/about", "/health-articles/example", "/reset-password", "/missing-page"]) {
    assert.equal(isCustomerRoute(path), true, path);
  }
  for (const path of ["/staff", "/staff/orders", "/admin", "/admin/login", "/api", "/api/backend/orders"]) {
    assert.equal(isCustomerRoute(path), false, path);
    assert.equal(desktopCustomerSection(path), undefined);
    assert.equal(mobileCustomerSection(path), undefined);
  }
});

test("catalogue child routes select their desktop parent and the mobile Shop section", () => {
  for (const [path, desktop] of [["/shop", "/shop"], ["/medicines/sku", "/shop"], ["/categories/antibiotic", "/categories"], ["/manufacturers/Getz", "/manufacturers"]]) {
    assert.equal(desktopCustomerSection(path), desktop, path);
    assert.equal(mobileCustomerSection(path), "/shop", path);
  }
});

test("account aliases and prescription entry points keep distinct mobile sections", () => {
  for (const path of ["/account", "/account/profile", "/account/prescriptions/id", "/orders", "/orders/id", "/orders/success/id", "/notifications"]) {
    assert.equal(mobileCustomerSection(path), "/account", path);
  }
  for (const path of ["/prescriptions", "/prescriptions/upload", "/prescriptions/success/id"]) {
    assert.equal(mobileCustomerSection(path), "/prescriptions/upload", path);
    assert.equal(desktopCustomerSection(path), "/prescriptions/upload", path);
  }
  assert.equal(mobileCustomerSection("/checkout/login"), "/cart");
});

test("health aliases share a parent and unrelated utility routes stay unselected", () => {
  for (const path of ["/health", "/health/story", "/health-articles", "/health-articles/story"]) {
    assert.equal(desktopCustomerSection(path), "/health", path);
  }
  assert.equal(desktopCustomerSection("/"), "/");
  assert.equal(mobileCustomerSection("/"), "/");
  assert.equal(desktopCustomerSection("/app"), "/app");
  for (const path of ["/about", "/faq", "/prescription-help", "/shopper", "/orders-help", "/accounting"]) {
    assert.equal(desktopCustomerSection(path), undefined, path);
    assert.equal(mobileCustomerSection(path), undefined, path);
  }
});
