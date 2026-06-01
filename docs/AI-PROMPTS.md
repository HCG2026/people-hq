# Hermes / ChatGPT Capture Prompts

## Fast voice/text capture

Use this after meeting someone:

```text
People HQ capture:
I met [NAME] [where/when]. This is [personal/work]. Contact: [phone/email]. We discussed [topics]. I should [next step].
```

## Ask Hermes to clean it up

```text
Convert this into a People HQ entry. Keep it concise. Separate known facts from guesses. Do not include confidential work details. If phone/email are missing, leave blank.

Return in this format:
Name:
Type: personal/work
Relationship:
Organization/context:
Phone:
Email:
Met at:
Met on:
Priority: A/B/C
Tags:
Notes:
Last contact:
Next step:
Discussion summary:
Follow-up:

Raw note:
[PASTE NOTE]
```

## Follow-up draft prompt

```text
Draft a short, natural follow-up text/email to this person. Tone: warm, concise, not transactional.

Person:
[PASTE PEOPLE HQ ENTRY]

Goal:
[THANK THEM / SCHEDULE COFFEE / SEND RESOURCE / KEEP WARM]
```

## Weekly review prompt

```text
Review these People HQ exports and tell me:
1. Who I should follow up with this week
2. Which relationships are highest leverage
3. Which people need better notes
4. Suggested follow-up wording for the top 3

Data:
[PASTE EXPORTED JSON]
```

## Privacy rule

Never include confidential work details, MNPI, deal names, or anything that should not live in a personal app.
