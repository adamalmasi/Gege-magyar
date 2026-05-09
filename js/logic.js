// js/logic.js

function assembleRandomTest(allFeladatlapok) {
  const numPositions = Math.max(...allFeladatlapok.map(fl => fl.tasks.length));
  const result = [];
  for (let pos = 0; pos < numPositions; pos++) {
    const candidates = allFeladatlapok
      .filter(fl => fl.tasks.length > pos)
      .map(fl => fl.tasks[pos]);
    result.push(candidates[Math.floor(Math.random() * candidates.length)]);
  }
  return result;
}

function normalizeStudentAnswer(str) {
  return str
    .trim()
    .toLowerCase()
    .replace(/^(az?)\s+/i, '')  // strip leading article (a / az)
    .replace(/\s+/g, ' ');
}

function matchesAnyAlternative(studentRaw, correctRaw) {
  const student = normalizeStudentAnswer(studentRaw);
  // Split correct answer on " / " or " vagy " to get all accepted forms
  const alternatives = correctRaw
    .split(/\s*\/\s*|\s+vagy\s+/i)
    .map(a => normalizeStudentAnswer(a.split(/[—–(]/)[0])); // strip dash-notes and parentheticals
  return alternatives.some(alt => student === alt);
}

function gradeExact(task, answers) {
  const subResults = {};
  for (const sub of task.subTasks) {
    const isCorrect = matchesAnyAlternative(answers[sub.id] || '', sub.answer);
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
    // tiers must be sorted descending by minCorrect
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
