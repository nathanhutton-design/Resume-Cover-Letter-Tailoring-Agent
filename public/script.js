// script.js
// This is the "glue" that runs in the browser. It grabs whatever the user
// typed, sends it to our own server (never directly to the AI — the server
// holds the API key), and displays whatever comes back.

const tailorBtn = document.getElementById('tailorBtn');
const statusEl = document.getElementById('status');
const outputSection = document.getElementById('outputSection');

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

    document.getElementById('tailoredResume').value = data.tailoredResume;
    document.getElementById('coverLetter').value = data.coverLetter;
    outputSection.hidden = false;
    statusEl.textContent = 'Done! Review the output below before using it anywhere.';
  } catch (err) {
    statusEl.textContent = `Error: ${err.message}`;
  } finally {
    tailorBtn.disabled = false;
  }
});
