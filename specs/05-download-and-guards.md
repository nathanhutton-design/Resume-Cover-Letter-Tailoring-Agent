# Spec 05 — Download, loading state, budget guard

## Files you may edit
- `server.js`, `public/index.html`, `public/script.js` ONLY. No new dependencies for any of the three parts.

## Part A — Download buttons (frontend only)
In the output section add two buttons:
- "Download resume" → downloads `tailoredResume` text as a `.txt` file.
- "Download cover letter" → downloads `coverLetter` text as a `.txt` file.
Implement client-side with a Blob + a temporary anchor element. No library.

## Part B — Loading state + timeout (frontend only)
While `/api/tailor` is running:
- Show a status area that cycles through reassuring messages every ~4 seconds, in order: "Analyzing the job posting…", "Matching against your resume…", "Tailoring your resume…", "Writing your cover letter…", "Almost there…". Stop cycling when the response returns.
- Add a client-side fetch timeout of 90 seconds (use `AbortController`). On timeout, show "This is taking longer than usual — the server may be waking up. Please try again." and re-enable the button.
Purpose: a first-time user on a cold Render server never sees a frozen screen.

## Part C — Budget guard (backend only, server.js)
Add a simple in-memory rate limit on `/api/tailor`, no dependency:
- Keep a module-level array of request timestamps.
- On each request, drop timestamps older than 10 minutes. If 20 or more remain, respond `429` with `{ error: "The demo is busy right now — please wait a minute and try again." }`. Otherwise push the current timestamp and proceed.
Purpose: protects the Anthropic budget on the public URL.

## Do NOT
- Add dependencies. Change existing response fields. Touch other files.

## Acceptance criteria
- Both download buttons produce correct .txt files.
- Loading messages cycle; a hung request times out gracefully at 90s.
- The 21st request within 10 minutes returns a friendly 429.
- App still works end-to-end locally.

## How to test
Run `npm start`; tailor once, download both files, confirm contents. To test the limit, send 21 quick requests (or temporarily lower the threshold to 2, verify the 429, then set it back to 20).