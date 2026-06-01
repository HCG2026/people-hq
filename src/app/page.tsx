"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { blankPerson, seedPeople, STORAGE_KEY, today, uid, type Person, type PersonType, type Touchpoint, type TouchpointType } from "@/lib/people";

function daysSince(date?: string) {
  if (!date) return 9999;
  const d = new Date(`${date}T00:00:00`);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
}

function parseQuickCapture(text: string): Partial<Person> & { touchpoint?: Partial<Touchpoint> } {
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const lower = text.toLowerCase();
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
  const phone = text.match(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/)?.[0] ?? "";
  const nameLine = lines.find((l) => /^name\s*:/i.test(l));
  const rawName = nameLine ? nameLine.replace(/^name\s*:/i, "").trim() : lines[0]?.replace(/^met\s+/i, "").split(/[,.—-]/)[0]?.trim();
  const name = rawName
    ?.replace(/\s+for\s+(coffee|lunch|dinner|drinks|a call|call|meeting).*$/i, "")
    .replace(/\s+at\s+.*$/i, "")
    .replace(/\s+today$/i, "")
    .trim();

  const type: PersonType = lower.includes("work") || lower.includes("centerbridge") || lower.includes("finance") ? "work" : "personal";
  const touchType: TouchpointType = lower.includes("coffee")
    ? "coffee"
    : lower.includes("dinner")
      ? "dinner"
      : lower.includes("call")
        ? "call"
        : lower.includes("meeting")
          ? "meeting"
          : "other";

  return {
    name: name || "",
    type,
    email,
    phone,
    metOn: today(),
    lastContact: today(),
    notes: text,
    touchpoint: {
      date: today(),
      type: touchType,
      summary: text,
      topics: "",
      followUp: "",
    },
  };
}

