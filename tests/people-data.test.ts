import assert from "node:assert/strict";
import test from "node:test";

import { isValidAssistantToken } from "../src/lib/access";
import { mergePeople, normalizePerson, type Person } from "../src/lib/people";
import { GitHubPeopleStore } from "../src/lib/people-store";

const basePerson: Person = {
  id: "person-a",
  name: "Alex Person",
  type: "work",
  relationship: "Friend",
  organization: "Org",
  email: "",
  phone: "",
  metAt: "Coffee",
  metOn: "2026-06-01",
  priority: "B",
  tags: "tag",
  notes: "old notes",
  lastContact: "2026-06-01",
  nextStep: "old next",
  touchpoints: [],
};

test("assistant token only accepts exact bearer token", () => {
  assert.equal(isValidAssistantToken("Bearer secret", "secret"), true);
  assert.equal(isValidAssistantToken("Bearer wrong", "secret"), false);
  assert.equal(isValidAssistantToken("secret", "secret"), false);
  assert.equal(isValidAssistantToken("Bearer secret ", "secret"), false);
  assert.equal(isValidAssistantToken("Bearer secret", undefined), false);
});

test("normalizes partial people without losing required fields", () => {
  const person = normalizePerson({
    id: "person-oakley-d-2026-06",
    name: " Oakley D. ",
    phone: "+1 (720) 789-0492",
    notes: "Startup founder",
  });

  assert.equal(person.id, "person-oakley-d-2026-06");
  assert.equal(person.name, "Oakley D.");
  assert.equal(person.phone, "+1 (720) 789-0492");
  assert.equal(person.type, "personal");
  assert.equal(person.priority, "B");
  assert.deepEqual(person.touchpoints, []);
});

test("mergePeople adds new records and updates existing records by id", () => {
  const merged = mergePeople([basePerson], [
    { ...basePerson, notes: "new notes", nextStep: "new next" },
    { ...basePerson, id: "person-b", name: "Blair Person" },
  ]);

  assert.equal(merged.length, 2);
  assert.equal(merged[0].id, "person-a");
  assert.equal(merged[0].notes, "new notes");
  assert.equal(merged[1].id, "person-b");
});

test("GitHubPeopleStore reads and writes the private data repository", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetcher: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    if (init?.method !== "PUT") {
      return new Response(
        JSON.stringify({
          sha: "abc123",
          content: Buffer.from(JSON.stringify([basePerson])).toString("base64"),
        }),
        { status: 200 },
      );
    }
    return new Response(JSON.stringify({ content: { sha: "def456" } }), { status: 200 });
  };

  const store = new GitHubPeopleStore({
    ownerRepo: "HCG2026/people-hq-data",
    path: "people.json",
    token: "gh_token",
    fetcher,
  });

  const people = await store.readPeople();
  assert.equal(people[0].name, "Alex Person");

  await store.writePeople([{ ...basePerson, notes: "updated" }], "test update");

  assert.equal(calls.length, 3);
  assert.match(calls[0].url, /repos\/HCG2026\/people-hq-data\/contents\/people\.json/);
  assert.equal(calls[0].init?.method, undefined);
  assert.equal(calls[2].init?.method, "PUT");
  assert.equal((calls[2].init?.headers as Record<string, string>).Authorization, "Bearer gh_token");
  const body = JSON.parse(String(calls[2].init?.body));
  assert.equal(body.sha, "abc123");
  assert.equal(body.message, "test update");
  assert.deepEqual(JSON.parse(Buffer.from(body.content, "base64").toString("utf8"))[0].notes, "updated");
});
