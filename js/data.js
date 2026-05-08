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
