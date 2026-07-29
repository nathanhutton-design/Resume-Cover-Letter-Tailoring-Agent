# Spec 01 — Core: Grounded Tailoring + Honest Match (REPLACES old 01 and 02)

## The product thesis (why this exists)
A raw LLM will fabricate qualifications to make a resume look like a match. Recruiters filter that out, and it burns the candidate. Our differentiator is DISCIPLINE: we tailor aggressively but never invent, and we tell the user the honest truth about their fit. This spec is the core of the whole product. Get this right; everything else is secondary.

## Files you may edit
- `server.js`, `public/index.html`, `public/script.js` ONLY. No new dependencies.

## The pipeline (server.js, inside /api/tailor)
Run these steps in order. Use the existing Anthropic client. Use the cheap model (claude-haiku or the current small model) for extraction steps 1 and 2; use the stronger model already configured for step 4 (tailoring).

### Step 1 — Extract allowed facts from the RESUME (grounding foundation)
One AI call. Input: resume text. Output: raw JSON, no prose, no fences:
```
{
  "skills": ["html","css","javascript","typescript","react","node","express","aws","docker"],
  "employers": ["Outlier AI","Research Foundation CUNY","AvoidSuspension LLC","Rave Business Systems"],
  "titles": ["Software Developer - AI Trainer","Lead TA","Front End Engineer","Software Engineer"],
  "metrics": ["reduced student dismissals by 80%","managed 3,000+ user records","reduced legacy maintenance time by 15%"]
}
```
All strings lowercased where natural. This is the ALLOWED-FACTS list. On parse failure, fall back to using the raw resume text as the only grounding and set a flag. Never throw.

### Step 2 — Extract requirements from the JOB DESCRIPTION
One AI call. Output raw JSON:
```
{ "requiredSkills": ["kubernetes","cuda","go"], "preferredSkills": ["vllm","prometheus"] }
```
Short lowercased skill/keyword strings. On failure, return empty arrays. Never throw.

### Step 3 — Compute the honest match (DETERMINISTIC, no AI)
Exactly this function. Do not change the math:
```js
function computeMatchScore(resumeText, requiredSkills, preferredSkills) {
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
```

### Step 4 — Tailor WITHIN the allowed facts (the aggressive-but-honest rewrite)
One AI call. Provide it: the allowed-facts JSON from Step 1, the JD requirements from Step 2, and the full resume text. System instruction must enforce, forcefully:
- **HARD RULE: You may ONLY use skills, employers, titles, dates, and metrics that appear in the resume / allowed-facts list. You may NOT introduce any skill, tool, language, technology, or metric that is not already there. If the job wants Kubernetes and the resume has no Kubernetes, it does NOT appear in the output. Ever.**
- **Do not alter the meaning or numbers of any metric.**
- **Tailor AGGRESSIVELY within those limits:** (a) reorder skills and experience so the most JD-relevant real items lead; (b) REFRAME real bullets to emphasize the angle the JD cares about — e.g. if the JD values distributed systems and the candidate has a real "real-time inventory tracking" bullet, reframe it to foreground the distributed-systems aspect that is genuinely there; (c) use the JD's terminology only where the underlying real experience supports it; (d) do NOT pad every bullet with filler adjectives.
- If the resume genuinely lacks what the JD wants, leave it out — the honesty layer handles the gap.

Output for this step: the tailored resume text + a cover letter (specific, human, 3–4 short paragraphs, grounded in real facts, references "this role" if no company named).

### Step 5 — Assemble the response
Combine everything into the /api/tailor JSON response:
```
{
  "tailoredResume": "...",
  "coverLetter": "...",
  "matchScore": { "score": 15, "matchedSkills": [...], "missingSkills": [...] },
  "honesty": {
    "level": "low" | "moderate" | "strong",
    "message": "A short, honest sentence about fit and what was NOT invented."
  }
}
```
Honesty level from score: below 40 = "low", 40–70 = "moderate", above 70 = "strong". The message must be generated in code (template), NOT by the AI, e.g. for low:
`"Low match (${score}%). This role requires ${missingSkills.slice(0,4).join(', ')}, which aren't on your resume. We tailored your real experience toward it but did not invent qualifications you don't have."`
Keep all field names exactly as above.

## Frontend (index.html + script.js)
Render, in this visual order in the output section:
1. **Honesty banner at the top** — color by level (low = amber/red, moderate = yellow, strong = green). Show the score as "NN / 100" and the honesty message prominently. THIS IS THE DIFFERENTIATOR — make it the first thing the user sees.
2. **Matched skills** (green) and **Gaps to address** (amber) lists.
3. The **tailored resume**.
4. The **cover letter**.
Clean, readable, works for a non-technical viewer. Simple styling consistent with the current page.

## Do NOT
- Put any AI call inside computeMatchScore.
- Let any step introduce facts not in the resume.
- Add dependencies. Remove/rename response fields. Touch other files.

## Acceptance criteria (test with a mismatched resume+JD, e.g. web-dev resume vs GPU-infra job)
- The output invents NOTHING — no skill/tool/language absent from the resume appears.
- A clear low score and honesty banner show for a poor match.
- The tailored resume still meaningfully reorders/reframes the REAL experience toward the JD.
- Full flow works locally end-to-end.

## How to test
Run `npm start`. Paste a web-dev resume and a GPU-infrastructure JD. Confirm: (1) no fabricated skills like Kubernetes/CUDA/Python appear, (2) a low score + honest banner shows, (3) the resume is still reordered toward the JD using only real facts. Then paste a well-matched pair and confirm a high score + strong banner.