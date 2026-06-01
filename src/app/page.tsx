"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

import { blankPerson, seedPeople, STORAGE_KEY, today, uid, type Person, type PersonType, type Touchpoint, type TouchpointType } from "@/lib/people";

function daysSince(date?: string) {
  if (!date) return 9999;
  const d = new Date(`${date}T00:00:00`);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
}

function formatDate(date?: string) {
  if (!date) return "Not logged";
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}

function parseLabel(text: string, label: string) {
  const match = text.match(new RegExp(`^${label}\\s*:\\s*(.+)$`, "im"));
  return match?.[1]?.trim() ?? "";
}

function parseQuickCapture(text: string): Partial<Person> & { touchpoint?: Partial<Touchpoint> } {
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const lower = text.toLowerCase();
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
  const phone = text.match(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/)?.[0] ?? "";
  const nameLine = parseLabel(text, "name");
  const rawName = nameLine || lines[0]?.replace(/^met\s+/i, "").split(/[,.—-]/)[0]?.trim();
  const name = rawName
    ?.replace(/\s+for\s+(coffee|lunch|dinner|drinks|a call|call|meeting).*$/i, "")
    .replace(/\s+at\s+.*$/i, "")
    .replace(/\s+today$/i, "")
    .trim();

  const typeText = parseLabel(text, "personal or work").toLowerCase();
  const type: PersonType =
    typeText.includes("work") || lower.includes("work") || lower.includes("centerbridge") || lower.includes("finance") ? "work" : "personal";
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
    phone: parseLabel(text, "phone") || phone,
    relationship: parseLabel(text, "relationship"),
    organization: parseLabel(text, "org / context") || parseLabel(text, "organization"),
    metAt: parseLabel(text, "where/when i met them") || parseLabel(text, "met at"),
    metOn: today(),
    priority: lower.includes("priority: a") ? "A" : lower.includes("priority: c") ? "C" : "B",
    tags: parseLabel(text, "tags"),
    lastContact: today(),
    nextStep: parseLabel(text, "next step"),
    notes: text,
    touchpoint: {
      date: today(),
      type: touchType,
      summary: parseLabel(text, "what we discussed") || text,
      topics: parseLabel(text, "tags"),
      followUp: parseLabel(text, "next step"),
    },
  };
}

