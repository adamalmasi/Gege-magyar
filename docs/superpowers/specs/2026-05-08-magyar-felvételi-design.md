# Magyar Felvételi Gyakorló App — Design Spec

**Dátum:** 2026-05-08  
**Státusz:** Jóváhagyva

---

## Összefoglalás

Webalkalmazás 14 éves felvételizőknek (Gegének), amely az elmúlt 22 év (2005–2026) 8. osztályos magyar nyelvi felvételi feladatlapjaiból összeállított random teszteket biztosít, azonnali AI-alapú visszajelzéssel és haladáskövetéssel.

---

## Architektúra

```
GitHub repo → Netlify (auto-deploy git push-ra)
├── index.html          — főoldal (évtáblázat, random teszt, statisztikák)
├── test.html           — teszt kitöltő oldal
├── results.html        — eredmény + AI visszajelzés
├── style.css
├── app.js
├── data/               — JSON feladatlapok (~55 fájl)
├── images/             — kivágott PDF képek
└── netlify/
    └── functions/
        ├── gradeAnswer.js   — nyílt kérdések értékelése (Claude Haiku)
        └── gradeEssay.js    — esszé értékelése rubrika szerint (Claude Haiku)
```

**Hosting:** Netlify (statikus fájlok + serverless functions)  
**AI:** Anthropic Claude Haiku 4.5  
**API kulcs:** `ANTHROPIC_API_KEY` → Netlify dashboard / Environment Variables (egyetlen hely)  
**Adattárolás:** `localStorage` (böngészőben) + JSON export/import

---

## Adatmodell

### Fájlnév-konvenció

```
data/2023_1.json   — rendes felvételi
data/2023_2.json   — pótfelvételi
data/2023_3.json   — második pótfelvételi (ahol van)
```

Évek: 2005–2026. Variánsok: 1, 2 minden évben; 1, 2, 3 ezeknél: 2006, 2007, 2010, 2021, 2022. Összesen ~55 fájl.

### Feladatlap JSON felépítése

```json
{
  "year": 2023,
  "variant": 1,
  "label": "2023 rendes felvételi",
  "tasks": [ ... ]
}
```

### Task objektum

```json
{
  "id": 3,
  "maxPoints": 4,
  "instruction": "Párosítsd a szólásokat a megfelelő kategóriákhoz!",
  "subTasks": [
    { "id": "a", "prompt": "Töri a fejét", "answer": "gondolkodik", "points": 1 },
    { "id": "b", "prompt": "Befogja a száját", "answer": "hallgat", "points": 1 }
  ],
  "scoring": "per_item",
  "images": [],
  "explanation": "Elfogadható bármely szinonim megfogalmazás.",
  "gradingType": "open"
}
```

**`gradingType` értékek:**
- `"exact"` — string egyezés frontenden (pl. igaz/hamis, egyértelmű párosítás)
- `"open"` — Claude Haiku értékeli szemantikusan
- `"essay"` — Claude Haiku értékeli rubrika szerint

**`scoring` értékek:**
- `"all_or_nothing"` — csak ha minden elem helyes
- `"per_item"` — részpontozás al-feladatonként
- `"tiered"` — fokozatos: `"tiers": [[6, 3], [4, 2], [2, 1], [0, 0]]` (min helyes → pont)

**Esszé task (task 10 minden évben):**
```json
{
  "id": 10,
  "maxPoints": 10,
  "prompt": "Versenyezni jó?",
  "instruction": "10–12 mondatos fogalmazásodban fejtsd ki véleményedet, 3 érvvel!",
  "gradingType": "essay",
  "checklist": [
    { "label": "Tartalom: 3 érvvel alátámasztott, egyértelmű álláspont", "maxPoints": 3 },
    { "label": "Szerkezet: kerek, tagolt, lezárt szöveg, min. 10 mondat", "maxPoints": 3 },
    { "label": "Stílus: köznyelvi normának megfelelő", "maxPoints": 1 },
    { "label": "Helyesírás: legfeljebb 1-2 kisebb hiba", "maxPoints": 2 },
    { "label": "Külalak: rendezett, áttekinthető", "maxPoints": 1 }
  ]
}
```

---

## Random teszt összeállítása

A teszt pozíciónként húz egy feladatot az összes évből:

```js
for (let pos = 0; pos < 10; pos++) {
  const candidates = allYears.map(sheet => sheet.tasks[pos]);
  selectedTasks[pos] = randomPick(candidates);
}

maxPont = selectedTasks.reduce((sum, t) => sum + t.maxPoints, 0); // ~30–42
```

Az egyes pozíciók feladatai minden évben különbözők lehetnek — ez a szándékos: Gege mindig más keveréket kap, és nem memorizálhatja a sorrendet.

---

## Képernyők

### 1. Főoldal (`index.html`)
- Évtáblázat: minden elérhető feladatlap linkje (saját maga is kipróbálhatja évről évre)
- **"Random teszt" gomb** — 10 random feladatból álló tesztet indít
- **Statisztikák panel** — összesített haladás (localStorage-ból)
- Export / Import JSON gomb

