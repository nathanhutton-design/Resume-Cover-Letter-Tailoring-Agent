# CLAUDE.md — Groundwork (Resume & Cover Letter Tailoring Agent)

Operating manual for AI coding agents in this repo. Read this fully before doing anything. Keep responses and file reads minimal — this project is on a strict token and time budget.

## What this app is
A web app for job seekers (focus: career switchers) that takes a resume + a job posting and returns a tailored resume, a cover letter, a deterministic match score, a diff of what changed, and a short interview prep guide. The human always reviews before using the output. It never invents experience that isn't in the resume.

## Stack (do NOT change this)
- Backend: Node.js + Express (`server.js`), one process, serves static files from `public/`.
- Frontend: plain HTML/CSS/JS in `public/` (`index.html`, `script.js`, `style.css`). No framework, no build step.
- AI: Anthropic SDK only (`@anthropic-ai/sdk`). No other AI providers. No new AI SDKs.
- Deploy: Render (Node web service). Key is set in Render env vars, never in code.

Do not migrate frameworks, add TypeScript, add a database, or add new AI providers. If a task seems to need any of those, STOP and ask the human first.

## Golden rules (never violate)
1. **Never touch the API key handling.** The key lives only in `process.env.ANTHROPIC_API_KEY`, read server-side in `server.js`. Never move it client-side, never hardcode it, never log it, never put it in any file.
2. **`public/` is the live app. The root-level `index.html`, `script.js`, `style.css` are DEAD/orphaned files — never edit them, never serve them.** All frontend edits happen in `public/`.
3. **The anti-fabrication rule is sacred.** The system prompt must always forbid inventing skills, employers, titles, dates, or experience not present in the user's resume. Never weaken this.
4. **One feature per branch.** Never work on `main` directly. Never combine features.
5. **Never edit `.env`, `.gitignore`, `package-lock.json`, or `LICENSE`** unless a task explicitly says so.
6. **Do not add dependencies** without the human's explicit say-so in the task. If a task needs one, name it and ask.

## Where feature instructions live
Permanent rules live in THIS file. Each feature's exact algorithm and acceptance criteria live in its own file under `specs/`. When a task tells you to read a spec (e.g. `specs/02-match-score.md`), follow that spec exactly — it is the contract. Do not invent an approach the spec doesn't describe; if the spec and this file ever conflict, this file's golden rules win, and you STOP and ask.

## STOP and ask the human if any of these are true (do not guess)
- The task seems to require a new dependency, a framework change, TypeScript, a database, or a new AI provider.
- The task would require editing the API key handling, `.env`, `package-lock.json`, or the root-level dead files.
- A spec is missing, ambiguous, or contradicts this file.
- The change would alter or remove an existing field in the `/api/tailor` JSON response.
- You are about to touch more than the files the task explicitly named.
Stopping to ask ONE sharp question is always cheaper than building the wrong thing and redoing it. Prefer it.

## How we work (token & time discipline)
- Read only the files the current task names. Do not explore the whole repo. Do not read `node_modules`, lockfiles, or the dead root files.
- Make the smallest change that satisfies the task. No refactors, no renaming, no "while I'm here" cleanup.
- After a change, briefly state what you changed and how to test it. Do not re-print entire files unless asked.
- If something is ambiguous, ask ONE sharp question rather than guessing and building the wrong thing.

## File map (what matters)
- `server.js` — Express server + the `/api/tailor` endpoint + the system prompt. Backend logic lives here.
- `public/index.html` — the live page (inputs, button, output areas).
- `public/script.js` — browser glue: reads inputs, calls `/api/tailor`, renders results.
- `public/style.css` — styling for the live page.
- `package.json` — scripts (`npm start`) and deps.
- IGNORE: root `index.html`, root `script.js`, root `style.css` (dead), `README*.md`, `*.jpeg` screenshot.

## Testing a change
- Run `npm start`, open `http://localhost:3000`, paste a real resume + a real job posting, click the button.
- Confirm the app still returns output end-to-end. A change is not done until the full flow still works locally.

## Definition of done (every task)
- The full paste → tailor → output flow still works locally.
- Only the files named in the task changed.
- No secrets, no new providers, no framework changes, anti-fabrication rule intact.
- You told the human exactly what to test.