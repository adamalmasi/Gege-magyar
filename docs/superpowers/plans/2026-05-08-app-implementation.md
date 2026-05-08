# Magyar Felvételi App — Implementation Plan (Plan A: App)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working static web app on Netlify where Gege can take random Hungarian entrance exam practice tests with AI grading and progress tracking.

**Architecture:** Static HTML/CSS/JS on Netlify; JSON files loaded at runtime; Netlify Functions proxy Claude Haiku API calls; localStorage persists all results with JSON export/import.

**Tech Stack:** Vanilla HTML/CSS/JS (no build step), Netlify Hosting + Functions (Node.js), Anthropic Claude Haiku `claude-haiku-4-5-20251001`, localStorage

---

## File Map

```
Gege-magyar/
├── index.html                  — főoldal: évtáblázat + random gomb + statisztikák
├── test.html                   — teszt kitöltő oldal
├── results.html                — eredmény + AI visszajelzés
├── style.css                   — teljes UI stílus
├── js/
│   ├── logic.js                — tiszta függvények: assembleRandomTest, gradeExact, computeTotalMax
│   ├── data.js                 — JSON betöltés: loadIndex, loadFeladatlap, loadAll
│   ├── storage.js              — localStorage: saveResult, loadResults, exportJSON, importJSON
│   ├── main.js                 — főoldal logika
│   ├── test.js                 — teszt oldal logika
│   └── results.js              — eredmény oldal logika
├── data/
│   ├── index.json              — elérhető feladatlapok listája
│   └── 2023_1.json             — pilot feladatlap
├── images/                     — PDF-ből kivágott képek (üres, feltöltendő)
├── netlify/
│   └── functions/
│       ├── package.json        — @anthropic-ai/sdk dependency
│       ├── gradeAnswer.js      — nyílt kérdések értékelése
│       └── gradeEssay.js       — esszé értékelése rubrika szerint
├── netlify.toml                — Netlify build config
├── tests/
│   └── logic.test.js           — Node.js unit tesztek a tiszta függvényekhez
└── .gitignore
```

---

## Task 1: Project Setup

**Files:**
- Create: `netlify.toml`
- Create: `.gitignore`
- Create: `netlify/functions/package.json`

- [ ] **Step 1: Inicializálj git repót**

```bash
cd /Users/gergelyvargha/Documents/ClaudeCode/Gege-magyar
git init
```

- [ ] **Step 2: Hozd létre a .gitignore fájlt**

```
node_modules/
.env
.env.local
.netlify/
.superpowers/
```

- [ ] **Step 3: Hozd létre a netlify.toml-t**

```toml
[build]
  publish = "."
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
```

- [ ] **Step 4: Hozd létre a netlify/functions/package.json-t**

```bash
mkdir -p netlify/functions tests js data images
```

```json
{
  "name": "magyar-felvételi-functions",
  "version": "1.0.0",
  "dependencies": {
    "@anthropic-ai/sdk": "^0.34.0"
  }
}
```

- [ ] **Step 5: Telepítsd a függőségeket**

```bash
cd netlify/functions && npm install && cd ../..
```

- [ ] **Step 6: Hozd létre a mappastruktúrát és első commitot**

```bash
touch js/.gitkeep images/.gitkeep data/.gitkeep
git add .
git commit -m "feat: project setup — netlify config, folder structure"
```

---

## Task 2: Pilot adatok — 2023_1.json és index.json

**Files:**
- Create: `data/2023_1.json`
- Create: `data/index.json`

- [ ] **Step 1: Olvasd be a 2023_1 feladatlapot és útmutatót**

Olvasd el a következő PDF fájlokat:
- `/Users/gergelyvargha/Documents/ClaudeCode/Gege-magyar/input/A8_2023_1_fl.pdf`
- `/Users/gergelyvargha/Documents/ClaudeCode/Gege-magyar/input/A8_2023_1_ut.pdf`

- [ ] **Step 2: Hozd létre a data/2023_1.json-t a PDF tartalma alapján**

A séma kötelező mezői minden task-nál:
- `id` (1-10)
- `maxPoints` (az útmutató alapján)
- `instruction` (a feladatlap szövege)
- `subTasks` (tömb: `{ id, prompt, answer, points }`) — ha nincs al-feladat, üres tömb, és az `instruction` tartalmaz mindent
- `scoring` (`"all_or_nothing"` | `"per_item"` | `"tiered"`)
- `tiers` (csak ha `scoring === "tiered"`: `[[minCorrect, points], ...]` csökkenő sorrendben)
- `images` (képfájl útvonalak tömbje, üres ha nincs)
- `explanation` (az útmutatóból: elfogadható válasz-variánsok, megjegyzések)
- `gradingType` (`"exact"` | `"open"` | `"essay"`)

Használd az `"exact"` típust egyértelmű válaszoknál (igaz/hamis, szópárosítás, anagram).
Használd az `"open"` típust ahol az útmutató `"más jó megoldás elfogadható"` megjegyzést ír.
A 10. feladat mindig `"essay"`, és tartalmaz `checklist` tömböt.

