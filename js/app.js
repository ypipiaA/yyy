let currentPlan = null;
let generatedPlan = null;

function initTabs() {
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');

      if (btn.dataset.tab === 'stats') {
        Stats.refresh();
      }
    });
  });
}

function initPlan() {
  const form = document.getElementById('plan-form');
  const planResult = document.getElementById('plan-result');
  const planDays = document.getElementById('plan-days');
  const planTitle = document.getElementById('plan-title');
  const saveBtn = document.getElementById('save-plan');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const goal = document.getElementById('goal').value;
    const days = document.getElementById('days').value;
    const level = document.getElementById('level').value;

    generatedPlan = generatePlan(goal, days, level);
    planTitle.textContent = `${generatedPlan.goalLabel} · 每周 ${days} 天`;
    renderPlan(generatedPlan, planDays);
    planResult.classList.remove('hidden');
    planResult.scrollIntoView({ behavior: 'smooth' });
  });

  saveBtn.addEventListener('click', () => {
    if (!generatedPlan) return;
    Storage.savePlan(generatedPlan);
    currentPlan = generatedPlan;
    showToast('训练计划已保存！');
    renderSavedPlanSection();
    initWorkout();
  });

  loadSavedPlan();
}

function loadSavedPlan() {
  currentPlan = Storage.getPlan();
  if (currentPlan) {
    renderSavedPlanSection();
  }
}

function renderSavedPlanSection() {
  const section = document.getElementById('saved-plan');
  const content = document.getElementById('saved-plan-content');
  if (currentPlan) {
    renderSavedPlan(currentPlan, content);
    section.classList.remove('hidden');
  }
}

function initWorkout() {
  const empty = document.getElementById('workout-empty');
  const content = document.getElementById('workout-content');
  const daySelect = document.getElementById('workout-day');
  const exerciseList = document.getElementById('exercise-list');
  const finishBtn = document.getElementById('finish-workout');

  if (!currentPlan) {
    currentPlan = Storage.getPlan();
  }

  if (!currentPlan) {
    empty.classList.remove('hidden');
    content.classList.add('hidden');
    return;
  }

  empty.classList.add('hidden');
  content.classList.remove('hidden');

  daySelect.innerHTML = currentPlan.planDays
    .map(
      (day, i) =>
        `<option value="${i}">${day.name} - ${day.focus}</option>`
    )
    .join('');

  function renderExercises() {
    const dayIndex = parseInt(daySelect.value);
    const day = currentPlan.planDays[dayIndex];

    exerciseList.innerHTML = day.exercises
      .map(
        (ex, exIndex) => `
      <div class="exercise-card" data-exercise="${exIndex}">
        <div class="exercise-card-header">
          <span class="exercise-name">${ex.name}</span>
          <span class="exercise-target">${ex.sets}组 × ${ex.reps}次</span>
        </div>
        <table class="sets-table">
          <thead>
            <tr>
              <th>组</th>
              <th>重量(kg)</th>
              <th>次数</th>
              <th>完成</th>
            </tr>
          </thead>
          <tbody>
            ${Array.from({ length: ex.sets }, (_, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><input type="number" class="set-weight" min="0" step="0.5" value=""></td>
                <td><input type="number" class="set-reps" min="0" value=""></td>
                <td><input type="checkbox" class="set-done"></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <button class="add-set-btn" data-exercise="${exIndex}">+ 加一组</button>
      </div>
    `
      )
      .join('');

    exerciseList.querySelectorAll('.add-set-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.exercise-card');
        const tbody = card.querySelector('tbody');
        const rowCount = tbody.querySelectorAll('tr').length + 1;
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${rowCount}</td>
          <td><input type="number" class="set-weight" min="0" step="0.5" value=""></td>
          <td><input type="number" class="set-reps" min="0" value=""></td>
          <td><input type="checkbox" class="set-done"></td>
        `;
        tbody.appendChild(row);
      });
    });
  }

  daySelect.addEventListener('change', renderExercises);
  renderExercises();

  finishBtn.onclick = () => {
    const dayIndex = parseInt(daySelect.value);
    const day = currentPlan.planDays[dayIndex];
    const cards = exerciseList.querySelectorAll('.exercise-card');

    const exercises = [];
    cards.forEach((card, i) => {
      const ex = day.exercises[i];
      const sets = [];
      card.querySelectorAll('tbody tr').forEach((row) => {
        sets.push({
          weight: parseFloat(row.querySelector('.set-weight').value) || 0,
          reps: parseInt(row.querySelector('.set-reps').value) || 0,
          done: row.querySelector('.set-done').checked,
        });
      });
      exercises.push({ name: ex.name, muscle: ex.muscle, sets });
    });

    const doneCount = exercises.reduce(
      (sum, ex) => sum + ex.sets.filter((s) => s.done).length,
      0
    );

    if (doneCount === 0) {
      showToast('请至少完成一组训练');
      return;
    }

    Storage.saveLog({
      date: new Date().toISOString(),
      dayName: day.name,
      focus: day.focus,
      exercises,
    });

    showToast('训练记录已保存！');
    renderHistory();
    Stats.refresh();
    renderExercises();
  };

  renderHistory();
}

function renderHistory() {
  const container = document.getElementById('workout-history');
  const logs = Storage.getLogs();

  if (logs.length === 0) {
    container.innerHTML = '<p class="empty-state">暂无训练记录</p>';
    return;
  }

  container.innerHTML = logs
    .slice(0, 20)
    .map((log) => {
      const totalSets = log.exercises.reduce(
        (sum, ex) => sum + ex.sets.filter((s) => s.done).length,
        0
      );
      return `
      <div class="history-item">
        <div>
          <strong>${log.dayName}</strong> · ${log.focus}
          <div class="history-date">${formatDateTime(log.date)}</div>
        </div>
        <span class="history-detail">${totalSets} 组完成</span>
      </div>
    `;
    })
    .join('');
}

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initPlan();
  initWorkout();
  Timer.init();
  Stats.init();
});
