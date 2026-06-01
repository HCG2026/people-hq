import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");

test("contact rows use a real href plus explicit detail state when clicked", () => {
  assert.match(pageSource, /function openPerson\(personId: string\)/);
  assert.match(pageSource, /<a key=\{p\.id\} href=\{`\/\?person=\$\{encodeURIComponent\(p\.id\)\}`} onClick=\{\(\) => openPerson\(p\.id\)\}/);
});

test("contact detail back control explicitly returns to list state", () => {
  assert.match(pageSource, /function showContactList\(\)/);
  assert.match(pageSource, /<button onClick=\{showContactList\}/);
});
