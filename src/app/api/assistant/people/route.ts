import { NextResponse } from "next/server";

import { mergePeople, parsePeoplePayload } from "@/lib/people";
import { configuredPeopleStore } from "@/lib/people-store";

export async function GET() {
  try {
    const store = configuredPeopleStore();
    const people = await store.readPeople();
    return NextResponse.json({ people });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load people" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const incoming = parsePeoplePayload(body.people);
    const store = configuredPeopleStore();
    const existing = await store.readPeople();
    const people = mergePeople(existing, incoming);
    await store.writePeople(people, body.message || "Update People HQ from assistant");
    return NextResponse.json({ addedOrUpdated: incoming.length, total: people.length, people });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save people" }, { status: 400 });
  }
}
