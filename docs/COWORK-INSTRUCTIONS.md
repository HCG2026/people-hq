# Cowork / Claude Build Instructions for People HQ

## Role

You are building **People HQ**, Nico's standalone relationship-memory app. It is separate from Mission Control and should be optimized for phone use.

## Repository

- Local path: `~/Documents/Projects/people-hq`
- App: Next.js + TypeScript + Tailwind
- Deployment: Vercel
- Data policy: public code, private user data in browser/local-only storage

## Operating rules

1. Never commit real names, phone numbers, emails, or sensitive notes.
2. Fake demo data is fine if clearly marked demo/example.
3. Run `npm run lint` and `npm run build` before pushing.
4. Keep UI mobile-first.
5. Prefer simple local-first features over complex backend work.
6. If adding backend/auth, write a PRD first and wait for explicit approval.

## Product intent

People HQ should help Nico answer:

- Who did I meet?
- Where and when did I meet them?
- Was this personal or work?
- What did we discuss?
- How important is this relationship?
- What is the next follow-up?
- Who has gone cold?

## Immediate feature queue

### PRD 001 — Current MVP polish

- Replace browser `prompt()` for touchpoint logging with a real modal/form.
- Add delete/archive with confirmation.
- Add CSV export.
- Add better empty states.
- Add install instructions inside the app.

### PRD 002 — Follow-up system

- Add next-follow-up date.
- Add “Due now / soon / later” sections.
- Add one-click mark-followed-up.
- Add copyable follow-up text draft.

### PRD 003 — Agent handoff

- Add a structured JSON paste box so Hermes can return a JSON object and the app imports it.
- Add validation errors for missing name/date.
- Add example prompt templates in the UI.

## Copy-paste prompt for Cowork

```text
You are working in ~/Documents/Projects/people-hq.
Build People HQ as a mobile-first local-first relationship-memory app for Nico.
Read README.md, docs/PRODUCT-BRIEF.md, and docs/COWORK-INSTRUCTIONS.md first.

Task:
[PASTE EXACT TASK]

Rules:
- Do not commit real people data.
- Use fake demo data only.
- Keep data local-first unless explicitly asked to add a backend.
- Run npm run lint and npm run build.
- Commit with a clear conventional commit message.
- Push to GitHub if remote exists.
- Deploy to Vercel only if build passes.
```
