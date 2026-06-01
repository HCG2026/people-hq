import assert from "node:assert/strict";
import test from "node:test";

import { ACCESS_COOKIE_NAME, isValidAccessPassword, publicAuthPaths } from "../src/lib/access";

test("accepts the configured access password exactly", () => {
  assert.equal(isValidAccessPassword("NHD", "NHD"), true);
});

test("rejects incorrect, blank, or case-mismatched passwords", () => {
  assert.equal(isValidAccessPassword("nhd", "NHD"), false);
  assert.equal(isValidAccessPassword("", "NHD"), false);
  assert.equal(isValidAccessPassword("NHD ", "NHD"), false);
  assert.equal(isValidAccessPassword("NHD", ""), false);
});

test("defines a stable access cookie and public auth routes", () => {
  assert.equal(ACCESS_COOKIE_NAME, "people_hq_access");
  assert.deepEqual(publicAuthPaths, ["/login", "/api/login"]);
});
