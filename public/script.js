// script.js
// This is the "glue" that runs in the browser. It grabs whatever the user
// typed, sends it to our own server (never directly to the AI — the server
// holds the API key), and displays whatever comes back.

const tailorBtn = document.getElementById('tailorBtn');
const statusEl = document.getElementById('status');
const outputSection = document.getElementById('outputSection');

function renderSkillList(listId, skills, emptyText) {
  const listEl = document.getElementById(listId);
  listEl.innerHTML = '';
  if (!skills || skills.length === 0) {
    const li = document.createElement('li');
    li.textContent = emptyText;
    li.className = 'empty';
    listEl.appendChild(li);
    return;
  }
  skills.forEach((skill) => {
    const li = document.createElement('li');
    li.textContent = skill;
    listEl.appendChild(li);
  });
}

tailorBtn.addEventListener('click', async () => {
  const resume = document.getElementById('resume').value.trim();
  const jobDescription = document.getElementById('jobDescription').value.trim();

  if (!resume || !jobDescription) {
    statusEl.textContent = 'Please paste both your resume and the job description.';
    return;
  }

  tailorBtn.disabled = true;
  statusEl.textContent = 'Tailoring your application... this can take 10-20 seconds.';
  outputSection.hidden = true;

  try {
    const response = await fetch('/api/tailor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume, jobDescription }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong.');
    }

    document.getElementById('honestyScore').textContent = `${data.matchScore.score} / 100`;
    document.getElementById('honestyMessage').textContent = data.honesty.message;
    document.getElementById('honestyBanner').className = `honesty-banner level-${data.honesty.level}`;

    renderSkillList('matchedSkillsList', data.matchScore.matchedSkills, 'No overlapping skills found.');
    renderSkillList('missingSkillsList', data.matchScore.missingSkills, 'No gaps — nice.');

    document.getElementById('tailoredResume').value = data.tailoredResume;
    document.getElementById('coverLetter').value = data.coverLetter;
    outputSection.hidden = false;
    statusEl.textContent = 'Done! Review the output below before using it anywhere.';
    outputSection.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    statusEl.textContent = `Error: ${err.message}`;
  } finally {
    tailorBtn.disabled = false;
  }
});
