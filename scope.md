# Magyar Felvételi Gyakorló App — Projekt Scope

## Cél

Webalkalmazás 14 éves felvételizőknek, amely az elmúlt 25 év (2001–2026) 8. osztályos
magyar nyelvi felvételi feladatlapjain alapuló, véletlenszerűen összeállított teszteket
biztosít. A tanuló kitölti a tesztet, beküldi, és azonnali visszajelzést kap arról, mit
rontott el és mi lett volna a helyes válasz.

## Forrásanyagok

Minden évből 4 PDF dokumentum áll rendelkezésre:

| Fájlnév | Tartalom |
|---|---|
| `A8_{év}_1_fl.pdf` | Rendes felvételi feladatlap |
| `A8_{év}_1_ut.pdf` | Rendes felvételi javítási útmutató |
| `A8_{év}_2_fl.pdf` | Pótfelvételi feladatlap |
| `A8_{év}_2_ut.pdf` | Pótfelvételi javítási útmutató |

- A PDF-ek **szöveges típusúak** (nem szkennelt), a szöveg géppel olvasható.
- Néhány feladatban **képek is szerepelnek** (ikonok, fotók).
- A 9. feladat képeinek forrás-URLjei az útmutatóban szerepelnek (pixabay, pexels).
- A 6. feladat ikonjait (strandházirend) ki kell vágni a PDF-ből.

## Tantárgy és hatókör

- **Első körben: Magyar nyelv** (Matematikát majd később, külön alkalmazásban)
- ~25 év × 2 variáns = ~50 feladatlap
- Feladatlaponként 10 feladat, ~42 pont összesen

## Döntések

### Architektúra: Statikus web app (A opció)

- HTML + CSS + vanilla JavaScript
- Adatok: JSON fájlok (`data/` mappa)
- Képek: `images/` mappa (PDF-ből kivágva, vagy külső URL)
- Hosting: GitHub Pages vagy Netlify (ingyenes)
- Lokálisan is működik: `index.html` megnyitásával böngészőben
- Nincs backend, nincs adatbázis

### Fogalmazás kiértékelése: Önértékelő checklist (C opció)

- A 10. feladatnál (fogalmazás) a gép nem értékel automatikusan
- Az útmutató szempontjait (tartalom, szerkezet, stílus, helyesírás, külalak)
  megjeleníti a rendszer, a tanuló manuálisan kipipálja, amit teljesített
- A rendszer felkészített a B opcióra való váltásra (Claude API integráció)
  egy jövőbeli fejlesztésben

### Csak Magyar (első fázis)

Matematika külön alkalmazásba kerül majd, más feladattípus-logikával.

## Adatmodell

A feladatlap és a javítási útmutató adatai **egy JSON fájlba vannak olvasztva**.
Külön útmutató-JSON nincs — az alkalmazásnak a kérdés + helyes válasz + pontozási
szabály egyszerre kell a kiértékeléshez.

### Fájlnév-konvenció

```
data/2023_1.json   ← rendes felvételi
data/2023_2.json   ← pótfelvételi
```

### JSON felépítése

```json
{
  "year": 2023,
  "variant": 2,
  "label": "2023 pótfelvételi",
  "totalPoints": 42,
  "tasks": [ ... ]
}
```

### Kérdéstípusok (7 típus, a 2023-as feladatlap alapján)

| Típus | Leírás | Példa feladat |
|---|---|---|
| `anagram` | Összekevert betűkből szót kell kirakni, szabad szöveges bevitel | 1. feladat |
| `multiple_choice` | Egy helyes válasz karikázása, több állítás egyszerre | 2. feladat |
| `fill_from_list` | Megadott szólistából kell választani, szabad bevitel | 3. feladat |
| `grid_select` | Számrácsból kell kijelölni számokat (lottószelvény) | 4. feladat |
| `matching` | Varázsige / ikon párosítása kategóriához | 5., 6. feladat |
| `true_false` | Igaz / Hamis állítások | 8., 9. feladat |
| `essay` | Szabad szöveges fogalmazás + önértékelő checklist | 10. feladat |

### Pontozási sémák

```json
"scoring": "all_or_nothing"
"scoring": "per_item"
"scoring": "tiered",
"tiers": [[4, 2], [2, 1], [0, 0]]
```

### Példa task objektum (anagram)

