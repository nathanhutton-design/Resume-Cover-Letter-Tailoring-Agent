# Spec 03 — "What we changed & why" panel

## Goal
Show the user what the AI changed and why — the human-in-the-loop, not-a-black-box feature.

## Files you may edit
- `server.js`, `public/index.html`, `public/script.js` ONLY.

## Backend: server.js
Extend the system prompt and the JSON contract so the response also includes a `changeSummary` array. Exact shape:
```
"changeSummary": [
  { "change": "Moved cloud experience to the top", "reason": "The posting lists AWS as a required skill" },
  ...
]
```
Rules:
- 3 to 6 items. Each item has exactly `change` (what was changed) and `reason` (why, tied to the posting).
- Keep ALL existing response fields (`tailoredResume`, `coverLetter`, `matchScore`). Add `changeSummary` alongside them.
- If the model omits it, default to `[]` in code so nothing crashes.
- Anti-fabrication rule still applies: reasons must reference real posting/resume content.

## Frontend: index.html + script.js
Add a "What we changed & why" panel in the output section. For each item show the `change` as a bold line and the `reason` as a lighter sub-line. Clean, matches existing style.

## Do NOT
- Remove or rename existing fields. Add dependencies. Touch other files.

## Acceptance criteria
- Response includes a `changeSummary` array of 3–6 {change, reason} items, plus all prior fields.
- UI renders the panel. Missing/empty array does not crash the UI.
- App still works end-to-end locally.

## How to test
Run `npm start`; tailor a resume and confirm the panel lists specific, posting-relevant changes with reasons.