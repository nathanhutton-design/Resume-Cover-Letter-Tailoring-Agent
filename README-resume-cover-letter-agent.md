# Resume & Cover Letter Tailoring Agent

**Live demo:** https://nathanhutton-design.github.io/Resume-Cover-Letter-Tailoring-Agent/

## Problem

Tailoring a resume and cover letter to every job posting is slow, and it's easy to either under-tailor (generic application, low callback rate) or over-tailor (invent experience that isn't actually on the resume). Job seekers in IT and help desk roles applying to many postings need a faster way to match their real background to each listing without fabricating qualifications.

## Solution

An AI agent that takes a candidate's existing resume and a target job description, then generates a tailored resume and cover letter — grounded strictly in what's already on the resume. The agent matches language and emphasis to the posting without adding skills or experience the candidate doesn't have.

## Key Features

- Paste-in interface for resume and job description — no file upload required
- AI-generated tailored resume aligned to the job posting's language and priorities
- AI-generated cover letter matched to the same posting
- Output grounded only in the candidate's real resume content (no invented experience)
- Purpose-built for IT & help desk job seekers

## Tech Stack

- Frontend: HTML/CSS/JavaScript
- AI: Anthropic Claude API (`ANTHROPIC_API_KEY`)
- Runtime: Node.js server on port 3000
- Config: `.env` (copied from `.env.example`) for API key management

## Screenshot

<!-- Add a screenshot of the app UI here, e.g.: -->
<!-- ![Resume Tailoring Agent screenshot](./screenshot.png) -->

## Team

Built during the Pursuit AI-Native Fellowship with Ahsan Abbasi and Szalv Zhilb.