```json
{
  "id": 1,
  "type": "anagram",
  "instruction": "Az összekeveredett betűkből egy-egy állatnevet tudsz kirakni. Írd a helyes megfejtést a vonalra!",
  "items": ["RÉVEEND", "SZRRROVAÚ", "IDDVÓSZAN"],
  "answers": ["denevér", "orrszarvú", "vaddisznó"],
  "points": 1,
  "scoring": "all_or_nothing",
  "explanation": "A pont csak akkor adható, ha mindhárom megoldás helyes."
}
```

### Példa task objektum (fogalmazás / essay)

```json
{
  "id": 10,
  "type": "essay",
  "prompt": "Versenyezni jó?",
  "instruction": "10–12 mondatos fogalmazásodban fejtsd ki erről a véleményedet, 3 érvvel támaszd alá álláspontodat!",
  "minSentences": 10,
  "points": 10,
  "checklist": [
    { "label": "Tartalom: 3 különböző érv szerepel, álláspont egyértelműen azonosítható", "maxPoints": 3 },
    { "label": "Szerkezet: kerek, egész, lezárt szöveg, logikusan tagolt", "maxPoints": 3 },
    { "label": "Stílus: köznyelvi normának megfelelő, gazdag szókincsű", "maxPoints": 1 },
    { "label": "Helyesírás: legfeljebb 1-2 kisebb hiba", "maxPoints": 2 },
    { "label": "Külalak, íráskép: rendezett, áttekinthető", "maxPoints": 1 }
  ]
}
```

## Képkezelés

- **6. feladat ikonjai**: manuálisan kivágandók a PDF-ből → `images/{év}_{variáns}_f6/1.png ... 10.png`
- **9. feladat fotói**: forrás-URLek az útmutatóban vannak, ezek közvetlenül linkként hivatkozhatók, vagy előre letölthetők
- A task JSON-ban a képek relatív útvonalként szerepelnek: `"images/2023_2_f6/1.png"`

## Mappastruktúra

```
magyar-felvételi/
├── index.html          ← főoldal: évválasztó + random teszt gomb
├── test.html           ← teszt kitöltő oldal
├── results.html        ← eredmény + kiértékelés + magyarázatok
├── style.css
├── app.js
├── data/
│   ├── 2023_1.json
│   ├── 2023_2.json
│   ├── 2022_1.json
│   └── ...
└── images/
    ├── 2023_1_f6/
    │   └── 1.png ... 10.png
    └── 2023_2_f6/
        └── 1.png ... 10.png
```

## Képernyők (tervezett)

1. **Főoldal**: Év és variáns választó táblázat + "Random teszt" gomb (véletlenszerűen kever kérdéseket több évből)
2. **Teszt oldal**: Kérdések egymás után vagy egy lapon, 45 perces visszaszámláló opcionálisan
3. **Eredmény oldal**: Elért pontszám, feladatonkénti visszajelzés, helyes válasz megjelenítése
4. **Fogalmazás értékelő**: Checklist a 10. feladathoz, tanuló kipipálja a teljesített szempontokat

## Gamifikáció (tervezett)

- Pontszám + százalék megjelenítése
- Vizuális visszajelzés (jól sikerült / fejleszthető / próbáld újra)
- Opcionális: streak-számláló, legjobb pontszám localStorage-ban tárolva

## Digitalizálási munkafolyamat

1. PDF-ek letöltése a forrás weboldalról (manuálisan vagy szkripttel)
2. Claude Code olvassa be a PDF-et és generál strukturált JSON-t
3. Képek kivágása a PDF-ből (6. feladat ikonjai)
4. JSON ellenőrzése (különösen a pontozási szabályok és az elfogadható válasz-variánsok)
5. Ismétlés minden évre és variánsra

## Nyitott kérdések / Következő lépések

- [ ] Honnan tölthetők le a PDF-ek? (forrás weboldal URL-je szükséges)
- [ ] A 6. feladat ikonjait ki vágja ki? (manuális munka)
- [ ] Mobilra optimalizált-e a teszt felület? (várható, hogy telefonon is használja)
- [ ] Kell-e haladás-mentés? (pl. félbehagyott teszt localStorage-ban)
- [ ] Visszaszámláló óra legyen-e? (45 perc, mint az igazi felvételin)

## Következő fejlesztési fázis (jövő)

- Matematika feladatlapok (külön app)
- AI alapú fogalmazás értékelés (Claude API, B opció)
- Felhasználói statisztikák (melyik feladattípus a leggyengébb)