### 2. Teszt oldal (`test.html`)
- 10 feladat egymás után (egy lapon scroll-ozva vagy lapozva)
- Feladatonként: instrukció, al-kérdések, beviteli mezők
- Képek megjelenítése ahol szükséges
- Opcionális: 45 perces visszaszámláló
- "Beküldés" gomb a végén

### 3. Eredmény oldal (`results.html`)
- Elért pont / max pont (pl. 34/42)
- Feladatonként: helyes/helytelen jelzés + AI visszajelzés nyílt kérdéseknél
- Esszénél: rubrika-bontás (tartalom: 2/3, szerkezet: 3/3, stb.) + AI szöveges feedback
- "Új teszt" gomb

### 4. Statisztika nézet (a főoldalon belül)
- Összes megírt teszt összpontszáma időtengelyen
- Esszé fejlődési görbe (pozíciónként bontva: tartalom, szerkezet, stb.)
- Legjobb eredmény, átlag

---

## AI értékelés (Netlify Functions)

### `gradeAnswer.js` — nyílt kérdések

**Input:**
```json
{
  "studentAnswer": "A szólás azt jelenti, hogy sokat gondolkodik",
  "correctAnswer": "gondolkodik / töri a fejét",
  "explanation": "Elfogadható bármely szinonim megfogalmazás.",
  "instruction": "Magyarázd meg a szólás jelentését!"
}
```

**Output:**
```json
{
  "score": 1,
  "maxScore": 1,
  "feedback": "Helyes! A szólás valóban intenzív gondolkodást jelent."
}
```

**Claude prompt elve:** A modell kapja az answer key-t és az elfogadható variánsokat, és szemantikai egyenértékűséget ítél meg — nem szó szerinti egyezést keres.

### `gradeEssay.js` — esszé értékelés

**Input:**
```json
{
  "studentText": "Versenyezni szerintem jó dolog...",
  "prompt": "Versenyezni jó?",
  "checklist": [
    { "label": "Tartalom: 3 érvvel alátámasztott álláspont", "maxPoints": 3 },
    ...
  ]
}
```

**Output:**
```json
{
  "dimensions": {
    "tartalom": 2,
    "szerkezet": 3,
    "stílus": 1,
    "helyesírás": 1,
    "külalak": 1
  },
  "totalScore": 8,
  "feedback": "Az álláspont egyértelmű, de csak 2 érvvel támaszkodik alá..."
}
```

---

## Haladáskövetés (localStorage)

```json
{
  "results": [
    {
      "date": "2026-05-08T14:32:00Z",
      "tasks": [
        { "year": 2023, "variant": 1, "position": 1, "scored": 1, "max": 1 },
        ...
      ],
      "totalScored": 34,
      "totalMax": 42,
      "essay": {
        "prompt": "Versenyezni jó?",
        "studentText": "...",
        "scores": { "tartalom": 2, "szerkezet": 3, "stílus": 1, "helyesírás": 1, "külalak": 1 },
        "totalScore": 8,
        "aiFeedback": "..."
      }
    }
  ]
}
```

**Export:** JSON letöltés gombbal  
**Import:** JSON feltöltés gombbal (másik gépen is folytatható)

---

## Digitalizálási workflow

1. **Pilot:** `2023_1` fl+ut → JSON (kézzel validálva az útmutatóval)
2. **Batch:** évenként haladva, fl+ut párokat Claude Code dolgoz fel
3. **Képek:**
   - 2005–2014: beágyazott PDF képek → manuálisan kivágni → `images/{év}_{variáns}_f{n}/`
   - 2015+: képforrás URL-ek az útmutatókban → közvetlen hivatkozás a JSON-ban
4. **Validálás:** minden JSON-t az útmutatóval összevetni (különösen pontozási sémák, elfogadható válasz-variánsok)

---

## Technikai megfontolások

### Ami ismert kihívás lesz
- **Nyílt kérdések variabilitása:** Az elfogadható válaszok köre nagy (az útmutatók is jelzik: "más jó megoldás is elfogadható"). A Claude Haiku promptot úgy kell megírni, hogy ne legyen sem túl szigorú, sem túl laza.
- **Képek a régi évekből:** 2005–2014 PDF-ek beágyazott képeinek kivágása manuális munka. Priorizálni kell (6. feladat ikonjai fontosak, karikatúrák kevésbé).
- **Esszé automatikus értékelése:** A helyesírási dimenzió megbízhatóan mérhető, a "külalak" (kézírás minősége) digitálisan nem. Ezt a dimenziót a tanuló önmaga értékeli checkboxszal.

### Ami nem szerepel (szándékosan)
- Felhasználói autentikáció — nincs szükség rá
- Adatbázis — localStorage elegendő
- Matematika feladatok — külön app, később
