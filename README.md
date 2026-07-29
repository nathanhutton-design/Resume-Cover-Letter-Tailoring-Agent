# Groundwork

**An AI agent that tailors your resume and cover letter to any job — grounded strictly in your real experience, and honest about your actual fit.**

Live demo: https://resume-cover-letter-tailoring-agent-3ngp.onrender.com

> Built as an AI-Native capstone at Pursuit by Ahsan Abbasi, Nathan Hutton, and Sal Zil.

---

## The problem

Job seekers — especially career switchers — spend 30–60 minutes tailoring their resume and cover letter for every posting. Across a search that's 50–100 hours of repetitive work, and it often still misses what the job screens for.

The obvious fix is "paste it into ChatGPT," but a raw LLM will happily **invent** skills and experience to make you look like a match. Recruiters now filter exactly that out — a majority of hiring managers say an obviously-AI resume actively hurts the candidate. So the tool people reach for to save time is quietly lowering their response rate.

## What Groundwork does differently

Groundwork does the heavy lifting of tailoring **without ever fabricating**, and it tells you the truth about your fit instead of flattering you.

- **Grounded tailoring.** It extracts the real facts from your resume first, then tailors *within* that fact set — it structurally cannot add a skill you don't have.
- **Honest match score.** A deterministic score (0–100) tells you how well you actually match the role, with the specific matched skills and gaps named.
- **"What changed & why."** Every edit the agent makes is shown with a one-line rationale tied to the job posting — so you're never trusting a black box.
- **Interview prep.** Likely questions drawn from the specific posting, each paired with a talking point grounded in your real experience.
- **Human in the loop.** It produces drafts you review and send — it never auto-applies or auto-sends anything.

The result is an application that's tailored *and* trustworthy — the opposite of AI slop.

## How it works

The core is a four-step pipeline rather than a single "rewrite my resume" call — this is what makes the output both grounded and explainable:

1. **Extract resume facts** — a fast model pulls the candidate's real skills, employers, titles, and metrics into a structured "allowed-facts" list.
2. **Extract job requirements** — the same step, applied to the job description, produces the required and preferred skills.
3. **Score the match (deterministic)** — plain JavaScript, no AI, computes a 0–100 score from the overlap between the two, and lists matched skills and gaps. Because it's deterministic, the score is explainable and reproducible.
4. **Tailor within the facts** — a stronger model rewrites the resume and cover letter, constrained to the allowed-facts list, reordering and reframing real experience toward the job — and refusing to invent anything the résumé doesn't contain.

An honesty banner then summarizes the fit in plain language ("Low match (9%). This role requires … which aren't on your resume. We tailored your real experience toward it but did not invent qualifications you don't have.").

Alongside the tailored resume and cover letter, each run also returns a **change summary** (what was edited and why) and an **interview prep guide** (likely questions from the posting with talking points from the real resume). The full response is a single structured payload — `{ tailoredResume, coverLetter, matchScore, changeSummary, interviewPrep, honesty }` — that the frontend renders as reviewable panels.

The design also guards against bad input: if the pasted text isn't a real resume or a real job posting, the score doesn't return a misleading high number — it flags that it couldn't find real content to work with.

## Tech stack

- **Backend:** Node.js + Express (`server.js`) — serves the app and exposes a single `/api/tailor` endpoint.
- **Frontend:** vanilla HTML/CSS/JavaScript (`public/`), no build step.
- **AI:** Anthropic API — a fast model for extraction, a stronger model for the tailoring rewrite.
- **Deploy:** Render (Node web service).

The Anthropic API key lives only server-side, read from an environment variable — it is never exposed to the browser or committed to the repo.

## Running locally

**Prerequisites:** Node.js (LTS) and an Anthropic API key (https://console.anthropic.com).

```bash
# 1. Install dependencies
npm install

# 2. Configure your key
cp .env.example .env
#    then edit .env and set:
#    ANTHROPIC_API_KEY=sk-ant-...your key...
#    PORT=3000

# 3. Start the server
npm start
```

Open http://localhost:3000, paste a resume and a job posting, and click **Tailor My Application**. Review the output before using it anywhere.

## Project structure

```
├── server.js            # Express server, /api/tailor endpoint, the tailoring pipeline
├── public/
│   ├── index.html       # UI: inputs, results, honesty banner
│   ├── script.js        # calls /api/tailor and renders the results
│   └── style.css        # styling
├── CLAUDE.md            # operating manual for AI coding agents on this repo
├── specs/               # per-feature specifications
├── .env.example         # template for local configuration
└── package.json
```

## Roadmap

### v2 — Production rebuild
- **Migrate to Next.js + TypeScript.** The MVP is intentionally plain Node/Express + vanilla JS so we could validate the core loop fast. Now that the tailoring quality and honesty guarantees are proven, a migration to Next.js + TypeScript buys us type safety (fewer runtime bugs across the resume/JD/response data shapes), server components for cleaner API handling, and a component-based UI that's far easier to extend as features grow. It also makes the codebase read as production-grade rather than prototype.
- **Resume upload with parse-verification.** Accept PDF/DOCX, extract the text, and show the user what we parsed *before* tailoring — so a messy multi-column layout never silently corrupts the input. Keeps the human in the loop even at the input stage.
- **Formatted export.** Download the tailored resume and cover letter as polished PDF/DOCX, not just plain text.
- **User accounts.** Save applications, revisit past tailoring, and track which version went to which job.

### v3 — From tool to workflow
- **Application tracker.** A pipeline board (applied → interviewing → offer) that ties each tailored resume to its posting, turning Groundwork from a one-shot tool into a job-search command center.
- **Fabrication guard as a safety layer.** A deterministic check that scans every generated draft against the extracted fact list and flags anything not traceable to the real resume — automated proof of the no-fabrication promise, before the user ever sees the output.
- **Follow-up drafting.** After N days without a response, draft a follow-up email in the candidate's voice — still human-sent, never automated.
- **"De-AI-ify" pass.** An optional step that rewrites the draft to remove the tells recruiters use to spot AI-generated writing, directly targeting the market signal our research surfaced.
- **Response-rate tracking.** Let users log which applications got responses, so over time Groundwork can measure the thing that actually matters — interview rate — and prove the "quality over volume" thesis with real data.

### Guiding principle
Every future feature is measured against one bar: does it keep the human in control and the output honest? We will not add auto-apply or auto-send — the entire product exists because the market went the other way and it backfired.

## A note on our development process

This project was built AI-natively. The repo includes a `CLAUDE.md` operating manual and a `specs/` directory of per-feature specifications, so AI coding agents work within tight, explicit guardrails — the same discipline the product itself applies to resume tailoring: do the heavy lifting, but stay grounded and honest.

## Team

Ahsan Abbasi · Nathan Hutton · Sal Zil

## License

See [LICENSE](LICENSE).