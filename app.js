/* =============================================================
   APP.JS — single-page controller (kiosk: form only)
   =============================================================
   Everything that used to live across index.html, form.html and
   dashboard.html now lives on ONE page. This file just swaps
   which <section class="screen"> is visible — it never sets
   window.location / location.href — so the browser never does a
   real navigation and Fullscreen mode is never dropped.

   Flow:
     landing -> click "Click to Enter" -> requestFullscreen()
     landing -> click "Gabapentin Feedback Questionnaire" -> form
     form    -> registration details -> 5 questions -> submit
     submit  -> saved to Firestore -> "Thank you" screen
     thank you -> auto-returns to landing after a few seconds

   The live-results dashboard is a SEPARATE page now
   (dashboard.html + dashboard.js), meant to run on its own
   port/URL on the TV screen, not on this kiosk device.
============================================================= */

import { QUESTIONS } from './questions-config.js';
import { firebaseConfig, COLLECTION_NAME } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore, collection, addDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// How long the "Thank you" screen stays up before auto-returning
// to the landing screen for the next participant (milliseconds).
const THANKYOU_DISPLAY_MS = 4000;

/* =========================================================
   SCREEN SWITCHING
========================================================= */

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  document.getElementById(`screen-${name}`).classList.add('active');

  document.body.classList.remove('is-landing', 'is-form', 'is-thankyou');
  document.body.classList.add(`is-${name}`);
}

/* =========================================================
   FULLSCREEN ENTRY (must fire directly from the click)
========================================================= */

const zoomIntro = document.getElementById('zoomIntro');
const enterBtn = document.getElementById('enterBtn');

enterBtn.addEventListener('click', async () => {
  try {
    await document.documentElement.requestFullscreen();

    if (document.fullscreenElement) {
      zoomIntro.classList.add('hide');
    } else {
      alert('Please allow Full Screen mode to continue.');
    }
  } catch (error) {
    console.error('Fullscreen failed:', error);
    alert('Full Screen mode is required to continue. Please click "Click to Enter" again and allow Full Screen.');
  }
});

setTimeout(() => document.getElementById('zoomOverlay')?.classList.add('done'), 1800);

/* =========================================================
   LANDING -> FORM
   (was location.href='form.html' — now just switches screens,
   so Fullscreen stays active)
========================================================= */

document.getElementById('startFormBtn').addEventListener('click', () => {
  resetForm();
  showScreen('form');
});

/* =========================================================
   FIREBASE INIT
========================================================= */

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* =========================================================
   FORM STATE
========================================================= */

const totalSteps = QUESTIONS.length + 1;
let current = 0;
let answers = {};
let otherValues = {};
let details = { name: '', city: '', specialty: '' };

const stepArea = document.getElementById('stepArea');
const stepLabel = document.getElementById('stepLabel');
const progressFill = document.getElementById('progressFill');

function resetForm() {
  current = 0;
  answers = {};
  otherValues = {};
  details = { name: '', city: '', specialty: '' };
  render();
}

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

function updateProgress() {
  stepLabel.textContent = `Step ${current + 1} of ${totalSteps}`;
  progressFill.style.width = `${((current + 1) / totalSteps) * 100}%`;
}

/* =========================================================
   REGISTRATION / DETAILS STEP
========================================================= */

function renderDetails() {
  stepArea.innerHTML = `
    <div class="form-shell">
       
      <div class="kicker">Before we begin</div>
      <h1>Your details</h1>

      <div class="field">
        <label>Name</label>
        <input id="nameInput" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Full name" value="${esc(details.name)}">
      </div>

      <div class="field">
        <label>City</label>
        <input id="cityInput" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Your city" value="${esc(details.city)}">
      </div>

      <div class="field">
  <label>Contact Number</label>
  <input 
    id="specialtyInput" 
    type="text" 
    inputmode="numeric" 
    pattern="[0-9]*" 
    autocomplete="off" 
    autocapitalize="off" 
    spellcheck="false" 
    placeholder="Your contact number" 
    value="${esc(details.specialty)}">
</div>

      <div id="detailsError" class="error-text" style="display:none">Please fill in all three fields.</div>

      <div class="nav-row">
        <button class="btn btn-primary" id="nextBtn" type="button">Continue</button>
      </div>
    </div>
  `;

  document.getElementById('nextBtn').onclick = function () {
    details.name = document.getElementById('nameInput').value.trim();
    details.city = document.getElementById('cityInput').value.trim();
    details.specialty = document.getElementById('specialtyInput').value.trim();

    if (!details.name || !details.city || !details.specialty) {
      document.getElementById('detailsError').style.display = 'block';
      return;
    }

    current++;
    render();
  };
}

/* =========================================================
   QUESTION STEP
========================================================= */