Esszé séma:
```json
{
  "id": 10,
  "maxPoints": 10,
  "prompt": "A fogalmazás témája egy mondatban",
  "instruction": "Teljes utasítás a feladatlapból",
  "gradingType": "essay",
  "images": [],
  "explanation": "",
  "subTasks": [],
  "scoring": "tiered",
  "checklist": [
    { "label": "Tartalom: ...", "maxPoints": 3 },
    { "label": "Szerkezet: ...", "maxPoints": 3 },
    { "label": "Stílus: ...", "maxPoints": 1 },
    { "label": "Helyesírás: ...", "maxPoints": 2 },
    { "label": "Külalak: ...", "maxPoints": 1 }
  ]
}
```

A teljes fájl felépítése:
```json
{
  "year": 2023,
  "variant": 1,
  "label": "2023 rendes felvételi",
  "tasks": [ ... ]
}
```

- [ ] **Step 3: Ellenőrizd a JSON-t**

```bash
node -e "const d = require('./data/2023_1.json'); console.log('Tasks:', d.tasks.length, '| Total max:', d.tasks.reduce((s,t) => s+t.maxPoints, 0), 'pont')"
```

Elvárt output: `Tasks: 10 | Total max: <szám> pont` (hibamentes JSON parse)

- [ ] **Step 4: Hozd létre a data/index.json-t**

```json
{
  "feladatlapok": [
    { "file": "2023_1.json", "year": 2023, "variant": 1, "label": "2023 rendes felvételi" }
  ]
}
```

- [ ] **Step 5: Commit**

```bash
git add data/
git commit -m "feat: add 2023_1 pilot feladatlap JSON + index"
```

---

## Task 3: Core Logic — js/logic.js

**Files:**
- Create: `js/logic.js`
- Create: `tests/logic.test.js`

- [ ] **Step 1: Írd meg a teszteket (TDD)**

```js
// tests/logic.test.js
const assert = require('assert');
const { assembleRandomTest, gradeExact, computeTotalMax } = require('../js/logic.js');

const mockFeladatlapok = [
  {
    year: 2023, variant: 1,
    tasks: [
      { id: 1, maxPoints: 1, subTasks: [{ id: 'a', answer: 'denevér', points: 1 }], scoring: 'all_or_nothing', gradingType: 'exact' },
      { id: 2, maxPoints: 2, subTasks: [{ id: 'a', answer: 'igaz', points: 1 }, { id: 'b', answer: 'hamis', points: 1 }], scoring: 'per_item', gradingType: 'exact' }
    ]
  },
  {
    year: 2022, variant: 1,
    tasks: [
      { id: 1, maxPoints: 1, subTasks: [{ id: 'a', answer: 'macska', points: 1 }], scoring: 'all_or_nothing', gradingType: 'exact' },
      { id: 2, maxPoints: 3, subTasks: [{ id: 'a', answer: 'A', points: 1 }, { id: 'b', answer: 'B', points: 1 }, { id: 'c', answer: 'C', points: 1 }], scoring: 'per_item', gradingType: 'open' }
    ]
  }
];

// assembleRandomTest: minden pozícióból 1 feladat
const test1 = assembleRandomTest(mockFeladatlapok);
assert.strictEqual(test1.length, 2, 'Length should match number of positions');
assert.ok([1].includes(test1[0].id), 'Position 0 task id should be 1');
assert.ok([2].includes(test1[1].id), 'Position 1 task id should be 2');

// gradeExact — all_or_nothing helyes
const t1 = mockFeladatlapok[0].tasks[0];
const r1 = gradeExact(t1, { a: 'denevér' });
assert.strictEqual(r1.scored, 1, 'all_or_nothing correct: scored=1');

// gradeExact — all_or_nothing helytelen
const r2 = gradeExact(t1, { a: 'kutya' });
assert.strictEqual(r2.scored, 0, 'all_or_nothing wrong: scored=0');

// gradeExact — all_or_nothing nagybetű-érzéketlen
const r3 = gradeExact(t1, { a: 'Denevér' });
assert.strictEqual(r3.scored, 1, 'all_or_nothing case-insensitive: scored=1');

// gradeExact — per_item részpontozás
const t2 = mockFeladatlapok[0].tasks[1];
const r4 = gradeExact(t2, { a: 'igaz', b: 'WRONG' });
assert.strictEqual(r4.scored, 1, 'per_item partial: scored=1');

// gradeExact — per_item mind helyes
const r5 = gradeExact(t2, { a: 'igaz', b: 'hamis' });
assert.strictEqual(r5.scored, 2, 'per_item all correct: scored=2');

// computeTotalMax
assert.strictEqual(computeTotalMax([t1, t2]), 3, 'Total max = sum of maxPoints');

// tiered scoring
const tieredTask = {
  id: 3, maxPoints: 3, scoring: 'tiered',
  tiers: [[4, 3], [2, 2], [1, 1], [0, 0]],
  subTasks: [
    { id: 'a', answer: 'x', points: 1 }, { id: 'b', answer: 'y', points: 1 },
    { id: 'c', answer: 'z', points: 1 }, { id: 'd', answer: 'w', points: 1 }
  ],
  gradingType: 'exact'
};
const r6 = gradeExact(tieredTask, { a: 'x', b: 'y', c: 'WRONG', d: 'WRONG' });
assert.strictEqual(r6.scored, 2, 'tiered: 2 correct → 2 points');
const r7 = gradeExact(tieredTask, { a: 'x', b: 'y', c: 'z', d: 'w' });
assert.strictEqual(r7.scored, 3, 'tiered: 4 correct → 3 points');

console.log('✅ All logic tests passed!');
```

- [ ] **Step 2: Futtasd, ellenőrizd hogy FAIL**

