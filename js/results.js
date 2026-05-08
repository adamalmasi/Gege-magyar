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
        return `<p>${sub.id}) Válaszod: <strong>${studentAns}</strong> <span class="${cls}">${icon}</span> | Helyes: <strong>${sub.answer}</strong></p>`;
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
  const essayTask = tasks.find(t => t.gradingType === 'essay');
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
      prompt: essayTask?.prompt || '',
      studentText: (answers[essayTask?.id] || {}).essay || '',
      scores: essayResult.scores,
      totalScore: essayResult.totalScore,
      aiFeedback: essayResult.feedback
    } : null
  };
  saveResult(resultEntry);
}

init();
