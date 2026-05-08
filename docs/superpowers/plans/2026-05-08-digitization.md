# Magyar Felvételi — Digitization Plan (Plan B: Data)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Digitize all ~55 feladatlapok into JSON format following the schema defined in the app plan (Plan A, Task 2).

**Architecture:** Each task reads one `_fl_` + one `_ut_` PDF pair and produces one JSON file + updates `data/index.json`. The pilot (2023_1) is already done in Plan A — start from Task 2 here.

**Tech Stack:** PDF reading via Claude Code Read tool, JSON schema from `data/2023_1.json` as reference.

**Reference:** Always check `data/2023_1.json` as the canonical schema example before starting each task.

---

## Feldolgozandó fájlok sorrendje

A pilot (2023_1) már elkészült. A többi feldolgozás ajánlott sorrendje (legújabbtól legrégebbiig):

| Task | Év | Variáns | FL fájl | UT fájl |
|---|---|---|---|---|
| 2 | 2026 | 1 | A8_2026_1_fl.pdf | A8_2026_1_ut.pdf |
| 3 | 2026 | 2 | A8_2026_2_fl.pdf | A8_2026_2_ut.pdf |
| 4 | 2025 | 1 | A8_2025_1_fl.pdf | A8_2025_1_ut.pdf |
| 5 | 2025 | 2 | A8_2025_2_fl.pdf | A8_2025_2_ut.pdf |
| 6 | 2024 | 1 | A8_2024_1_fl.pdf | A8_2024_1_ut.pdf |
| 7 | 2024 | 2 | A8_2024_2_fl.pdf | A8_2024_2_ut.pdf |
| 8 | 2023 | 2 | A8_2023_2_fl.pdf | A8_2023_2_ut.pdf |
| 9 | 2022 | 1 | A8_2022_1_fl.pdf | A8_2022_1_ut.pdf |
| 10 | 2022 | 2 | A8_2022_2_fl.pdf | A8_2022_2_ut.pdf |
| 11 | 2022 | 3 | A8_2022_3_fl.pdf | A8_2022_3_ut.pdf |
| 12 | 2021 | 1 | A8_2021_1_fl.pdf | A8_2021_1_ut.pdf |
| 13 | 2021 | 2 | A8_2021_2_fl.pdf | A8_2021_2_ut.pdf |
| 14 | 2021 | 3 | A8_2021_3_fl.pdf | A8_2021_3_ut.pdf |
| 15 | 2020 | 1 | A8_2020_1_fl.pdf | A8_2020_1_ut.pdf |
| 16 | 2020 | 2 | A8_2020_2_fl.pdf | A8_2020_2_ut.pdf |
| 17 | 2019 | 1 | A8_2019_1_fl.pdf | A8_2019_1_ut.pdf |
| 18 | 2019 | 2 | A8_2019_2_fl.pdf | A8_2019_2_ut.pdf |
| 19 | 2018 | 1 | A8_2018_1_fl.pdf | A8_2018_1_ut.pdf |
| 20 | 2018 | 2 | A8_2018_2_fl.pdf | A8_2018_2_ut.pdf |
| 21 | 2017 | 1 | A8_2017_1_fl.pdf | A8_2017_1_ut.pdf |
| 22 | 2017 | 2 | A8_2017_2_fl.pdf | A8_2017_2_ut.pdf |
| 23 | 2016 | 1 | A8_2016_1_fl.pdf | A8_2016_1_ut.pdf |
| 24 | 2016 | 2 | A8_2016_2_fl.pdf | A8_2016_2_ut.pdf |
| 25 | 2015 | 1 | A8_2015_1_fl.pdf | A8_2015_1_ut.pdf |
| 26 | 2015 | 2 | A8_2015_2_fl.pdf | A8_2015_2_ut.pdf |
| 27 | 2014 | 1 | A8_2014_1_fl.pdf | A8_2014_1_ut.pdf |
| 28 | 2014 | 2 | A8_2014_2_fl.pdf | A8_2014_2_ut.pdf |
| 29 | 2013 | 1 | A8_2013_1_fl.pdf | A8_2013_1_ut.pdf |
| 30 | 2013 | 2 | A8_2013_2_fl.pdf | A8_2013_2_ut.pdf |
| 31 | 2012 | 1 | A8_2012_1_fl.pdf | A8_2012_1_ut.pdf |
| 32 | 2012 | 2 | A8_2012_2_fl.pdf | A8_2012_2_ut.pdf |
| 33 | 2011 | 1 | A8_2011_1_fl.pdf | A8_2011_1_ut.pdf |
| 34 | 2011 | 2 | A8_2011_2_fl.pdf | A8_2011_2_ut.pdf |
| 35 | 2010 | 1 | A8_2010_1_fl.pdf | A8_2010_1_ut.pdf |
| 36 | 2010 | 2 | A8_2010_2_fl.pdf | A8_2010_2_ut.pdf |
| 37 | 2010 | 3 | A8_2010_3_fl.pdf | A8_2010_3_ut.pdf |
| 38 | 2009 | 1 | A8_2009_1_fl.pdf | A8_2009_1_ut.pdf |
| 39 | 2009 | 2 | A8_2009_2_fl.pdf | A8_2009_2_ut.pdf |
| 40 | 2008 | 1 | A8_2008_1_fl.pdf | A8_2008_1_ut.pdf |
| 41 | 2008 | 2 | A8_2008_2_fl.pdf | A8_2008_2_ut.pdf |
| 42 | 2007 | 1 | A8_2007_1_fl.pdf | A8_2007_1_ut.pdf |
| 43 | 2007 | 2 | A8_2007_2_fl.pdf | A8_2007_2_ut.pdf |
| 44 | 2007 | 3 | A8_2007_3_fl.pdf | A8_2007_3_ut.pdf |
| 45 | 2006 | 1 | A8_2006_1_fl.pdf | A8_2006_1_ut.pdf |
| 46 | 2006 | 2 | A8_2006_2_fl.pdf | A8_2006_2_ut.pdf |
| 47 | 2006 | 3 | A8_2006_3_fl.pdf | A8_2006_3_ut.pdf |
| 48 | 2005 | 1 | A8_2005_1_fl.pdf | A8_2005_1_ut.pdf |
| 49 | 2005 | 2 | A8_2005_2_fl.pdf | A8_2005_2_ut.pdf |