```bash
node tests/logic.test.js
```

Elvárt: `Error: Cannot find module '../js/logic.js'`

- [ ] **Step 3: Implementáld js/logic.js-t**

```js
// js/logic.js

function assembleRandomTest(allFeladatlapok) {
  const numPositions = allFeladatlapok[0].tasks.length;
  const result = [];
  for (let pos = 0; pos < numPositions; pos++) {
    const candidates = allFeladatlapok
      .filter(fl => fl.tasks.length > pos)
      .map(fl => fl.tasks[pos]);
    result.push(candidates[Math.floor(Math.random() * candidates.length)]);
  }
  return result;
}

function gradeExact(task, answers) {
  const subResults = {};
  for (const sub of task.subTasks) {
    const student = (answers[sub.id] || '').trim().toLowerCase();
    const correct = sub.answer.trim().toLowerCase();
    const isCorrect = student === correct;
    subResults[sub.id] = { correct: isCorrect, points: isCorrect ? sub.points : 0 };
  }

  let scored = 0;
  if (task.scoring === 'all_or_nothing') {
    const allCorrect = Object.values(subResults).every(r => r.correct);
    scored = allCorrect ? task.maxPoints : 0;
  } else if (task.scoring === 'per_item') {
    scored = Object.values(subResults).reduce((sum, r) => sum + r.points, 0);
  } else if (task.scoring === 'tiered') {
    const correctCount = Object.values(subResults).filter(r => r.correct).length;
    scored = 0;
    for (const [minCorrect, pts] of (task.tiers || [])) {
      if (correctCount >= minCorrect) { scored = pts; break; }
    }
  }

  return { scored, max: task.maxPoints, subResults };
}

function computeTotalMax(tasks) {
  return tasks.reduce((sum, t) => sum + t.maxPoints, 0);
}

if (typeof module !== 'undefined') {
  module.exports = { assembleRandomTest, gradeExact, computeTotalMax };
}
```

- [ ] **Step 4: Futtasd a teszteket, ellenőrizd hogy PASS**

```bash
node tests/logic.test.js
```

Elvárt: `✅ All logic tests passed!`

- [ ] **Step 5: Commit**

```bash
git add js/logic.js tests/logic.test.js
git commit -m "feat: core logic — assembleRandomTest, gradeExact, computeTotalMax (TDD)"
```

---

## Task 4: Data Loading — js/data.js

**Files:**
- Create: `js/data.js`

- [ ] **Step 1: Hozd létre js/data.js-t**

```js
// js/data.js

async function loadIndex() {
  const res = await fetch('/data/index.json');
  if (!res.ok) throw new Error('Nem sikerült betölteni az indexet');
  return res.json();
}

async function loadFeladatlap(filename) {
  const res = await fetch(`/data/${filename}`);
  if (!res.ok) throw new Error(`Nem sikerült betölteni: ${filename}`);
  return res.json();
}

async function loadAll() {
  const index = await loadIndex();
  const feladatlapok = await Promise.all(
    index.feladatlapok.map(entry => loadFeladatlap(entry.file))
  );
  return { index, feladatlapok };
}
```

- [ ] **Step 2: Commit**

```bash
git add js/data.js
git commit -m "feat: data loading — loadIndex, loadFeladatlap, loadAll"
```

---

## Task 5: Főoldal — index.html + js/main.js + style.css

**Files:**
- Create: `index.html`
- Create: `js/main.js`
- Create: `style.css`

- [ ] **Step 1: Hozd létre style.css-t**

```css
/* style.css */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: #f5f5f5;
  color: #1a1a1a;
  line-height: 1.6;
  padding: 1rem;
}

.container { max-width: 900px; margin: 0 auto; }

h1 { font-size: 1.8rem; margin-bottom: 0.25rem; }
h2 { font-size: 1.3rem; margin: 1.5rem 0 0.75rem; }
h3 { font-size: 1.1rem; margin-bottom: 0.5rem; }

.subtitle { color: #666; margin-bottom: 1.5rem; font-size: 0.95rem; }

/* Buttons */
.btn {
  display: inline-block;
  padding: 0.6rem 1.4rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 600;
  transition: opacity 0.15s;
}
.btn:hover { opacity: 0.85; }
.btn-primary { background: #2563eb; color: white; }
.btn-secondary { background: #e5e7eb; color: #374151; }
.btn-success { background: #16a34a; color: white; }
.btn-danger { background: #dc2626; color: white; }

/* Táblázat */
table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
th, td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
th { background: #f9fafb; font-weight: 600; color: #374151; }
tr:hover { background: #f0f4ff; }
a { color: #2563eb; text-decoration: none; }
a:hover { text-decoration: underline; }

/* Kártyák */
.card {
  background: white;
  border-radius: 10px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

/* Feladatkártyák */
.task-card { border-left: 4px solid #2563eb; }
.task-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.task-points { font-size: 0.85rem; color: #666; font-weight: normal; }
.instruction { margin-bottom: 1rem; }
.sub-task { margin-bottom: 0.75rem; }
.sub-task label { display: block; font-size: 0.9rem; color: #444; margin-bottom: 0.25rem; }

/* Inputok */
input[type="text"], textarea, select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
}
textarea { min-height: 200px; resize: vertical; }
input[type="text"]:focus, textarea:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 2px #bfdbfe; }

/* Eredmények */
.correct { color: #16a34a; }
.incorrect { color: #dc2626; }
.score-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 99px;
  font-size: 0.85rem;
  font-weight: 600;
}
.score-good { background: #dcfce7; color: #15803d; }
.score-ok { background: #fef9c3; color: #a16207; }
.score-bad { background: #fee2e2; color: #b91c1c; }

/* AI feedback */
.ai-feedback {
  background: #f0f4ff;
  border-left: 3px solid #2563eb;
  padding: 0.75rem 1rem;
  border-radius: 0 6px 6px 0;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}
.ai-loading { color: #666; font-style: italic; font-size: 0.9rem; }

/* Statisztikák */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; margin-bottom: 1rem; }
.stat-box { background: white; border-radius: 8px; padding: 1rem; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.stat-number { font-size: 1.8rem; font-weight: 700; color: #2563eb; }
.stat-label { font-size: 0.8rem; color: #666; }

/* Fejlődési grafikon */
.chart-bar-container { display: flex; flex-direction: column; gap: 0.4rem; }
.chart-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; }
.chart-bar-bg { flex: 1; background: #e5e7eb; border-radius: 4px; height: 18px; overflow: hidden; }
.chart-bar-fill { height: 100%; background: #2563eb; border-radius: 4px; transition: width 0.3s; }
.chart-pct { width: 3rem; text-align: right; color: #444; }

/* Reszponzív */
@media (max-width: 600px) {
  h1 { font-size: 1.4rem; }
  .task-header { flex-direction: column; align-items: flex-start; gap: 0.25rem; }
  table { font-size: 0.85rem; }
}
```

