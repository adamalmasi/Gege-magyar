// js/main.js

let allFeladatlapok = [];
let feladatlapIndex = [];

async function init() {
  try {
    const { index, feladatlapok } = await loadAll();
    allFeladatlapok = feladatlapok;
    feladatlapIndex = index.feladatlapok;
    renderTable();
    renderStats();
  } catch (e) {
    document.getElementById('feladatlapok-table').textContent = 'Hiba a betöltésnél: ' + e.message;
  }
}

function renderTable() {
  const byYear = {};
  feladatlapIndex.forEach(entry => {
    if (!byYear[entry.year]) byYear[entry.year] = [];
    byYear[entry.year].push(entry);
  });

  const years = Object.keys(byYear).sort((a, b) => b - a);
  let html = '<table><thead><tr><th>Év</th><th>Rendes (1)</th><th>Pót (2)</th><th>Pót 2 (3)</th></tr></thead><tbody>';
  for (const year of years) {
    const variants = byYear[year];
    const v = (n) => variants.find(e => e.variant === n);
    html += `<tr>
      <td><strong>${year}</strong></td>
      <td>${v(1) ? `<a href="test.html?file=${v(1).file}">Megír</a>` : '—'}</td>
      <td>${v(2) ? `<a href="test.html?file=${v(2).file}">Megír</a>` : '—'}</td>
      <td>${v(3) ? `<a href="test.html?file=${v(3).file}">Megír</a>` : '—'}</td>
    </tr>`;
  }
  html += '</tbody></table>';
  document.getElementById('feladatlapok-table').innerHTML = html;
}

function renderStats() {
  const results = loadResults();
  if (results.length === 0) return;

  const totalTests = results.length;
  const avgPct = Math.round(results.reduce((s, r) => s + r.totalScored / r.totalMax * 100, 0) / totalTests);
  const best = Math.max(...results.map(r => Math.round(r.totalScored / r.totalMax * 100)));
  const essayResults = results.filter(r => r.essay);
  const avgEssay = essayResults.length
    ? Math.round(essayResults.reduce((s, r) => s + r.essay.totalScore, 0) / essayResults.length * 10) / 10
    : null;

  let html = `<div class="stats-grid">
    <div class="stat-box"><div class="stat-number">${totalTests}</div><div class="stat-label">Megírt teszt</div></div>
    <div class="stat-box"><div class="stat-number">${avgPct}%</div><div class="stat-label">Átlag</div></div>
    <div class="stat-box"><div class="stat-number">${best}%</div><div class="stat-label">Legjobb</div></div>
    ${avgEssay !== null ? `<div class="stat-box"><div class="stat-number">${avgEssay}/10</div><div class="stat-label">Esszé átlag</div></div>` : ''}
  </div>`;

  if (essayResults.length >= 2) {
    html += '<h3 style="margin-bottom:0.5rem">Esszé fejlődés (utolsó 10 teszt)</h3>';
    html += '<div class="card"><div class="chart-bar-container">';
    const dims = [
      { key: 'tartalom', label: 'Tartalom', max: 3 },
      { key: 'szerkezet', label: 'Szerkezet', max: 3 },
      { key: 'stílus', label: 'Stílus', max: 1 },
      { key: 'helyesírás', label: 'Helyesírás', max: 2 },
      { key: 'külalak', label: 'Külalak', max: 1 }
    ];
    const last10 = essayResults.slice(-10);
    for (const dim of dims) {
      const avg = last10.reduce((s, r) => s + (r.essay.scores[dim.key] || 0), 0) / last10.length;
      const pct = Math.round(avg / dim.max * 100);
      html += `<div class="chart-row">
        <span style="width:80px">${dim.label}</span>
        <div class="chart-bar-bg"><div class="chart-bar-fill" style="width:${pct}%"></div></div>
        <span class="chart-pct">${avg.toFixed(1)}/${dim.max}</span>
      </div>`;
    }
    html += '</div></div>';
  }

  document.getElementById('stats-section').innerHTML = html;
}

function startRandomTest() {
  if (allFeladatlapok.length === 0) { alert('Betöltés alatt, próbáld újra!'); return; }
  const tasks = assembleRandomTest(allFeladatlapok);
  sessionStorage.setItem('currentTest', JSON.stringify(tasks));
  window.location.href = 'test.html?mode=random';
}

init();
