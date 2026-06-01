import assert from "node:assert/strict";
import test from "node:test";

import { ACCESS_COOKIE_NAME, accessCookieValue, isValidAccessPassword, publicAuthPaths } from "../src/lib/access";

test("accepts the configured access password exactly", () => {
  assert.equal(isValidAccessPassword("NHD", "NHD"), true);
});

test("rejects incorrect, blank, or case-mismatched passwords", () => {
  assert.equal(isValidAccessPassword("nhd", "NHD"), false);
  assert.equal(isValidAccessPassword("", "NHD"), false);
  assert.equal(isValidAccessPassword("NHD ", "NHD"), false);
  assert.equal(isValidAccessPassword("NHD", ""), false);
});

test("uses an opaque session token for the access cookie when configured", () => {
  assert.equal(accessCookieValue("NHD", "opaque-session-token"), "opaque-session-token");
});

test("does not put the raw password into the fallback access cookie", () => {
  assert.notEqual(accessCookieValue("NHD", undefined), "NHD");
});

test("defines a stable access cookie and public auth routes", () => {
  assert.equal(ACCESS_COOKIE_NAME, "people_hq_access");
  assert.deepEqual(publicAuthPaths, ["/login", "/api/login"]);
});