- [ ] **Step 2: Hozd létre index.html-t**

```html
<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Magyar Felvételi Gyakorló</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>Magyar Felvételi Gyakorló</h1>
    <p class="subtitle">8. osztályos magyar nyelvi felvételi feladatlapok, 2005–2026</p>

    <button class="btn btn-primary" onclick="startRandomTest()" style="font-size:1.1rem; padding: 0.75rem 2rem; margin-bottom: 1.5rem;">
      🎲 Random teszt indítása
    </button>

    <h2>Statisztikák</h2>
    <div id="stats-section">
      <p class="subtitle">Még nincs megírt teszted.</p>
    </div>

    <div style="display:flex; gap:0.75rem; margin: 1rem 0;">
      <button class="btn btn-secondary" onclick="exportResults()">⬇ Eredmények exportálása</button>
      <label class="btn btn-secondary" style="cursor:pointer;">
        ⬆ Importálás
        <input type="file" accept=".json" style="display:none" onchange="importResults(this)">
      </label>
    </div>

    <h2>Feladatlapok</h2>
    <div id="feladatlapok-table">Betöltés...</div>
  </div>

  <script src="js/logic.js"></script>
  <script src="js/data.js"></script>
  <script src="js/storage.js"></script>
  <script src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 3: Hozd létre js/main.js-t**

```js
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
```

- [ ] **Step 4: Commit**

```bash
git add index.html style.css js/main.js
git commit -m "feat: main page — year table, random test button, stats panel"
```

---

## Task 6: Teszt oldal — test.html + js/test.js

**Files:**
- Create: `test.html`
- Create: `js/test.js`

- [ ] **Step 1: Hozd létre test.html-t**

```html
<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Teszt — Magyar Felvételi Gyakorló</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">
      <a href="index.html" class="btn btn-secondary">← Vissza</a>
      <h1 id="test-title">Feladatlap</h1>
    </div>
    <div id="tasks-container">Betöltés...</div>
    <div style="margin-top:2rem; padding-top:1rem; border-top:1px solid #e5e7eb;">
      <button class="btn btn-primary" onclick="submitTest()" style="font-size:1.05rem; padding:0.7rem 2rem;">
        Beküldés és kiértékelés
      </button>
    </div>
  </div>

  <script src="js/logic.js"></script>
  <script src="js/data.js"></script>
  <script src="js/test.js"></script>
</body>
</html>
```

- [ ] **Step 2: Hozd létre js/test.js-t**

```js
// js/test.js

let currentTasks = [];

async function init() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  const file = params.get('file');

  if (mode === 'random') {
    const stored = sessionStorage.getItem('currentTest');
    if (!stored) { window.location.href = 'index.html'; return; }
    currentTasks = JSON.parse(stored);
    document.getElementById('test-title').textContent = 'Random teszt';
  } else if (file) {
    const feladatlap = await loadFeladatlap(file);
    currentTasks = feladatlap.tasks;
    document.getElementById('test-title').textContent = feladatlap.label;
  } else {
    window.location.href = 'index.html';
    return;
  }

  renderTasks();
}

function renderTasks() {
  const container = document.getElementById('tasks-container');
  container.innerHTML = currentTasks.map((task, idx) => renderTask(task, idx)).join('');
}

