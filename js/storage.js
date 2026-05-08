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
