# People HQ Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement future tasks task-by-task.

**Goal:** Build a standalone, phone-first relationship memory app that Nico can install on his phone and use with Hermes, Claude/Cowork, and ChatGPT.

**Architecture:** Next.js app deployed on Vercel. Public repo contains code only. Real people data remains local-first in browser storage until a private authenticated backend is explicitly added later.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, browser localStorage, Vercel.

---

## Completed MVP foundation

- Next.js app scaffolded.
- Mobile-first People HQ UI created.
- Local-first storage implemented.
- Quick capture and structured edit form implemented.
- Personal/work filters implemented.
- Discussion/touchpoint logging implemented.
- JSON export/import implemented.
- PWA manifest added for phone home-screen install.
- Product and agent docs added.

## Next tasks

### Task 1: Replace touchpoint browser prompt with modal

**Objective:** Make discussion logging feel native and phone-friendly.

**Files:**
- Modify: `src/app/page.tsx`

**Steps:**
1. Add state for `touchpointDraft` and `touchpointPersonId`.
2. Add modal component with fields: date, type, summary, topics, follow-up.
3. Replace `window.prompt()` in `addTouchpoint` with modal open.
4. Save modal fields into selected person's `touchpoints`.
5. Run `npm run lint && npm run build`.
6. Commit: `feat: add touchpoint modal`.

### Task 2: Add archive/delete guardrails

**Objective:** Allow cleanup without accidental data loss.

**Files:**
- Modify: `src/app/page.tsx`

**Steps:**
1. Add `archived: boolean` to `Person`.
2. Hide archived people by default.
3. Add Archive button with confirmation.
4. Add “show archived” filter.
5. Keep export including archived people.
6. Run `npm run lint && npm run build`.
7. Commit: `feat: add people archive`.

### Task 3: Add follow-up dates

**Objective:** Turn notes into action.

**Files:**
- Modify: `src/app/page.tsx`

**Steps:**
1. Add `nextFollowUpDate` to `Person`.
2. Add field in structured form.
3. Add Due / Soon / Later sections.
4. Add one-click “mark followed up today”.
5. Run `npm run lint && npm run build`.
6. Commit: `feat: add follow-up dates`.

### Task 4: Add JSON agent import

**Objective:** Let Hermes/Claude return structured JSON that the app imports cleanly.

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `docs/AI-PROMPTS.md`

**Steps:**
1. Define accepted JSON schema in docs.
2. Add paste box for JSON.
3. Validate required `name` field.
4. Convert JSON to `Person` object.
5. Show errors clearly.
6. Run `npm run lint && npm run build`.
7. Commit: `feat: add agent json import`.

### Task 5: Add CSV export

**Objective:** Make data portable to spreadsheet/backup workflows.

**Files:**
- Modify: `src/app/page.tsx`

**Steps:**
1. Add `exportCsv()` helper.
2. Flatten discussions into latest discussion count/last summary.
3. Add Export CSV button.
4. Test download manually.
5. Run `npm run lint && npm run build`.
6. Commit: `feat: add csv export`.