function renderTask(task, idx) {
  const isEssay = task.gradingType === 'essay';
  let body = '';

  if (task.images && task.images.length > 0) {
    body += task.images.map(src => `<img src="/${src}" alt="feladat kép" style="max-width:100%; margin-bottom:0.75rem; border-radius:6px;">`).join('');
  }

  if (isEssay) {
    body += `<p style="margin-bottom:0.5rem"><strong>${task.prompt}</strong></p>`;
    body += `<div class="sub-task">
      <textarea id="answer-${task.id}-essay" placeholder="Írd ide a fogalmazásodat..." rows="12"></textarea>
    </div>`;
  } else {
    if (task.subTasks.length === 0) {
      body += `<div class="sub-task">
        <input type="text" id="answer-${task.id}-a" placeholder="Válasz...">
      </div>`;
    } else {
      body += task.subTasks.map(sub => `
        <div class="sub-task">
          ${sub.prompt ? `<label>${sub.id}) ${sub.prompt}</label>` : `<label>${sub.id})</label>`}
          <input type="text" id="answer-${task.id}-${sub.id}" placeholder="Válasz...">
        </div>
      `).join('');
    }
  }

  return `
    <div class="card task-card" data-task-id="${task.id}">
      <div class="task-header">
        <h3>${idx + 1}. feladat</h3>
        <span class="task-points">(max. ${task.maxPoints} pont)</span>
      </div>
      <p class="instruction">${task.instruction}</p>
      ${body}
    </div>`;
}

function collectAnswers() {
  const allAnswers = {};
  for (const task of currentTasks) {
    const taskAnswers = {};
    if (task.gradingType === 'essay') {
      taskAnswers['essay'] = (document.getElementById(`answer-${task.id}-essay`) || {}).value || '';
    } else if (task.subTasks.length === 0) {
      taskAnswers['a'] = (document.getElementById(`answer-${task.id}-a`) || {}).value || '';
    } else {
      for (const sub of task.subTasks) {
        taskAnswers[sub.id] = (document.getElementById(`answer-${task.id}-${sub.id}`) || {}).value || '';
      }
    }
    allAnswers[task.id] = taskAnswers;
  }
  return allAnswers;
}

function submitTest() {
  const answers = collectAnswers();
  sessionStorage.setItem('currentAnswers', JSON.stringify(answers));
  sessionStorage.setItem('currentTasks', JSON.stringify(currentTasks));
  window.location.href = 'results.html';
}

init();
```

- [ ] **Step 3: Commit**

```bash
git add test.html js/test.js
git commit -m "feat: test page — task renderer, answer collection, submit flow"
```

---

## Task 7: Eredmény oldal — results.html + js/results.js

**Files:**
- Create: `results.html`
- Create: `js/results.js`

- [ ] **Step 1: Hozd létre results.html-t**

```html
<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Eredmény — Magyar Felvételi Gyakorló</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">
      <a href="index.html" class="btn btn-secondary">← Főoldal</a>
      <h1>Eredmény</h1>
    </div>
    <div id="score-summary" class="card" style="margin-bottom:1.5rem;">Kiértékelés folyamatban...</div>
    <div id="results-detail"></div>
    <div style="margin-top:1.5rem;">
      <a href="index.html" class="btn btn-primary">🎲 Új teszt</a>
    </div>
  </div>

  <script src="js/logic.js"></script>
  <script src="js/storage.js"></script>
  <script src="js/results.js"></script>
</body>
</html>
```

- [ ] **Step 2: Hozd létre js/results.js-t**

```js
// js/results.js

let tasks = [];
let answers = {};
let taskResults = [];

async function init() {
  const storedTasks = sessionStorage.getItem('currentTasks');
  const storedAnswers = sessionStorage.getItem('currentAnswers');
  if (!storedTasks || !storedAnswers) { window.location.href = 'index.html'; return; }

  tasks = JSON.parse(storedTasks);
  answers = JSON.parse(storedAnswers);

  // Exact feladatok helyi kiértékelése
  taskResults = tasks.map(task => {
    if (task.gradingType === 'exact') {
      return { task, result: gradeExact(task, answers[task.id] || {}), pending: false };
    }
    return { task, result: null, pending: true };
  });

  const totalMax = computeTotalMax(tasks);
  const exactScored = taskResults
    .filter(r => !r.pending)
    .reduce((s, r) => s + r.result.scored, 0);

  renderSummary(exactScored, totalMax, true);
  renderDetails();

  // AI értékelés async
  await gradeOpenTasks();
}

function renderSummary(scored, max, pending) {
  const pct = Math.round(scored / max * 100);
  const cls = pct >= 70 ? 'score-good' : pct >= 50 ? 'score-ok' : 'score-bad';
  const label = pct >= 70 ? 'Jó eredmény! 🎉' : pct >= 50 ? 'Fejleszthető 💪' : 'Próbáld újra! 📚';
  document.getElementById('score-summary').innerHTML = `
    <div style="display:flex; align-items:center; gap:1.5rem; flex-wrap:wrap;">
      <div style="font-size:2.5rem; font-weight:700;">${scored}<span style="font-size:1.2rem; color:#666">/${max} pont</span></div>
      <div>
        <span class="score-badge ${cls}" style="font-size:1rem;">${pct}%</span>
        <div style="margin-top:0.25rem; color:#555;">${label}${pending ? ' <span style="font-size:0.85rem">(AI értékelés folyamatban...)</span>' : ''}</div>
      </div>
    </div>`;
}

function renderDetails() {
  const container = document.getElementById('results-detail');
  container.innerHTML = taskResults.map((r, idx) => renderTaskResult(r, idx)).join('');
}

