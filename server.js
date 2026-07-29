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

// Cheap/fast model for the two extraction steps; stronger model for the
// actual tailoring rewrite.
const EXTRACTION_MODEL = 'claude-haiku-4-5-20251001';
const TAILOR_MODEL = 'claude-sonnet-4-5';

const FACT_EXTRACTION_SYSTEM_PROMPT = `Extract only facts that are explicitly present in the resume text you are given.

Output raw JSON only — no prose, no markdown code fences — in exactly this shape:
{"skills": ["..."], "employers": ["..."], "titles": ["..."], "metrics": ["..."]}

Lowercase strings where natural. Do not include anything that is not explicitly present in the resume text. Do not infer or guess skills that are merely implied.`;

const JD_EXTRACTION_SYSTEM_PROMPT = `Extract the skills and keywords a hiring manager would screen for from the job description you are given.

Output raw JSON only — no prose, no markdown code fences — in exactly this shape:
{"requiredSkills": ["..."], "preferredSkills": ["..."]}

Use short lowercase skill/keyword strings.`;

// This is the instruction set the tailoring AI call follows every time. The
// HARD RULE is what keeps the AI from inventing skills or experience that
// aren't actually in the person's resume.
const TAILOR_SYSTEM_PROMPT = `You are a resume and cover letter tailoring assistant for job seekers.

You will be given: (1) an ALLOWED-FACTS list extracted from the candidate's real resume — skills, employers, titles, and metrics that actually appear there, (2) the job description's required and preferred skills, and (3) the full original resume text and job description.

HARD RULE — NEVER VIOLATE THIS: You may ONLY use skills, employers, titles, dates, and metrics that appear in the resume / allowed-facts list. You may NOT introduce any skill, tool, language, technology, employer, title, date, or metric that is not already there. If the job wants something the resume does not have (for example Kubernetes, CUDA, or Python) and it is not in the allowed-facts list or resume text, it must NOT appear anywhere in your output. Ever. Do not alter the meaning or numbers of any metric.

Tailor AGGRESSIVELY within those limits:
- Reorder skills and experience so the most JD-relevant REAL items lead.
- Reframe real bullets to emphasize the angle the job description cares about, using only facts that are genuinely there.
- Use the job description's terminology only where the underlying real experience actually supports it.
- Do not pad bullets with filler adjectives.
- If the resume genuinely lacks what the job wants, leave it out entirely — do not compensate by inventing anything.

Also write a cover letter: specific, human, 3-4 short paragraphs, grounded only in real facts from the resume and the job description. If no company name is given, refer to "this role" instead of inventing one.

Return your response as raw JSON with exactly two fields: "tailoredResume" and "coverLetter". No markdown code fences, no extra commentary outside the JSON.`;

// Strips markdown code fences and grabs just the {...} part in case the
// model added stray text before or after the JSON, despite instructions.
function parseJSONLoose(raw) {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '');
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  return JSON.parse(cleaned);
}

// Step 1 — Extract allowed facts from the resume (the grounding foundation).
// Never throws: on any failure, falls back to the raw resume text as the
// only grounding and sets a flag.
async function extractResumeFacts(resumeText) {
  try {
    const message = await anthropic.messages.create({
      model: EXTRACTION_MODEL,
      max_tokens: 1024,
      system: FACT_EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: resumeText }],
    });
    const parsed = parseJSONLoose(message.content[0].text);
    return {
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      employers: Array.isArray(parsed.employers) ? parsed.employers : [],
      titles: Array.isArray(parsed.titles) ? parsed.titles : [],
      metrics: Array.isArray(parsed.metrics) ? parsed.metrics : [],
    };
  } catch (err) {
    console.error('Fact extraction failed, falling back to raw resume text as grounding:', err.message);
    return { skills: [], employers: [], titles: [], metrics: [], fallbackRaw: resumeText, parseFailed: true };
  }
}

// Step 2 — Extract requirements from the job description. Never throws: on
// any failure, returns empty arrays.
async function extractJobRequirements(jobDescription) {
  try {
    const message = await anthropic.messages.create({
      model: EXTRACTION_MODEL,
      max_tokens: 512,
      system: JD_EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: jobDescription }],
    });
    const parsed = parseJSONLoose(message.content[0].text);
    return {
      requiredSkills: Array.isArray(parsed.requiredSkills) ? parsed.requiredSkills : [],
      preferredSkills: Array.isArray(parsed.preferredSkills) ? parsed.preferredSkills : [],
    };
  } catch (err) {
    console.error('Job requirement extraction failed, falling back to empty requirements:', err.message);
    return { requiredSkills: [], preferredSkills: [] };
  }
}

