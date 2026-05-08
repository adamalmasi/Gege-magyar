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
    body += task.images.map(src => `<img src="/${src}" alt="feladat kép" style="max-width:100%; margin-bottom:0.75rem; border-radius:6px;" onerror="this.style.display='none'">`).join('');
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
      <p class="instruction">${task.instruction.replace(/ \| /g, '\n')}</p>
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