function renderTaskResult({ task, result, pending }, idx) {
  let body = `<p class="instruction">${task.instruction}</p>`;

  if (task.gradingType === 'essay') {
    const essayText = (answers[task.id] || {}).essay || '';
    body += `<div style="background:#f9fafb; padding:0.75rem; border-radius:6px; margin-bottom:0.5rem; font-size:0.9rem; white-space:pre-wrap;">${essayText || '<i>Nem írtál fogalmazást.</i>'}</div>`;
    body += `<div id="essay-result-${task.id}" class="ai-loading">AI értékelés folyamatban...</div>`;
  } else if (pending) {
    const studentAnswers = answers[task.id] || {};
    if (task.subTasks.length === 0) {
      body += `<p>Válaszod: <strong>${studentAnswers.a || '—'}</strong></p>`;
    } else {
      body += task.subTasks.map(sub => `<p>${sub.id}) Válaszod: <strong>${studentAnswers[sub.id] || '—'}</strong> | Helyes: <strong>${sub.answer}</strong></p>`).join('');
    }
    body += `<div id="open-result-${task.id}" class="ai-loading">AI értékelés folyamatban...</div>`;
  } else if (result) {
    if (task.subTasks.length === 0) {
      const studentAns = (answers[task.id] || {}).a || '—';
      body += `<p>Válaszod: <strong>${studentAns}</strong></p>`;
    } else {
      body += task.subTasks.map(sub => {
        const sr = result.subResults[sub.id];
        const cls = sr && sr.correct ? 'correct' : 'incorrect';
        const icon = sr && sr.correct ? '✓' : '✗';
        const studentAns = (answers[task.id] || {})[sub.id] || '—';
        return `<p>${sub.id}) Válaszod: <strong>${studentAns}</strong> ${icon ? `<span class="${cls}">${icon}</span>` : ''} | Helyes: <strong>${sub.answer}</strong></p>`;
      }).join('');
    }
    if (task.explanation) {
      body += `<div class="ai-feedback">${task.explanation}</div>`;
    }
  }

  const scored = result ? result.scored : '?';
  const statusCls = result ? (result.scored === result.max ? 'score-good' : result.scored > 0 ? 'score-ok' : 'score-bad') : '';

  return `
    <div class="card task-card" id="task-result-${task.id}">
      <div class="task-header">
        <h3>${idx + 1}. feladat <span style="font-size:0.85rem; font-weight:normal; color:#666">(${task.year || ''} ${task.variant ? task.variant + '. variáns' : ''})</span></h3>
        <span class="score-badge ${statusCls}">${scored}/${task.maxPoints} pont</span>
      </div>
      ${body}
    </div>`;
}

async function gradeOpenTasks() {
  let totalScored = taskResults.filter(r => !r.pending).reduce((s, r) => s + r.result.scored, 0);
  const totalMax = computeTotalMax(tasks);
  const essayResult = { scores: {}, totalScore: 0, feedback: '' };

  for (let i = 0; i < taskResults.length; i++) {
    const { task, pending } = taskResults[i];
    if (!pending) continue;

    const studentAnswers = answers[task.id] || {};

    if (task.gradingType === 'essay') {
      const essayText = studentAnswers.essay || '';
      try {
        const res = await fetch('/.netlify/functions/gradeEssay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentText: essayText, prompt: task.prompt, checklist: task.checklist })
        });
        const data = await res.json();
        taskResults[i].result = { scored: data.totalScore, max: task.maxPoints };
        taskResults[i].pending = false;
        totalScored += data.totalScore;
        Object.assign(essayResult.scores, data.dimensions);
        essayResult.totalScore = data.totalScore;
        essayResult.feedback = data.feedback;

        const el = document.getElementById(`essay-result-${task.id}`);
        if (el) {
          let html = `<div class="ai-feedback">${data.feedback}</div>`;
          html += '<div style="margin-top:0.5rem; font-size:0.85rem;">';
          for (const [key, val] of Object.entries(data.dimensions)) {
            const item = task.checklist.find(c => c.label.toLowerCase().startsWith(key));
            const max = item ? item.maxPoints : '?';
            html += `<span style="margin-right:1rem;"><strong>${key}:</strong> ${val}/${max}</span>`;
          }
          html += '</div>';
          el.innerHTML = html;
          el.classList.remove('ai-loading');
        }
        const badge = document.querySelector(`#task-result-${task.id} .score-badge`);
        if (badge) {
          badge.textContent = `${data.totalScore}/${task.maxPoints} pont`;
          badge.className = `score-badge ${data.totalScore >= task.maxPoints * 0.7 ? 'score-good' : data.totalScore > 0 ? 'score-ok' : 'score-bad'}`;
        }
      } catch (e) {
        const el = document.getElementById(`essay-result-${task.id}`);
        if (el) el.innerHTML = '<span style="color:#dc2626">AI értékelés sikertelen. Kérlek értékeld magad a rubrika alapján!</span>';
      }
    } else if (task.gradingType === 'open') {
      const correctAnswers = task.subTasks.map(s => `${s.id}) ${s.answer}`).join('\n');
      let subScored = 0;
      for (const sub of task.subTasks) {
        const studentAns = studentAnswers[sub.id] || '';
        if (!studentAns.trim()) continue;
        try {
          const res = await fetch('/.netlify/functions/gradeAnswer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentAnswer: studentAns,
              correctAnswer: sub.answer,
              explanation: task.explanation || '',
              instruction: task.instruction
            })
          });
          const data = await res.json();
          subScored += data.score || 0;

          const el = document.getElementById(`open-result-${task.id}`);
          if (el) {
            el.innerHTML = `<div class="ai-feedback">${data.feedback}</div>`;
            el.classList.remove('ai-loading');
          }
        } catch (e) { /* silent fail */ }
      }
      taskResults[i].result = { scored: subScored, max: task.maxPoints };
      taskResults[i].pending = false;
      totalScored += subScored;
    }

    renderSummary(totalScored, totalMax, taskResults.some(r => r.pending));
  }

  // Mentés localStorage-ba
  const resultEntry = {
    date: new Date().toISOString(),
    tasks: taskResults.map(r => ({
      taskId: r.task.id, year: r.task.year, variant: r.task.variant,
      position: tasks.indexOf(r.task),
      scored: r.result ? r.result.scored : 0,
      max: r.task.maxPoints
    })),
    totalScored,
    totalMax,
    essay: essayResult.totalScore > 0 ? {
      prompt: tasks.find(t => t.gradingType === 'essay')?.prompt || '',
      studentText: (answers[tasks.find(t => t.gradingType === 'essay')?.id] || {}).essay || '',
      scores: essayResult.scores,
      totalScore: essayResult.totalScore,
      aiFeedback: essayResult.feedback
    } : null
  };
  saveResult(resultEntry);
}

