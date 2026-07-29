# Spec 04 — Interview prep guide

## Goal
A small interview prep guide generated from the resume + job posting.

## Files you may edit
- `server.js`, `public/index.html`, `public/script.js` ONLY.

## Backend: server.js
Extend the system prompt and JSON contract with an `interviewPrep` array. Exact shape:
```
"interviewPrep": [
  { "question": "How have you handled a difficult customer escalation?", "talkingPoint": "Reference the support-lead role where you resolved X" },
  ...
]
```
Rules:
- 5 to 6 items. Each has exactly `question` (specific to THIS posting/role) and `talkingPoint` (a concrete angle drawn from the candidate's ACTUAL resume).
- Talking points must use only real resume content — anti-fabrication rule applies.
- Keep ALL existing fields (`tailoredResume`, `coverLetter`, `matchScore`, `changeSummary`). Add `interviewPrep` alongside.
- Default to `[]` in code if the model omits it.

## Frontend: index.html + script.js
Add an "Interview prep" panel in the output listing each `question` with its `talkingPoint` beneath it.

## Do NOT
- Remove or rename existing fields. Add dependencies. Touch other files.

## Acceptance criteria
- Response includes `interviewPrep` array of 5–6 {question, talkingPoint} items, plus all prior fields.
- UI renders the panel; empty array does not crash.
- App still works end-to-end locally.

## How to test
Run `npm start`; tailor and confirm the prep questions are specific to the posting and the talking points reference the real resume.