// Step 3 — Compute the honest match. Deterministic, no AI. Do not change the
// math (see specs/01-core-tailoring.md).
function computeMatchScore(resumeText, requiredSkills, preferredSkills) {
  if (requiredSkills.length === 0 && preferredSkills.length === 0) {
    return { score: 0, matchedSkills: [], missingSkills: [], insufficientInput: true };
  }
  const haystack = (resumeText || '').toLowerCase();
  const isMatched = (skill) => haystack.includes(skill.toLowerCase());
  const matchedRequired = requiredSkills.filter(isMatched);
  const matchedPreferred = preferredSkills.filter(isMatched);
  const reqRatio = requiredSkills.length ? matchedRequired.length / requiredSkills.length : 1;
  const prefRatio = preferredSkills.length ? matchedPreferred.length / preferredSkills.length : 1;
  const score = Math.round(100 * (0.7 * reqRatio + 0.3 * prefRatio));
  const matchedSkills = [...matchedRequired, ...matchedPreferred];
  const missingSkills = requiredSkills.filter((s) => !isMatched(s));
  return { score, matchedSkills, missingSkills };
}

// The honesty message is generated in code (a template), never by the AI.
function buildHonesty(score, missingSkills) {
  if (score < 40) {
    return {
      level: 'low',
      message: `Low match (${score}%). This role requires ${missingSkills.slice(0, 4).join(', ')}, which aren't on your resume. We tailored your real experience toward it but did not invent qualifications you don't have.`,
    };
  }
  if (score <= 70) {
    return {
      level: 'moderate',
      message: missingSkills.length
        ? `Moderate match (${score}%). You cover some of what this role wants, but it's still looking for ${missingSkills.slice(0, 4).join(', ')}. We tailored your real experience toward it without inventing anything you don't have.`
        : `Moderate match (${score}%). We tailored your real experience toward this role without inventing anything you don't have.`,
    };
  }
  return {
    level: 'strong',
    message: missingSkills.length
      ? `Strong match (${score}%). Your resume already covers most of what this role wants, aside from ${missingSkills.slice(0, 4).join(', ')}. We tailored your real experience to highlight it, without adding anything you don't have.`
      : `Strong match (${score}%). Your resume already covers what this role is asking for. We tailored your real experience to highlight it, without adding anything you don't have.`,
  };
}

// Step 4 — Tailor within the allowed facts (the aggressive-but-honest rewrite).
async function tailorWithinFacts(resumeText, jobDescription, facts, jdRequirements) {
  const context = `ALLOWED FACTS (extracted from the resume — do not use anything outside this list plus the resume text below):\n${JSON.stringify(facts)}\n\nJOB REQUIREMENTS EXTRACTED FROM THE POSTING:\n${JSON.stringify(jdRequirements)}\n\nFULL ORIGINAL RESUME TEXT:\n${resumeText}\n\nFULL JOB DESCRIPTION:\n${jobDescription}`;

  const message = await anthropic.messages.create({
    model: TAILOR_MODEL,
    max_tokens: 4096,
    system: TAILOR_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: context }],
  });

  const raw = message.content[0].text;
  try {
    return parseJSONLoose(raw);
  } catch (parseErr) {
    // If it still isn't clean JSON, fall back to showing the raw text
    // rather than crashing.
    return {
      tailoredResume: raw,
      coverLetter: '(Could not separate the cover letter automatically — see the resume field above for the full response.)',
    };
  }
}

app.post('/api/tailor', async (req, res) => {
  const { resume, jobDescription } = req.body;

  if (!resume || !jobDescription) {
    return res.status(400).json({ error: 'Both resume and jobDescription are required.' });
  }

  try {
    const [facts, jdRequirements] = await Promise.all([
      extractResumeFacts(resume),
      extractJobRequirements(jobDescription),
    ]);

    const matchScore = computeMatchScore(resume, jdRequirements.requiredSkills, jdRequirements.preferredSkills);

    const jdInsufficient = jdRequirements.requiredSkills.length === 0 && jdRequirements.preferredSkills.length === 0;
    const resumeInsufficient = facts.skills.length === 0 && facts.employers.length === 0 && facts.titles.length === 0;

    let honesty;
    if (jdInsufficient || resumeInsufficient) {
      if (resumeInsufficient) {
        // No real resume content to match against — a raw-text coincidence
        // must not produce a misleadingly high score.
        matchScore.score = 0;
        matchScore.matchedSkills = [];
        matchScore.missingSkills = jdRequirements.requiredSkills;
      }
      honesty = {
        level: 'low',
        message: jdInsufficient && resumeInsufficient
          ? "We couldn't find a real resume or a real job posting in what you pasted. Paste your actual resume and an actual job description to get an honest match."
          : jdInsufficient
            ? "We couldn't find real job requirements in the job description you pasted. Paste the actual job posting to get an honest match score."
            : "We couldn't find real resume content (skills, employers, or titles) in what you pasted. Paste your actual resume to get an honest match score.",
      };
    } else {
      honesty = buildHonesty(matchScore.score, matchScore.missingSkills);
    }

    const { tailoredResume, coverLetter } = await tailorWithinFacts(resume, jobDescription, facts, jdRequirements);

    res.json({ tailoredResume, coverLetter, matchScore, honesty });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong calling the AI. Check your API key and try again.' });
  }
});

app.listen(PORT, () => {
  console.log(`Resume Tailoring Agent running at http://localhost:${PORT}`);
});
