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
- **Honest match score.** A deterministic score (0–100) tells you how well you actually match the role, with the specific gaps named.
- **Human in the loop.** It produces drafts you review and send — it never auto-applies or auto-sends anything.

The result is an application that's tailored *and* trustworthy — the opposite of AI slop.

## How it works

The core is a four-step pipeline rather than a single "rewrite my resume" call — this is what makes the output both grounded and explainable:

1. **Extract resume facts** — a fast model pulls the candidate's real skills, employers, titles, and metrics into a structured "allowed-facts" list.
2. **Extract job requirements** — the same step, applied to the job description, produces the required and preferred skills.
3. **Score the match (deterministic)** — plain JavaScript, no AI, computes a 0–100 score from the overlap between the two, and lists matched skills and gaps. Because it's deterministic, the score is explainable and reproducible.
4. **Tailor within the facts** — a stronger model rewrites the resume and cover letter, constrained to the allowed-facts list, reordering and reframing real experience toward the job — and refusing to invent anything the résumé doesn't contain.

An honesty banner then summarizes the fit in plain language ("Low match (9%). This role requires … which aren't on your resume. We tailored your real experience toward it but did not invent qualifications you don't have.").

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

- **"What changed & why"** — a per-edit diff so users can see and trust every change.
- **Interview prep guide** — likely questions from the posting, with talking points drawn from the real resume.
- **Resume upload** — PDF/DOCX parsing with a verify-what-we-read step, so a messy layout never corrupts the input.
- **Export** — download the tailored resume and cover letter as formatted documents.
- **Production stack** — migration to Next.js + TypeScript.

## A note on our development process

This project was built AI-natively. The repo includes a `CLAUDE.md` operating manual and a `specs/` directory of per-feature specifications, so AI coding agents work within tight, explicit guardrails — the same discipline the product itself applies to resume tailoring: do the heavy lifting, but stay grounded and honest.

## Team

Ahsan Abbasi · Nathan Hutton · Sal Zil

## License

See [LICENSE](LICENSE).