export default function Home() {
  const [people, setPeople] = useState<Person[]>(() => {
    if (typeof window === "undefined") return seedPeople;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Person[]) : seedPeople;
  });
  const [selectedId, setSelectedId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | PersonType>("all");
  const [form, setForm] = useState<Person>(blankPerson());
  const [quickText, setQuickText] = useState("");
  const [syncStatus, setSyncStatus] = useState("Loading server sync…");
  const serverEnabled = useRef(false);
  const loadedServer = useRef(false);
  const skipNextServerSave = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadServerPeople() {
      try {
        const response = await fetch("/api/people", { cache: "no-store" });
        if (!response.ok) throw new Error("server unavailable");
        const body = (await response.json()) as { people?: Person[] };
        if (cancelled) return;
        serverEnabled.current = true;
        loadedServer.current = true;
        skipNextServerSave.current = true;
        const remotePeople = Array.isArray(body.people) ? body.people : [];
        setPeople(remotePeople);
        setSelectedId(remotePeople[0]?.id ?? "");
        setSyncStatus(`Server sync on · ${remotePeople.length} people`);
      } catch {
        if (cancelled) return;
        loadedServer.current = true;
        setSyncStatus("Local-only fallback · server sync not configured");
      }
    }

    loadServerPeople();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(people));
  }, [people]);

  useEffect(() => {
    if (!serverEnabled.current || !loadedServer.current) return;
    if (skipNextServerSave.current) {
      skipNextServerSave.current = false;
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setSyncStatus("Saving to server…");
        const response = await fetch("/api/people", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ people }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("save failed");
        setSyncStatus(`Server sync on · ${people.length} people`);
      } catch {
        if (!controller.signal.aborted) setSyncStatus("Save failed · local backup kept in this browser");
      }
    }, 700);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [people]);

  const selected = people.find((p) => p.id === selectedId) ?? people[0];

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return people
      .filter((p) => filter === "all" || p.type === filter)
      .filter((p) => [p.name, p.relationship, p.organization, p.tags, p.notes].join(" ").toLowerCase().includes(q))
      .sort((a, b) => {
        const priority = { A: 0, B: 1, C: 2 };
        return priority[a.priority] - priority[b.priority] || daysSince(b.lastContact) - daysSince(a.lastContact);
      });
  }, [people, query, filter]);

  const stale = people.filter((p) => daysSince(p.lastContact) > 45);
  const work = people.filter((p) => p.type === "work").length;
  const personal = people.filter((p) => p.type === "personal").length;

  function updateForm<K extends keyof Person>(key: K, value: Person[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function savePerson(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const next = { ...form, name: form.name.trim(), id: form.id || uid("person") };
    setPeople((prev) => {
      const exists = prev.some((p) => p.id === next.id);
      return exists ? prev.map((p) => (p.id === next.id ? next : p)) : [next, ...prev];
    });
    setSelectedId(next.id);
    setForm(blankPerson());
  }

  function editPerson(p: Person) {
    setForm(p);
    setSelectedId(p.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addQuickCapture() {
    if (!quickText.trim()) return;
    const parsed = parseQuickCapture(quickText);
    const person: Person = {
      ...blankPerson(),
      ...parsed,
      id: uid("person"),
      name: parsed.name?.trim() || "Unnamed person",
      touchpoints: parsed.touchpoint
        ? [{ id: uid("tp"), date: today(), type: "other", summary: "", topics: "", followUp: "", ...parsed.touchpoint } as Touchpoint]
        : [],
    };
    setPeople((prev) => [person, ...prev]);
    setSelectedId(person.id);
    setQuickText("");
  }

  function addTouchpoint(personId: string) {
    const summary = window.prompt("What happened? Example: Coffee at Blank Street. Discussed career, family, Mexico City.");
    if (!summary) return;
    const followUp = window.prompt("Follow-up / next step?", "") ?? "";
    setPeople((prev) =>
      prev.map((p) =>
        p.id === personId
          ? {
              ...p,
              lastContact: today(),
              nextStep: followUp || p.nextStep,
              touchpoints: [
                { id: uid("tp"), date: today(), type: "other", summary, topics: "", followUp },
                ...p.touchpoints,
              ],
            }
          : p,
      ),
    );
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(people, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `people-hq-export-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const imported = JSON.parse(String(reader.result)) as Person[];
      setPeople(imported);
      setSelectedId(imported[0]?.id ?? "");
    };
    reader.readAsText(file);
  }

  const agentPrompt = `Add this to People HQ:\nName:\nPersonal or work:\nWhere/when I met them:\nPhone/email:\nWhat we discussed:\nNext step:\nUse concise notes. Do not include confidential work details.`;

  return (
    <main className="min-h-screen bg-[#07110d] text-[#f4ecd8]">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-5 flex flex-col gap-4 border-b border-[#d8cba3]/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-emerald-300/70">local-first relationship OS</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#fff8df] sm:text-5xl">People HQ</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#c9bea0]">
              A private, phone-first place to remember who you meet, what mattered, and the next move. Data now syncs to your private server store so Hermes can add/update records when you ask.
            </p>
          </div>
          <div className="rounded-2xl border border-[#d8cba3]/15 bg-black/25 px-4 py-3 font-mono text-xs text-[#c9bea0]">
            server-backed · {people.length} people · {syncStatus}
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-[#d8cba3]/15 bg-[#0b1712] p-4 shadow-2xl shadow-black/25">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Quick capture</h2>
              <span className="font-mono text-[11px] text-emerald-300/70">fast enough for after coffee</span>
            </div>
            <textarea
              className="min-h-36 w-full rounded-2xl border border-[#d8cba3]/15 bg-black/25 p-4 text-sm leading-6 text-[#fff8df] outline-none placeholder:text-[#7f765f] focus:border-emerald-300/50"
              placeholder="Met Dom for coffee today. Personal. Phone/email. Discussed investing, Mexico City, friends in NYC. Follow up in two weeks."
              value={quickText}
              onChange={(e) => setQuickText(e.target.value)}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={addQuickCapture} className="rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#07110d]">Add person</button>
              <button onClick={() => navigator.clipboard.writeText(agentPrompt)} className="rounded-full border border-[#d8cba3]/20 px-4 py-2 text-sm text-[#f4ecd8]">Copy Hermes/Cowork intake prompt</button>
            </div>
          </div>

          <form onSubmit={savePerson} className="rounded-3xl border border-[#d8cba3]/15 bg-[#0b1712] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Structured add / edit</h2>
              <button type="button" onClick={() => setForm(blankPerson())} className="font-mono text-xs text-[#c9bea0] underline decoration-[#d8cba3]/30">new blank</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input className="field col-span-2" placeholder="Name" value={form.name} onChange={(e) => updateForm("name", e.target.value)} />
              <select className="field" value={form.type} onChange={(e) => updateForm("type", e.target.value as PersonType)}>
                <option value="personal">Personal</option>
                <option value="work">Work</option>
              </select>
              <select className="field" value={form.priority} onChange={(e) => updateForm("priority", e.target.value as Person["priority"])}>
                <option value="A">A priority</option>
                <option value="B">B priority</option>
                <option value="C">C priority</option>
              </select>
              <input className="field" placeholder="Relationship" value={form.relationship} onChange={(e) => updateForm("relationship", e.target.value)} />
              <input className="field" placeholder="Org / context" value={form.organization} onChange={(e) => updateForm("organization", e.target.value)} />
              <input className="field" placeholder="Email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} />
              <input className="field" placeholder="Phone" value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} />
              <input className="field" placeholder="Met at" value={form.metAt} onChange={(e) => updateForm("metAt", e.target.value)} />
              <input className="field" type="date" value={form.metOn} onChange={(e) => updateForm("metOn", e.target.value)} />
              <input className="field col-span-2" placeholder="Tags" value={form.tags} onChange={(e) => updateForm("tags", e.target.value)} />
              <textarea className="field col-span-2 min-h-20" placeholder="Notes / what matters" value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} />
              <input className="field col-span-2" placeholder="Next step" value={form.nextStep} onChange={(e) => updateForm("nextStep", e.target.value)} />
            </div>
            <button className="mt-3 w-full rounded-full bg-[#f4ecd8] px-4 py-2 text-sm font-semibold text-[#07110d]">Save person</button>
          </form>
        </section>

        <section className="my-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total" value={people.length} />
          <Stat label="Personal" value={personal} />
          <Stat label="Work" value={work} />
          <Stat label="Cold 45d+" value={stale.length} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-[#d8cba3]/15 bg-[#0b1712] p-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row">
              <input className="field flex-1" placeholder="Search people, topics, tags" value={query} onChange={(e) => setQuery(e.target.value)} />
              <select className="field sm:w-36" value={filter} onChange={(e) => setFilter(e.target.value as "all" | PersonType)}>
                <option value="all">All</option>
                <option value="personal">Personal</option>
                <option value="work">Work</option>
              </select>
            </div>
            <div className="divide-y divide-[#d8cba3]/10 overflow-hidden rounded-2xl border border-[#d8cba3]/10">
              {filtered.map((p) => (
                <button key={p.id} onClick={() => setSelectedId(p.id)} className={`block w-full px-4 py-3 text-left transition ${selectedId === p.id ? "bg-emerald-300/10" : "bg-black/15 hover:bg-white/[0.04]"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-[#fff8df]">{p.name}</span>
                    <span className="rounded-full border border-[#d8cba3]/15 px-2 py-0.5 font-mono text-[10px] uppercase text-[#c9bea0]">{p.type} · {p.priority}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-[#9f9578]">{p.relationship || p.organization || p.tags || "No context yet"}</p>
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={exportData} className="rounded-full border border-[#d8cba3]/20 px-3 py-2 text-xs text-[#f4ecd8]">Export JSON backup</button>
              <label className="cursor-pointer rounded-full border border-[#d8cba3]/20 px-3 py-2 text-xs text-[#f4ecd8]">
                Import JSON
                <input type="file" accept="application/json" className="hidden" onChange={importData} />
              </label>
            </div>
          </div>

          <div className="rounded-3xl border border-[#d8cba3]/15 bg-[#0b1712] p-4">
            {selected ? (
              <div>
                <div className="flex flex-col gap-3 border-b border-[#d8cba3]/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-300/70">{selected.type} · priority {selected.priority}</p>
                    <h2 className="mt-1 text-3xl font-semibold text-[#fff8df]">{selected.name}</h2>
                    <p className="mt-1 text-sm text-[#c9bea0]">{selected.relationship} {selected.organization ? `· ${selected.organization}` : ""}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => editPerson(selected)} className="rounded-full border border-[#d8cba3]/20 px-3 py-2 text-xs">Edit</button>
                    <button onClick={() => addTouchpoint(selected.id)} className="rounded-full bg-emerald-300 px-3 py-2 text-xs font-semibold text-[#07110d]">Log touchpoint</button>
                  </div>
                </div>
                <div className="my-4 grid gap-3 sm:grid-cols-2">
                  <Info label="Met" value={[selected.metOn, selected.metAt].filter(Boolean).join(" · ")} />
                  <Info label="Last contact" value={`${selected.lastContact || "n/a"} (${daysSince(selected.lastContact)}d ago)`} />
                  <Info label="Email" value={selected.email || "—"} />
                  <Info label="Phone" value={selected.phone || "—"} />
                  <Info label="Tags" value={selected.tags || "—"} />
                  <Info label="Next step" value={selected.nextStep || "—"} />
                </div>
                <div className="rounded-2xl border border-[#d8cba3]/10 bg-black/20 p-4">
                  <p className="mb-2 font-mono text-xs uppercase tracking-[0.22em] text-[#9f9578]">Notes</p>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-[#e7dcc0]">{selected.notes || "No notes yet."}</p>
                </div>
                <div className="mt-4">
                  <h3 className="mb-2 text-sm font-semibold text-[#fff8df]">Discussions</h3>
                  <div className="space-y-2">
                    {selected.touchpoints.length ? selected.touchpoints.map((t) => (
                      <div key={t.id} className="rounded-2xl border border-[#d8cba3]/10 bg-black/20 p-3">
                        <div className="mb-1 flex items-center justify-between font-mono text-[11px] text-[#9f9578]"><span>{t.date} · {t.type}</span><span>{t.followUp ? "follow-up set" : ""}</span></div>
                        <p className="text-sm leading-6 text-[#e7dcc0]">{t.summary}</p>
                        {t.followUp && <p className="mt-2 text-xs text-emerald-200/80">Next: {t.followUp}</p>}
                      </div>
                    )) : <p className="text-sm text-[#9f9578]">No discussions logged yet.</p>}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#c9bea0]">Add a person to start.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#d8cba3]/15 bg-[#0b1712] p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#9f9578]">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[#fff8df]">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#d8cba3]/10 bg-black/20 p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#9f9578]">{label}</p>
      <p className="mt-1 break-words text-sm text-[#e7dcc0]">{value}</p>
    </div>
  );
}
