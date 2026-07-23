// server.js
// This is the "backend" — the only part of the app that's allowed to know your
// AI API key. It serves the webpage and exposes one endpoint, /api/tailor,
// that the page calls when the user clicks the button.

require('dotenv').config();
const express = require('express');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// This is the instruction set the AI follows every time. The most important
// rule is #1 — it's what keeps the AI from inventing skills or experience
// that aren't actually in the person's resume.
const SYSTEM_PROMPT = `You are a resume and cover letter tailoring assistant for job seekers in IT and help desk roles.

Rules you must always follow:
1. Only use skills, experience, and accomplishments that already appear in the candidate's resume. Never invent new skills, job titles, employers, or experience.
2. Reorganize and reword existing resume content to emphasize what matches the job description.
3. Write a concise, specific cover letter (3-4 short paragraphs) for the exact job in the posting. If no company name is given, refer to "this role" instead of inventing one.
4. Return your response as raw JSON with exactly two fields: "tailoredResume" and "coverLetter". No markdown code fences, no extra commentary outside the JSON.`;

app.post('/api/tailor', async (req, res) => {
  const { resume, jobDescription } = req.body;

  if (!resume || !jobDescription) {
    return res.status(400).json({ error: 'Both resume and jobDescription are required.' });
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `RESUME:\n${resume}\n\nJOB DESCRIPTION:\n${jobDescription}`,
        },
      ],
    });

   const raw = message.content[0].text;
    let parsed;
    try {
      // Strip markdown code fences if the model added them despite
      // instructions not to, and grab just the { ... } part in case
      // there's any stray text before or after it.
      let cleaned = raw.trim();
      cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '');
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleaned = jsonMatch[0];
      }
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      // If it still isn't clean JSON, fall back to showing the raw
      // text rather than crashing.
      parsed = {
        tailoredResume: raw,
        coverLetter: '(Could not separate the cover letter automatically — see the resume field above for the full response.)',
      };
    }

    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong calling the AI. Check your API key and try again.' });
  }
});

app.listen(PORT, () => {
  console.log(`Resume Tailoring Agent running at http://localhost:${PORT}`);
});
