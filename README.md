# People HQ

People HQ is Nico's standalone, phone-first relationship operating system.

It is intentionally separate from the broader Mission Control app. The public repo contains the app code only. Relationship data stays private in the browser's `localStorage` unless Nico manually exports/imports JSON.

## What it does

- Quick-capture a person right after meeting them.
- Separate people into `personal` and `work`.
- Track where/when we met, contact info, relationship, organization, tags, notes, and next step.
- Log discussions/touchpoints like coffee, calls, dinners, texts, or meetings.
- Search/filter from phone.
- Export/import JSON backups.
- Install to phone home screen as a PWA.

## Privacy boundary

The deployed app is protected by a simple password gate. Real relationship data still remains local-first in the browser after login.

Do **not** commit real people data to this repo.

- Safe in repo: UI code, schema, docs, examples, fake demo data.
- Private: real names, phone numbers, emails, sensitive notes, work/confidential details.
- Current storage: local browser storage only.
- Backup: manual JSON export from the app.
- Deployment password: set in Vercel as `PEOPLE_HQ_PASSWORD`; keep `.env.local` uncommitted.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build verification

```bash
npm run lint
npm run build
```

## Deploy

This app is designed for Vercel:

```bash
vercel --prod
```

## Phone install

### iPhone / Safari

1. Open the Vercel URL.
2. Tap Share.
3. Tap **Add to Home Screen**.
4. Name it `People HQ`.

### Chrome

1. Open the Vercel URL.
2. Open browser menu.
3. Tap **Install app** or **Add to Home Screen**.

## Agent intake prompt

Copy/paste this to Hermes, Claude/Cowork, or ChatGPT after meeting someone:

```text
Add this to People HQ:
Name:
Personal or work:
Where/when I met them:
Phone/email:
What we discussed:
Next step:
Use concise notes. Do not include confidential work details.
```

For now, the agent returns a clean entry that Nico can paste into the app's quick-capture box. Later, we can add an authenticated API so Hermes can write directly.
