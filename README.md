# Resume & Cover Letter Tailoring Agent — Starter

This is the smallest working version of the P0 feature: paste a resume,
paste a job description, click one button, get back a tailored resume and
cover letter. No file upload, no login, no export formatting — just the
core AI loop, proven end-to-end.

## How it's built

- `public/index.html` + `public/style.css` — the webpage (two text boxes, one button, one results area).
- `public/script.js` — runs in the browser, sends what you typed to the server.
- `server.js` — the only place your API key lives. Receives the resume + job description, sends them to Claude with instructions, sends the tailored result back to the page.

## Setup

1. **Install Node.js** if you don't have it: https://nodejs.org (LTS version).

2. **Install the project's dependencies.** From inside this folder, run:
   ```
   npm install
   ```

3. **Get an API key.** Go to https://console.anthropic.com, create an account if needed, and generate an API key.

4. **Add your key.** Copy `.env.example` to a new file named `.env`, and paste your key in:
   ```
   ANTHROPIC_API_KEY=sk-ant-...your real key...
   PORT=3000
   ```
   Never commit `.env` to git or share it — it's your private password to the AI.

5. **Run the server:**
   ```
   npm start
   ```

6. **Open the app.** Go to http://localhost:3000 in your browser. Paste a real resume and a real IT/help desk job posting, click "Tailor My Application," and read the output critically — check it didn't invent any skills.

## What this is NOT (on purpose)

This starter skips everything that isn't the core loop, so you can test the
one thing that matters first:

- No resume file upload (PDF/DOCX) — paste text only for now.
- No download/export to PDF or DOCX — output is plain text you copy.
- No editing in-app — you'd copy the output into your own document to fix anything.
- No job scraping or skill-level categorization — those depend on external job board data and are out of scope for this build.

Once the tailoring quality is genuinely good, layer these on top in this
rough order: resume upload/parsing → in-app review/edit → formatted
PDF/DOCX export → regenerate button.

## A note on the AI's honesty

The system prompt in `server.js` explicitly tells the model to only use
skills and experience already present in the resume — never invent
anything. This is the single most important rule in the whole app. If you
test it and the output includes anything that isn't true about you, that's
a bug worth fixing before anything else.