init();
```

- [ ] **Step 3: Commit**

```bash
git add results.html js/results.js
git commit -m "feat: results page — exact grading, AI feedback display, score summary"
```

---

## Task 8: AI Netlify Functions

**Files:**
- Create: `netlify/functions/gradeAnswer.js`
- Create: `netlify/functions/gradeEssay.js`

- [ ] **Step 1: Hozd létre gradeAnswer.js-t**

```js
// netlify/functions/gradeAnswer.js
const Anthropic = require('@anthropic-ai/sdk');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { studentAnswer, correctAnswer, explanation, instruction } = body;
  if (!studentAnswer || !correctAnswer) {
    return { statusCode: 400, body: JSON.stringify({ score: 0, feedback: 'Hiányzó adat.' }) };
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Te egy szigorú, de igazságos magyar nyelvi felvételi javító vagy. Dönts, hogy a diák válasza szemantikailag egyenértékű-e a helyes válasszal.

Feladat: ${instruction}
Helyes válasz: ${correctAnswer}
Elfogadható variánsok / megjegyzés: ${explanation || 'nincs'}
Diák válasza: ${studentAnswer}

Válaszolj KIZÁRÓLAG ebben a JSON formátumban, semmi más:
{"score": 0 vagy 1, "feedback": "max 2 mondatos magyar visszajelzés"}`
    }]
  });

  try {
    const result = JSON.parse(message.content[0].text);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  } catch {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: 0, feedback: 'Az értékelés sikertelen, kérlek ellenőrizd magad.' })
    };
  }
};
```

- [ ] **Step 2: Hozd létre gradeEssay.js-t**

```js
// netlify/functions/gradeEssay.js
const Anthropic = require('@anthropic-ai/sdk');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { studentText, prompt: essayPrompt, checklist } = body;

  if (!studentText || studentText.trim().length < 20) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dimensions: { tartalom: 0, szerkezet: 0, stílus: 0, helyesírás: 0, külalak: 0 },
        totalScore: 0,
        feedback: 'A fogalmazás túl rövid az értékeléshez.'
      })
    };
  }

  const rubricText = (checklist || [])
    .map(item => `- ${item.label} (max ${item.maxPoints} pont)`)
    .join('\n');

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `Te egy szigorú, de igazságos magyar felvételi fogalmazás-javító vagy. Értékeld az alábbi fogalmazást a megadott rubrika szerint.

Téma: ${essayPrompt}

Rubrika:
${rubricText}

Diák fogalmazása:
${studentText}

Válaszolj KIZÁRÓLAG ebben a JSON formátumban, semmi más:
{
  "dimensions": {
    "tartalom": <0-3>,
    "szerkezet": <0-3>,
    "stílus": <0-1>,
    "helyesírás": <0-2>,
    "külalak": <0-1>
  },
  "totalScore": <összeg>,
  "feedback": "2-3 mondatos összefoglaló visszajelzés magyarul"
}`
    }]
  });

  try {
    const result = JSON.parse(message.content[0].text);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  } catch {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dimensions: { tartalom: 0, szerkezet: 0, stílus: 0, helyesírás: 0, külalak: 0 },
        totalScore: 0,
        feedback: 'Az értékelés sikertelen, kérlek próbáld újra.'
      })
    };
  }
};
```

- [ ] **Step 3: Tesztelés Netlify Dev-vel**

Installáld a Netlify CLI-t ha nincs:
```bash
npm install -g netlify-cli
```

Hozz létre `.env` fájlt a projekt gyökerében (gitignore-ban van!):
```
ANTHROPIC_API_KEY=sk-ant-...
```

Indítsd el lokálisan:
```bash
netlify dev
```

Teszteld gradeAnswer-t:
```bash
curl -X POST http://localhost:8888/.netlify/functions/gradeAnswer \
  -H "Content-Type: application/json" \
  -d '{"studentAnswer":"denevér","correctAnswer":"denevér","explanation":"","instruction":"Fejtsd meg az anagramot!"}'
```

Elvárt output: `{"score":1,"feedback":"..."}`

Teszteld gradeEssay-t:
```bash
curl -X POST http://localhost:8888/.netlify/functions/gradeEssay \
  -H "Content-Type: application/json" \
  -d '{"studentText":"Versenyezni szerintem nagyon jó dolog. Először is a verseny motivál minket. Másodszor fejleszti a képességeinket. Harmadszor erősíti a jellemünket. Összefoglalva a verseny fontos az életben.","prompt":"Versenyezni jó?","checklist":[{"label":"Tartalom","maxPoints":3},{"label":"Szerkezet","maxPoints":3},{"label":"Stílus","maxPoints":1},{"label":"Helyesírás","maxPoints":2},{"label":"Külalak","maxPoints":1}]}'
```

Elvárt output: JSON `dimensions` és `totalScore` mezőkkel

- [ ] **Step 4: Commit**

```bash
git add netlify/functions/gradeAnswer.js netlify/functions/gradeEssay.js
git commit -m "feat: netlify functions — gradeAnswer + gradeEssay with Claude Haiku"
```

---

## Task 9: Progress Tracking — js/storage.js

**Files:**
- Create: `js/storage.js`

- [ ] **Step 1: Hozd létre js/storage.js-t**

```js
// js/storage.js

const STORAGE_KEY = 'magyar_felvételi_results';

function loadResults() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveResult(result) {
  const results = loadResults();
  results.push(result);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
}

function exportResults() {
  const results = loadResults();
  const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `felvételi-eredmények-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importResults(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error('Érvénytelen formátum');
      const existing = loadResults();
      const merged = [...existing, ...imported];
      const unique = Array.from(new Map(merged.map(r => [r.date, r])).values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
      alert(`${imported.length} eredmény importálva!`);
      window.location.reload();
    } catch {
      alert('Érvénytelen fájl. Kérlek válassz egy helyes JSON exportot.');
    }
  };
  reader.readAsText(file);
}
```

- [ ] **Step 2: Teszteld lokálisan**

Nyisd meg `http://localhost:8888/index.html` böngészőben.