export default function Home() {
  const [people, setPeople] = useState<Person[]>(() => {
    if (typeof window === "undefined") return seedPeople;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Person[]) : seedPeople;
  });
  const [selectedId, setSelectedId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return new URL(window.location.href).searchParams.get("person") ?? "";
  });
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | PersonType>("all");
  const [quickText, setQuickText] = useState("");
  const [syncStatus, setSyncStatus] = useState("Loading sync…");
  const [view, setView] = useState<"list" | "detail">(() => {
    if (typeof window === "undefined") return "list";
    return new URL(window.location.href).searchParams.get("person") ? "detail" : "list";
  });
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
        const requestedId = new URL(window.location.href).searchParams.get("person");
        setSelectedId(requestedId || remotePeople[0]?.id || "");
        setView(requestedId ? "detail" : "list");
        setSyncStatus(`Synced · ${remotePeople.length} people`);
      } catch {
        if (cancelled) return;
        loadedServer.current = true;
        setSyncStatus("Local fallback on this device");
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
        setSyncStatus("Saving…");
        const response = await fetch("/api/people", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ people }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("save failed");
        setSyncStatus(`Synced · ${people.length} people`);
      } catch {
        if (!controller.signal.aborted) setSyncStatus("Save failed · local backup kept");
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
      .filter((p) => [p.name, p.relationship, p.organization, p.tags, p.notes, p.phone, p.email].join(" ").toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [people, query, filter]);

  const stale = people.filter((p) => daysSince(p.lastContact) > 45);
  const work = people.filter((p) => p.type === "work").length;
  const personal = people.filter((p) => p.type === "personal").length;

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
    setView("detail");
    window.history.pushState(null, "", `/?person=${encodeURIComponent(person.id)}`);
  }

  function openPerson(personId: string) {
    setSelectedId(personId);
    setView("detail");
    window.history.pushState(null, "", `/?person=${encodeURIComponent(personId)}`);
  }

  function showContactList() {
    setView("list");
    window.history.pushState(null, "", "/");
  }

  function addTouchpoint(personId: string) {
    const summary = window.prompt("What happened? Example: Coffee. Discussed startup, family, poker.");
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
      setView("list");
    };
    reader.readAsText(file);
  }

  const agentPrompt = `Add this to People HQ:\nName:\nPersonal or work:\nWhere/when I met them:\nPhone/email:\nWhat we discussed:\nNext step:\nUse concise notes. Do not include confidential work details.`;

  if (view === "detail" && selected) {
    return (
      <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
        <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6">
          <button onClick={showContactList} className="mb-4 inline-flex min-h-11 items-center rounded-full px-1 text-[17px] text-[#0071e3]">
            ‹ Contacts
          </button>

          <section className="overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.08)]">
            <div className="flex flex-col items-center px-6 pb-8 pt-10 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#e8f2ff] text-3xl font-semibold tracking-[-0.03em] text-[#0071e3]">
                {initials(selected.name)}
              </div>
              <h1 className="mt-5 text-[34px] font-semibold leading-tight tracking-[-0.03em]">{selected.name}</h1>
              <p className="mt-2 max-w-xl text-[17px] leading-6 text-black/55">
                {[selected.relationship, selected.organization].filter(Boolean).join(" · ") || "No context yet"}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Pill>{selected.type}</Pill>
                <Pill>Priority {selected.priority}</Pill>
                <Pill>Last contact {formatDate(selected.lastContact)}</Pill>
              </div>
            </div>

            <div className="divide-y divide-black/10 border-t border-black/10">
              <InfoRow label="Phone" value={selected.phone || "—"} />
              <InfoRow label="Email" value={selected.email || "—"} />
              <InfoRow label="Met" value={[formatDate(selected.metOn), selected.metAt].filter(Boolean).join(" · ")} />
              <InfoRow label="Tags" value={selected.tags || "—"} />
              <InfoRow label="Next step" value={selected.nextStep || "—"} />
            </div>
          </section>

          <section className="mt-4 rounded-[2rem] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.08)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-[22px] font-semibold tracking-[-0.02em]">Notes</h2>
              <button onClick={() => addTouchpoint(selected.id)} className="min-h-11 rounded-full bg-[#0071e3] px-4 text-[15px] font-medium text-white">
                Log touchpoint
              </button>
            </div>
            <p className="whitespace-pre-wrap text-[15px] leading-6 text-black/70">{selected.notes || "No notes yet."}</p>
          </section>

          <section className="mt-4 rounded-[2rem] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.08)]">
            <h2 className="mb-3 text-[22px] font-semibold tracking-[-0.02em]">Timeline</h2>
            <div className="space-y-3">
              {selected.touchpoints.length ? (
                selected.touchpoints.map((t) => (
                  <div key={t.id} className="rounded-3xl bg-[#f5f5f7] p-4">
                    <p className="text-[13px] font-medium uppercase tracking-[0.04em] text-black/45">
                      {formatDate(t.date)} · {t.type}
                    </p>
                    <p className="mt-1 text-[15px] leading-6 text-black/75">{t.summary}</p>
                    {t.followUp && <p className="mt-2 text-[15px] text-[#0071e3]">Next: {t.followUp}</p>}
                  </div>
                ))
              ) : (
                <p className="text-[15px] text-black/50">No touchpoints logged yet.</p>
              )}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6">
        <header className="pb-5">
          <p className="text-[13px] font-medium text-black/45">People HQ</p>
          <div className="mt-1 flex items-end justify-between gap-3">
            <div>
              <h1 className="text-[40px] font-semibold leading-none tracking-[-0.045em] sm:text-[52px]">Contacts</h1>
              <p className="mt-3 max-w-xl text-[17px] leading-6 text-black/58">Friendly relationship memory, synced for Hermes updates.</p>
            </div>
            <div className="hidden rounded-full bg-white px-4 py-2 text-[13px] text-black/50 shadow-[0_10px_35px_rgba(0,0,0,0.06)] sm:block">{syncStatus}</div>
          </div>
        </header>

        <section className="rounded-[2rem] bg-white p-4 shadow-[0_18px_55px_rgba(0,0,0,0.08)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[22px] font-semibold tracking-[-0.02em]">Quick capture</h2>
            <span className="rounded-full bg-[#f5f5f7] px-3 py-1 text-[12px] text-black/45">voice-note friendly</span>
          </div>
          <textarea
            className="min-h-32 w-full resize-none rounded-[1.35rem] border-0 bg-[#f5f5f7] p-4 text-[16px] leading-6 text-[#1d1d1f] outline-none placeholder:text-black/35 focus:ring-2 focus:ring-[#0071e3]/25"
            placeholder="Met Oakley for coffee. Work + personal. Blackstone real estate debt, real estate AI startup, poker. Follow up in 3 weeks."
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={addQuickCapture} className="min-h-11 rounded-full bg-[#0071e3] px-5 text-[16px] font-medium text-white">
              Add person
            </button>
            <button onClick={() => navigator.clipboard.writeText(agentPrompt)} className="min-h-11 rounded-full bg-[#f5f5f7] px-5 text-[16px] font-medium text-[#0071e3]">
              Copy intake prompt
            </button>
          </div>
        </section>

        <section className="my-4 grid grid-cols-4 gap-2">
          <Stat label="Total" value={people.length} />
          <Stat label="Personal" value={personal} />
          <Stat label="Work" value={work} />
          <Stat label="45d+" value={stale.length} />
        </section>

        <section className="overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.08)]">
          <div className="border-b border-black/10 p-4">
            <input
              className="h-12 w-full rounded-2xl border-0 bg-[#f5f5f7] px-4 text-[16px] outline-none placeholder:text-black/35 focus:ring-2 focus:ring-[#0071e3]/25"
              placeholder="Search people"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="mt-3 flex gap-2">
              <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>All</FilterButton>
              <FilterButton active={filter === "personal"} onClick={() => setFilter("personal")}>Personal</FilterButton>
              <FilterButton active={filter === "work"} onClick={() => setFilter("work")}>Work</FilterButton>
            </div>
          </div>

          <div className="divide-y divide-black/10">
            {filtered.map((p) => (
              <a key={p.id} href={`/?person=${encodeURIComponent(p.id)}`} onClick={() => openPerson(p.id)} className="flex min-h-[74px] w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#f5f5f7]">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8f2ff] text-[15px] font-semibold text-[#0071e3]">
                  {initials(p.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-[17px] font-medium tracking-[-0.01em]">{p.name}</p>
                    <span className="shrink-0 text-[20px] text-black/25">›</span>
                  </div>
                  <p className="mt-0.5 truncate text-[14px] text-black/45">{p.relationship || p.organization || p.tags || "No context yet"}</p>
                </div>
              </a>
            ))}
            {!filtered.length && <p className="p-6 text-center text-[15px] text-black/45">No matching people.</p>}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-black/10 p-4">
            <button onClick={exportData} className="rounded-full bg-[#f5f5f7] px-4 py-2 text-[14px] text-black/60">Export JSON</button>
            <label className="cursor-pointer rounded-full bg-[#f5f5f7] px-4 py-2 text-[14px] text-black/60">
              Import JSON
              <input type="file" accept="application/json" className="hidden" onChange={importData} />
            </label>
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-white p-3 text-center shadow-[0_10px_35px_rgba(0,0,0,0.05)]">
      <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-black/40">{label}</p>
      <p className="mt-1 text-[24px] font-semibold tracking-[-0.03em] text-[#1d1d1f]">{value}</p>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-[#f5f5f7] px-3 py-1 text-[13px] font-medium capitalize text-black/55">{children}</span>;
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`min-h-10 rounded-full px-4 text-[15px] font-medium ${active ? "bg-[#0071e3] text-white" : "bg-[#f5f5f7] text-black/60"}`}>
      {children}
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-3 px-5 py-4 text-[16px]">
      <p className="text-black/40">{label}</p>
      <p className="break-words text-black/78">{value}</p>
    </div>
  );
}
