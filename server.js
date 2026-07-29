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

Your job is to ACTIVELY tailor the resume to the job posting, not just lightly edit it. Rules you must always follow:

1. Reorder the resume's experience and bullets so the most relevant material to THIS job posting leads. Do not just preserve the original order.
2. Reword bullet phrasing to mirror the posting's own language and keywords, wherever the underlying fact genuinely matches.
3. Sharpen vague, generic bullets into specific, results-oriented statements using details already present in the resume (metrics, tools, scope, outcomes).
4. Use ONLY skills, experience, employers, titles, and dates that already appear in the candidate's resume. Never invent new skills, job titles, employers, dates, or experience. If the posting wants something the resume does not have, leave it out — do not fabricate it.
5. Write a cover letter that is specific and human: reference concrete details pulled from both the resume and the posting, avoid generic filler and clichés, and keep it to 3-4 short paragraphs. If no company name is given, refer to "this role" instead of inventing one.
6. Return your response as raw JSON with exactly two fields: "tailoredResume" and "coverLetter". No markdown code fences, no extra commentary outside the JSON.`;

app.post('/api/tailor', async (req, res) => {
  const { resume, jobDescription } = req.body;

  if (!resume || !jobDescription) {
    return res.status(400).json({ error: 'Both resume and jobDescription are required.' });
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
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