function renderQuestion() {
  const q = QUESTIONS[current - 1];
  if (!answers[q.id]) answers[q.id] = new Set();
  const selected = answers[q.id];

  const otherOpt = q.options.find(option => option.toLowerCase().includes('other'));

  const options = q.options.map(option => `
    <div class="option-row ${selected.has(option) ? 'selected' : ''}" data-opt="${esc(option)}">
      <input type="checkbox" name="${esc(q.id)}[]" value="${esc(option)}" ${selected.has(option) ? 'checked' : ''}>
      <span>${esc(option)}</span>
    </div>
  `).join('');

  stepArea.innerHTML = `
    <div class="question-card">
      <div class="q-number">Question ${current} of ${QUESTIONS.length}</div>
      <h2>${esc(q.label)}</h2>
      <p style="color:#647897;font-size:13px;margin-top:-12px;margin-bottom:20px;">You can select more than one option.</p>

      <div class="options-list">${options}</div>

      ${otherOpt ? `
        <div class="other-box" id="otherBox" style="display:${selected.has(otherOpt) ? 'block' : 'none'};">
          <label>Other — Please specify</label>
          <input id="otherInput" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Please specify your answer" value="${esc(otherValues[q.id] || '')}">
        </div>
      ` : ''}

      <div id="qError" class="error-text" style="display:none">Please select at least one option.</div>
      <div id="firebaseStatus" class="firebase-status"></div>

      <div class="nav-row">
        <button class="btn btn-ghost" id="backBtn" type="button" style="display:none"></button>
        <button class="btn btn-primary" id="nextBtn" type="button">${current === QUESTIONS.length ? 'Submit' : 'Next'}</button>
      </div>
    </div>
  `;

  stepArea.querySelectorAll('.option-row').forEach(row => {
    row.addEventListener('click', function (event) {
      if (event.target.tagName === 'INPUT') return;

      const option = row.dataset.opt;
      const checkbox = row.querySelector('input');

      if (selected.has(option)) {
        selected.delete(option);
        checkbox.checked = false;
        row.classList.remove('selected');
      } else {
        selected.add(option);
        checkbox.checked = true;
        row.classList.add('selected');
      }

      if (otherOpt && option === otherOpt) {
        const otherBox = document.getElementById('otherBox');
        if (otherBox) otherBox.style.display = selected.has(otherOpt) ? 'block' : 'none';
      }
    });
  });

  stepArea.querySelectorAll('.option-row input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function () {
      const row = checkbox.closest('.option-row');
      const option = row.dataset.opt;

      if (checkbox.checked) {
        selected.add(option);
        row.classList.add('selected');
      } else {
        selected.delete(option);
        row.classList.remove('selected');
      }

      if (otherOpt && option === otherOpt) {
        const otherBox = document.getElementById('otherBox');
        if (otherBox) otherBox.style.display = checkbox.checked ? 'block' : 'none';
      }
    });
  });

  document.getElementById('otherInput')?.addEventListener('input', function (event) {
    otherValues[q.id] = event.target.value;
  });

  document.getElementById('backBtn').onclick = function () {
    current--;
    render();
  };

  document.getElementById('nextBtn').onclick = async function () {
    const error = document.getElementById('qError');

    if (otherOpt && selected.has(otherOpt)) {
      otherValues[q.id] = document.getElementById('otherInput')?.value.trim() || '';
    }

    if (selected.size === 0) {
      error.textContent = 'Please select at least one option.';
      error.style.display = 'block';
      return;
    }

    if (otherOpt && selected.has(otherOpt) && !otherValues[q.id]) {
      error.textContent = 'Please specify your Other response.';
      error.style.display = 'block';
      return;
    }

    if (current === QUESTIONS.length) {
      await submitAll();
    } else {
      current++;
      render();
    }
  };
}

/* =========================================================
   SUBMIT TO FIREBASE
   On success: show the "Thank you" screen, then automatically
   reset the form and return to the landing screen so the next
   participant can start fresh. Fullscreen stays active the
   whole time since this never leaves index.html.
========================================================= */

async function submitAll() {
  const btn = document.getElementById('nextBtn');
  const status = document.getElementById('firebaseStatus');

  btn.disabled = true;
  btn.textContent = 'Submitting…';
  status.textContent = 'Saving response…';

  try {
    const payload = {
      name: details.name,
      city: details.city,
      specialty: details.specialty,
      answers: Object.fromEntries(QUESTIONS.map(q => {
        const selectedOptions = Array.from(answers[q.id] || []);
        const otherOption = q.options.find(option => option.toLowerCase().includes('other'));

        return [q.id, {
          selected: selectedOptions,
          other: (otherOption && selectedOptions.includes(otherOption)) ? (otherValues[q.id] || '') : ''
        }];
      })),
      submittedAt: serverTimestamp()
    };

    await addDoc(collection(db, COLLECTION_NAME), payload);

    status.className = 'firebase-status ok';
    status.textContent = 'Saved successfully.';

    setTimeout(() => {
      showScreen('thankyou');

      // After the thank-you message has been visible for a bit,
      // reset the form state and go back to the landing screen
      // so the next participant can fill it in.
      setTimeout(() => {
        resetForm();
        showScreen('landing');
      }, THANKYOU_DISPLAY_MS);
    }, 500);

  } catch (error) {
    console.error(error);
    btn.disabled = false;
    btn.textContent = 'Submit';
    status.className = 'firebase-status error';
    status.textContent = `Firebase error: ${error?.code || error?.message || 'unknown error'}`;
  }
}

function render() {
  updateProgress();
  if (current === 0) renderDetails();
  else renderQuestion();
}

/* =========================================================
   START
   (the live-results dashboard now lives entirely in
   dashboard.html / dashboard.js — see that file)
========================================================= */

render();
