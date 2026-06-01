import { NextResponse } from "next/server";

import { configuredPeopleStore } from "@/lib/people-store";
import { parsePeoplePayload } from "@/lib/people";

export async function GET() {
  try {
    const store = configuredPeopleStore();
    const people = await store.readPeople();
    return NextResponse.json({ people });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load people" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const people = parsePeoplePayload(body.people);
    const store = configuredPeopleStore();
    await store.writePeople(people, "Update People HQ from app");
    return NextResponse.json({ people });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save people" }, { status: 400 });
  }
}