---

## Ismétlődő lépéssablon minden feladatlaphoz

Az alábbi sablon minden Task N-re (N = 2–49) azonos, csak az évszám és variáns változik.

### Task N: {ÉV}_{VARIÁNS}.json

**Files:**
- Create: `data/{ÉV}_{VARIÁNS}.json`
- Modify: `data/index.json`

- [ ] **Step 1: Olvasd be a PDF párokat**

```
input: /Users/gergelyvargha/Documents/ClaudeCode/Gege-magyar/input/A8_{ÉV}_{VARIÁNS}_fl.pdf
input: /Users/gergelyvargha/Documents/ClaudeCode/Gege-magyar/input/A8_{ÉV}_{VARIÁNS}_ut.pdf
```

- [ ] **Step 2: Generáld a JSON-t**

A JSON séma ugyanaz mint `data/2023_1.json`. Szabályok:
- `gradingType: "exact"` — egyértelmű, egyetlen helyes válasz
- `gradingType: "open"` — az útmutató "más jó megoldás is elfogadható" megjegyzéssel jár
- `gradingType: "essay"` — mindig a 10. feladat, mindig tartalmaz `checklist` tömböt
- `scoring: "tiered"` esetén a `tiers` tömb csökkenő sorrendben: `[[maxCorrect, maxPts], ..., [0, 0]]`
- `images: []` — ha a feladatban kép szerepel, jegyezd fel az `explanation` mezőben: `"[KÉP SZÜKSÉGES: leírás]"`
- A 2015+ éveknél az útmutatóban szereplő képforrás URL-eket az `images` tömbben direkten add meg: `["https://..."]`
- Az `explanation` mezőbe kerül minden útmutatóból vett elfogadható válasz-variáns és megjegyzés

- [ ] **Step 3: Validáld a JSON-t**

