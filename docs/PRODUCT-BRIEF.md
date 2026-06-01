# People HQ Product Brief

## One-line idea

A private, beautiful, phone-first relationship memory app: every person worth remembering, how Nico met them, what they discussed, and the next follow-up.

## Why this matters

Nico meets high-value people across work, friends, HCG, mentors, travel, founders, and personal life. The existing Mission Control people page proves the concept, but People HQ should be a focused app that is fast enough to use immediately after coffee and clean enough to live on the phone home screen.

## MVP principles

1. **Fast capture beats perfect CRM.** It should take under 60 seconds to record someone.
2. **Private by default.** Public code, private data. Never seed real contacts in GitHub.
3. **Phone first.** The primary use case is walking out of coffee/dinner and logging the person.
4. **Personal + work separation.** One app, but separate mental modes.
5. **AI-compatible.** Hermes, Claude/Cowork, and ChatGPT should all know the exact intake format.
6. **No fragile automation yet.** Start local-first; add authenticated writes later.

## Core objects

### Person

- Name
- Type: personal or work
- Relationship
- Organization/context
- Phone
- Email
- Where met
- Date met
- Priority: A/B/C
- Tags
- Notes
- Last contact date
- Next step
- Discussions/touchpoints

### Discussion / touchpoint

- Date
- Type: coffee, call, dinner, meeting, text, email, other
- Summary
- Topics
- Follow-up

## UX flow

### 1. Quick capture

Nico writes naturally:

```text
Met Dom for coffee today. Personal. Phone/email. Discussed investing, Mexico City, and friends in NYC. Follow up in two weeks.
```

The app creates a first-pass person record and discussion.

### 2. Structured cleanup

If needed, Nico edits fields:

- Type: personal/work
- Priority
- Relationship
- Contact info
- Next step

### 3. Recall

Nico searches by name, topic, organization, tag, or relationship.

### 4. Follow-up

The app surfaces people gone cold after 45 days and shows next steps.

## AI workflow

### Hermes / Max

Hermes is the capture assistant. When Nico texts a quick note, Hermes should return a clean People HQ entry, not overthink it.

Prompt:

```text
Convert this into a People HQ entry. Keep it concise. Separate facts from guesses. Do not include confidential work details. If phone/email are missing, leave blank.

Raw note:
[PASTE]
```

### Claude / Cowork

Cowork is the builder. It should implement features from PRDs, run tests/builds, push to GitHub, and deploy to Vercel.

### ChatGPT

ChatGPT is the reflection assistant. It can help write better follow-up messages, remember conversation context, and generate networking ideas, but should not be treated as the source of truth unless exported back into People HQ.

## Future roadmap

### V1: Current MVP

- Local-first app
- Quick capture
- Structured person form
- Search/filter
- Personal/work separation
- Discussion log
- Export/import backup
- PWA install

### V2: Better capture

- Better natural-language parser
- “Add discussion” modal instead of browser prompt
- Follow-up reminders
- Contact import/export as CSV
- More powerful profile pages

### V3: Agent integration

- Authenticated API endpoint for Hermes writes
- Telegram capture format: “PeopleHQ: met ...”
- Daily digest of new people and follow-ups
- Optional Obsidian export

### V4: Durable private backend

Only after the app proves useful:

- Supabase or SQLite/Turso
- Auth
- Encrypted backups
- Multiple devices

## Non-goals for now

- No work-system integrations.
- No automatic email scraping.
- No LinkedIn scraping.
- No confidential deal/work notes.
- No public seed database of real people.
