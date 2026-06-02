import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");

test("contact rows use a real href plus explicit detail state when clicked", () => {
  assert.match(pageSource, /function openPerson\(personId: string\)/);
  assert.match(pageSource, /href=\{`\/\?person=\$\{encodeURIComponent\(p\.id\)\}`} onClick=\{\(event\) => \{ event\.preventDefault\(\); openPerson\(p\.id\); \}\}/);
});

test("browser back and forward buttons sync the visible contact view from the URL", () => {
  assert.match(pageSource, /window\.addEventListener\("popstate", handlePopState\)/);
  assert.match(pageSource, /window\.removeEventListener\("popstate", handlePopState\)/);
  assert.match(pageSource, /new URL\(window\.location\.href\)\.searchParams\.get\("person"\)/);
  assert.match(pageSource, /setView\("list"\)/);
});

test("contact detail back control explicitly returns to list state", () => {
  assert.match(pageSource, /function showContactList\(\)/);
  assert.match(pageSource, /<button onClick=\{showContactList\}/);
  assert.match(pageSource, /sticky top-0/);
  assert.match(pageSource, /pb-3 pt-12/);
});
