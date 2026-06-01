export type PersonType = "personal" | "work";
export type TouchpointType = "coffee" | "call" | "dinner" | "meeting" | "text" | "email" | "other";

export type Touchpoint = {
  id: string;
  date: string;
  type: TouchpointType;
  summary: string;
  topics: string;
  followUp: string;
};

export type Person = {
  id: string;
  name: string;
  type: PersonType;
  relationship: string;
  organization: string;
  email: string;
  phone: string;
  metAt: string;
  metOn: string;
  priority: "A" | "B" | "C";
  tags: string;
  notes: string;
  lastContact: string;
  nextStep: string;
  touchpoints: Touchpoint[];
};

export const STORAGE_KEY = "people-hq:v1";

export const seedPeople: Person[] = [
  {
    id: "demo-dom",
    name: "Dom Example",
    type: "personal",
    relationship: "Friend / warm relationship",
    organization: "NYC",
    email: "",
    phone: "",
    metAt: "Coffee in Flatiron",
    metOn: "2026-06-01",
    priority: "A",
    tags: "NYC, soccer, founder energy",
    notes: "Demo record. Replace with the real Dom details when ready.",
    lastContact: "2026-06-01",
    nextStep: "Send quick note and suggest another coffee in 2-3 weeks.",
    touchpoints: [
      {
        id: "tp-demo-dom",
        date: "2026-06-01",
        type: "coffee",
        summary: "Met for coffee. Good energy and worth keeping warm.",
        topics: "life, work, NYC",
        followUp: "Text a thank-you note.",
      },
    ],
  },
];

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function uid(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const blankPerson = (): Person => ({
  id: uid("person"),
  name: "",
  type: "personal",
  relationship: "",
  organization: "",
  email: "",
  phone: "",
  metAt: "",
  metOn: today(),
  priority: "B",
  tags: "",
  notes: "",
  lastContact: today(),
  nextStep: "",
  touchpoints: [],
});

export function normalizeTouchpoint(input: Partial<Touchpoint> = {}): Touchpoint {
  return {
    id: input.id || uid("tp"),
    date: input.date || today(),
    type: input.type || "other",
    summary: input.summary || "",
    topics: input.topics || "",
    followUp: input.followUp || "",
  };
}

export function normalizePerson(input: Partial<Person>): Person {
  const base = blankPerson();
  return {
    ...base,
    ...input,
    id: input.id || base.id,
    name: (input.name || "Unnamed person").trim(),
    type: input.type || base.type,
    priority: input.priority || base.priority,
    touchpoints: Array.isArray(input.touchpoints) ? input.touchpoints.map(normalizeTouchpoint) : [],
  };
}

export function mergePeople(existing: Person[], incoming: Person[]): Person[] {
  const byId = new Map(existing.map((person) => [person.id, person]));
  for (const person of incoming) {
    byId.set(person.id, normalizePerson({ ...byId.get(person.id), ...person }));
  }
  return Array.from(byId.values());
}

export function parsePeoplePayload(input: unknown): Person[] {
  if (!Array.isArray(input)) {
    throw new Error("People payload must be an array");
  }
  return input.map((item) => normalizePerson(item as Partial<Person>));
}