```bash
node -e "
const d = require('./data/{ÉV}_{VARIÁNS}.json');
console.log('Tasks:', d.tasks.length);
console.log('Max pontok:', d.tasks.map(t => t.id + ':' + t.maxPoints).join(', '));
console.log('Total max:', d.tasks.reduce((s,t) => s+t.maxPoints, 0));
const missing = d.tasks.filter(t => !t.gradingType);
if (missing.length) console.error('HIÁNYZÓ gradingType:', missing.map(t=>t.id));
else console.log('✅ Minden task érvényes');
"
```

Elvárt: 10 task, hibamentes, total max ~30-42

- [ ] **Step 4: Add hozzá az index.json-hoz**

```bash
node -e "
const fs = require('fs');
const idx = JSON.parse(fs.readFileSync('./data/index.json', 'utf8'));
idx.feladatlapok.push({ file: '{ÉV}_{VARIÁNS}.json', year: {ÉV}, variant: {VARIÁNS}, label: '{ÉV} {LABEL}' });
idx.feladatlapok.sort((a,b) => b.year - a.year || a.variant - b.variant);
fs.writeFileSync('./data/index.json', JSON.stringify(idx, null, 2));
console.log('index.json frissítve, összesen:', idx.feladatlapok.length, 'feladatlap');
"
```

ahol `{LABEL}` = `rendes felvételi` ha variáns 1, `pótfelvételi` ha 2, `második pótfelvételi` ha 3.

- [ ] **Step 5: Commit**

```bash
git add data/{ÉV}_{VARIÁNS}.json data/index.json
git commit -m "data: add {ÉV}_{VARIÁNS} feladatlap JSON"
git push
```

---

## Különleges esetek

### 2005–2008: Beágyazott képek
A régi feladatlapok karikatúrákat és ábrákat tartalmaznak közvetlenül a PDF-ben. Ezeket nem kell kivágni az MVP-hez — jelöld az `explanation` mezőben:
```
"explanation": "[KÉP SZÜKSÉGES: karikatúra egy autóval és kaktusszal. Az értékeléshez a feladat szövege elegendő.]"
```

### 2023_2 feladat 6: Strandházirend ikonok
10 ikont tartalmaz a feladatlap. Az útmutatóban nincs külső URL. Az `images` mező:
```json
"images": ["images/2023_2_f6/1.png", "images/2023_2_f6/2.png", ...]
```
A `images/2023_2_f6/` mappát kézzel kell feltölteni (PDF-ből kivágni). Az MVP-hez az `explanation`-be kerülhet a szöveges leírás ideiglenesen.

### 2009–2014: Komplex al-kérdések
Sok feladat tartalmaz a)-tól g)-ig al-kérdéseket vegyes típussal (igaz/hamis + nyílt + MC együtt). Kezelés:
- Minden al-kérdés külön `subTask` elem
- Ha vegyes típus (pl. 3a = exact, 3b = open): az egész task `gradingType: "open"` legyen, és az `explanation` jelezze melyik rész exact
- A Claude Haiku képes a komplex eseteket is kezelni a kontextus alapján

### Esszé pontozás 2010 előtt
- 2005–2009: más rubrika (max 10–16 pt, más dimenziók)
- 2010: 9 pt (nincs külalak)  
- 2011+: 10 pt, 5 dimenzió

A checklist mindig az adott útmutató alapján töltendő ki — ne feltételezd a 2011+ szabványt.

---

## Validálási checklist minden batch után (minden 5 feladatlapnál)

```bash
node -e "
const fs = require('fs');
const idx = JSON.parse(fs.readFileSync('./data/index.json', 'utf8'));
let errors = 0;
for (const entry of idx.feladatlapok) {
  try {
    const d = JSON.parse(fs.readFileSync('./data/' + entry.file, 'utf8'));
    if (d.tasks.length !== 10) { console.error(entry.file + ': task count != 10'); errors++; }
    for (const t of d.tasks) {
      if (!t.gradingType) { console.error(entry.file + ' task ' + t.id + ': missing gradingType'); errors++; }
      if (typeof t.maxPoints !== 'number') { console.error(entry.file + ' task ' + t.id + ': missing maxPoints'); errors++; }
    }
  } catch(e) { console.error(entry.file + ': ' + e.message); errors++; }
}
if (errors === 0) console.log('✅ Minden feladatlap érvényes (' + idx.feladatlapok.length + ' db)');
else console.error('❌ ' + errors + ' hiba');
"
```