- [ ] **Step 3: Ellenőrző checklist**

```
[ ] Főoldal betölt, megjelenik az évtáblázat (csak 2023_1 egyelőre)
[ ] "Random teszt" gomb megnyomásakor átvisz test.html-re
[ ] Test oldalon megjelenik mind a 10 feladat
[ ] Feladatonként megjelennek az inputok
[ ] "Beküldés" gomb → results.html-re visz
[ ] Eredmény oldalon megjelenik a pontszám
[ ] Exact feladatoknál ✓/✗ jelzés megjelenik
[ ] AI értékelés elindul és visszatér feedback-kel
[ ] Eredmény localStorage-ba mentődik
[ ] Export gomb letölt egy JSON fájlt
[ ] Import gombbal visszatölthető a JSON
[ ] Statisztika panelen megjelenik az eredmény a főoldalon
```

- [ ] **Step 4: Commit**

```bash
git add js/storage.js
git commit -m "feat: localStorage progress tracking — save, load, export, import"
```

---

## Task 10: Netlify Deploy

- [ ] **Step 1: GitHub repo létrehozása**

Menj a github.com-ra, hozz létre új repót: `Gege-magyar` (privát ajánlott).

```bash
git remote add origin https://github.com/<FELHASZNÁLÓNÉV>/Gege-magyar.git
git branch -M main
git push -u origin main
```

- [ ] **Step 2: Netlify bekötése**

1. Menj a app.netlify.com-ra
2. "Add new site" → "Import an existing project"
3. Válaszd a GitHub-ot → engedélyezd a hozzáférést
4. Válaszd ki a `Gege-magyar` repót
5. Build settings:
   - Base directory: (üres)
   - Build command: (üres — nincs build step)
   - Publish directory: `.`
6. "Deploy site"

- [ ] **Step 3: API kulcs beállítása Netlify-ban**

1. Netlify dashboardon: Site settings → Environment variables
2. "Add a variable": `ANTHROPIC_API_KEY` = `sk-ant-...`
3. Scope: "All scopes"
4. "Save"
5. Site → Deploys → "Trigger deploy" → "Deploy site"

- [ ] **Step 4: Végső ellenőrzés a live URL-en**

```
[ ] Az oldal betölt a Netlify URL-en
[ ] Random teszt működik
[ ] AI értékelés visszatér (gradeAnswer + gradeEssay)
[ ] localStorage mentés/betöltés működik böngészőben
[ ] Mobilon is olvasható (reszponzív layout)
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: netlify deploy — live app ready for data population"
git push
```

---

## Self-Review

**Spec coverage:**
- ✅ Netlify hosting + Functions
- ✅ Random test assembly (position-based)
- ✅ Variable maxPoints, total score tracking
- ✅ gradeAnswer (open questions) + gradeEssay (rubric)
- ✅ localStorage save/load
- ✅ Export/import JSON
- ✅ Statistics + essay development chart
- ✅ Year table with direct links
- ✅ Images support (img tags)
- ✅ Claude Haiku `claude-haiku-4-5-20251001`
- ✅ Pilot data: 2023_1.json

**Nincs lefedve (szándékosan):**
- Opcionális 45 perces visszaszámláló — nem kritikus MVP-hez
- Tiered scoring `tiers` formátum edge case-ek — a pilot JSON validálásánál kiderül

**Placeholder scan:** Nincs TBD, TODO, vagy hiányos lépés.

**Type consistency:** `gradeExact`, `computeTotalMax`, `assembleRandomTest` → következetesen használva logic.js-ben és results.js-ben. `loadResults`, `saveResult`, `exportResults`, `importResults` → storage.js-ben definiálva, main.js és results.js hivatkozza.
