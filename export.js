/* =============================================================
   EXPORT.JS — password-protected Excel download of responses
============================================================= */

import { QUESTIONS } from './questions-config.js';
import { firebaseConfig, COLLECTION_NAME } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// SHA-256 of the admin password. Default password: hymns@2026
// To change it: run in any terminal  ->  node -e "console.log(require('crypto').createHash('sha256').update('YOUR_NEW_PASSWORD').digest('hex'))"
// and paste the result below.
const PASSWORD_SHA256 = '254cc92de5d5105eccdcadd24f3e3af138837befa9cfa8fa285fda861cfc846f';

const db = getFirestore(initializeApp(firebaseConfig));

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const $ = id => document.getElementById(id);
let docs = [];
let started = false;

async function login() {
  const ok = (await sha256($('pw').value)) === PASSWORD_SHA256;
  if (!ok) { $('err').textContent = 'Wrong password.'; return; }
  $('login').style.display = 'none';
  $('panel').style.display = 'block';
  if (!started) { started = true; listen(); }
}

$('loginBtn').addEventListener('click', login);
$('pw').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });

function listen() {
  onSnapshot(collection(db, COLLECTION_NAME), snap => {
    docs = snap.docs.map(d => d.data());
    $('count').textContent = docs.length;
    $('dlBtn').disabled = docs.length === 0;
  }, err => {
    $('count').textContent = '!';
    alert('Firebase error: ' + (err?.code || err?.message));
  });
}

function formatTime(ts) {
  const d = ts?.toDate ? ts.toDate() : null;
  return d ? d.toLocaleString('en-IN') : '';
}

function answerText(q, a) {
  if (Array.isArray(a)) return a.join('; ');
  if (!a || typeof a !== 'object') return '';
  const parts = (a.selected || []).map(opt =>
    (opt.toLowerCase().includes('other') && a.other) ? `${opt}: ${a.other}` : opt
  );
  return parts.join('; ');
}

$('dlBtn').addEventListener('click', () => {
  const sorted = [...docs].sort((a, b) =>
    (a.submittedAt?.seconds || 0) - (b.submittedAt?.seconds || 0));

  const rows = sorted.map((r, i) => {
    const row = {
      'S.No': i + 1,
      'Name': r.name || '',
      'City': r.city || '',
      'Contact Number': r.specialty || '',
      'Submitted At': formatTime(r.submittedAt),
    };
    QUESTIONS.forEach((q, qi) => { row[`Q${qi + 1}`] = answerText(q, r.answers?.[q.id]); });
    return row;
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Responses');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
    QUESTIONS.map((q, i) => ({ Question: `Q${i + 1}`, Text: q.label }))), 'Questions');

  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  XLSX.writeFile(wb, `responses-${stamp}.xlsx`);
});
