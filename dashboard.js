/* =============================================================
   DASHBOARD.JS — standalone live-results screen
   =============================================================
   This used to be a screen inside the kiosk app (app.js). It now
   runs as its own page (dashboard.html), meant to be opened only
   on the TV / results screen, not on the kiosk device collecting
   responses. It connects to the same Firestore project and keeps
   the charts live with onSnapshot.
============================================================= */

import { QUESTIONS } from './questions-config.js';
import { firebaseConfig, COLLECTION_NAME } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore, collection, onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PALETTE = ['#ef6b24', '#496aa6', '#f5a524', '#62a6ff', '#25c991', '#c43c2f'];
const grid = document.getElementById('chartsGrid');
const charts = {};

QUESTIONS.forEach((q, index) => {
  const card = document.createElement('div');
  card.className = 'chart-card';
  card.innerHTML = `
    <h3>Q${index + 1}. ${esc(q.label)}</h3>
    <div class="chart-box"><canvas id="chart-${q.id}"></canvas></div>
    <div class="legend-row" id="legend-${q.id}"></div>
    <div class="other-list" id="other-${q.id}" style="display:none"></div>
  `;
  grid.appendChild(card);

  const hasOther = q.options.some(o => o.toLowerCase().includes('other'));
  const regular = q.options.filter(o => !o.toLowerCase().includes('other'));
  const labels = hasOther ? [...regular, 'Other'] : regular;

  charts[q.id] = new Chart(document.getElementById(`chart-${q.id}`), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: labels.map(() => 0),
        backgroundColor: PALETTE,
        borderWidth: 2,
        borderColor: '#f8fafc'
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: '58%', plugins: { legend: { display: false } } }
  });
});

onSnapshot(collection(db, COLLECTION_NAME), snap => {
  const status = document.getElementById('connectionStatus');
  status.className = 'connection-status ok';
  status.textContent = 'Live connection active';
  document.getElementById('responseCount').textContent = snap.size;

  QUESTIONS.forEach(q => {
    const hasOther = q.options.some(o => o.toLowerCase().includes('other'));
    const regular = q.options.filter(o => !o.toLowerCase().includes('other'));
    const counts = {};
    regular.forEach(o => counts[o] = 0);
    let otherCount = 0;
    const otherTexts = [];

    snap.forEach(d => {
      const a = d.data().answers?.[q.id];
      if (Array.isArray(a)) {
        a.forEach(x => { if (counts[x] !== undefined) counts[x]++; });
      } else if (a && typeof a === 'object') {
        (a.selected || []).forEach(x => {
          if (counts[x] !== undefined) counts[x]++;
          if (x.toLowerCase().includes('other')) {
            otherCount++;
            if (a.other) otherTexts.push(a.other);
          }
        });
      }
    });

    const labels = hasOther ? [...regular, 'Other'] : regular;
    const allCounts = hasOther ? [...regular.map(x => counts[x]), otherCount] : regular.map(x => counts[x]);

    charts[q.id].data.datasets[0].data = allCounts;
    charts[q.id].update();

    const legend = document.getElementById(`legend-${q.id}`);
    legend.innerHTML = labels.map((o, i) => `
      <div class="legend-item">
        <span class="legend-dot" style="background:${PALETTE[i % PALETTE.length]}"></span>
        <span>${esc(o)}</span>
        <span class="legend-count">${allCounts[i]}%</span>
      </div>
    `).join('');
  });
}, err => {
  const status = document.getElementById('connectionStatus');
  status.className = 'connection-status error';
  status.textContent = `Firebase connection failed: ${err?.code || err?.message || 'unknown error'}`;
});