let currentPlan = null;
let generatedPlan = null;
let workoutSeconds = 0;
let workoutTimerInterval = null;

function initTabs() {
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');

      if (btn.dataset.tab === 'stats') Stats.refresh();
      if (btn.dataset.tab === 'body') Body.refresh();
      if (btn.dataset.tab === 'nutrition') NutritionUI.refresh();
      if (btn.dataset.tab === 'achievements') AchievementsUI.refresh();
    });
  });
}

/* ===================== 训练计划 ===================== */
function initPlan() {
  const form = document.getElementById('plan-form');
  const planResult = document.getElementById('plan-result');
  const planDays = document.getElementById('plan-days');
  const planTitle = document.getElementById('plan-title');
  const saveBtn = document.getElementById('save-plan');
  const reshuffleBtn = document.getElementById('reshuffle-plan');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    generateAndRenderPlan();
  });

  reshuffleBtn.addEventListener('click', () => {
    generateAndRenderPlan(true);
  });

  function generateAndRenderPlan(isReshuffle) {
    const goal = document.getElementById('goal').value;
    const days = document.getElementById('days').value;
    const level = document.getElementById('level').value;

    generatedPlan = generatePlan(goal, days, level);
    planTitle.textContent = `${generatedPlan.goalLabel} · 每周 ${days} 天`;
    renderPlan(generatedPlan, planDays);
    planResult.classList.remove('hidden');
    planResult.scrollIntoView({ behavior: 'smooth' });
    if (isReshuffle) showToast('已重新生成一批动作');
  }

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

async function loadSavedPlan() {
  currentPlan = await Storage.getPlan();
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

/* ===================== 开始训练 ===================== */
async function initWorkout() {
  const empty = document.getElementById('workout-empty');
  const content = document.getElementById('workout-content');
  const daySelect = document.getElementById('workout-day');
  const exerciseList = document.getElementById('exercise-list');
  const finishBtn = document.getElementById('finish-workout');

  if (!currentPlan) {
    currentPlan = await Storage.getPlan();
  }

  if (!currentPlan) {
    empty.classList.remove('hidden');
    content.classList.add('hidden');
    return;
  }

  empty.classList.add('hidden');
  content.classList.remove('hidden');

  daySelect.innerHTML = currentPlan.planDays
    .map((day, i) => `<option value="${i}">${day.name} - ${day.focus}</option>`)
    .join('');

  async function renderExercises() {
    const dayIndex = parseInt(daySelect.value);
    const day = currentPlan.planDays[dayIndex];
    const rest = day.exercises[0] ? day.exercises[0].rest : 0;

    const exercisePromises = day.exercises.map(async (ex, exIndex) => {
      const last = await Storage.getExerciseLastRecord(ex.name);
      const lastHtml = last
        ? `<div class="last-record">上次参考：${last.bestWeight}kg × ${last.bestReps}次（${formatDate(last.date)}，最大 ${last.maxWeight}kg）</div>`
        : '';
      return `
      <div class="exercise-card" data-exercise="${exIndex}">
        <div class="exercise-card-header">
          <span class="exercise-name">${ex.name}</span>
          <span class="exercise-target">${ex.sets}组 × ${ex.reps}次 · 休息${rest}s</span>
        </div>
        ${lastHtml}
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
    `;
    });

    const exerciseHtml = await Promise.all(exercisePromises);
    exerciseList.innerHTML = exerciseHtml.join('');

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

    startWorkoutTimer();
  }

  daySelect.addEventListener('change', renderExercises);
  await renderExercises();

  finishBtn.onclick = async () => {
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

    stopWorkoutTimer();

    await Storage.saveLog({
      date: new Date().toISOString(),
      dayName: day.name,
      focus: day.focus,
      duration: workoutSeconds,
      exercises,
    });

    showToast('训练记录已保存！');
    renderHistory();
    Stats.refresh();
    renderExercises();
  };

  renderHistory();
}

/* ---- 训练计时 ---- */
function startWorkoutTimer() {
  stopWorkoutTimer();
  workoutSeconds = 0;
  updateWorkoutTimerDisplay();
  workoutTimerInterval = setInterval(() => {
    workoutSeconds++;
    updateWorkoutTimerDisplay();
  }, 1000);
}

function stopWorkoutTimer() {
  if (workoutTimerInterval) {
    clearInterval(workoutTimerInterval);
    workoutTimerInterval = null;
  }
}

function updateWorkoutTimerDisplay() {
  document.getElementById('workout-timer-display').textContent = formatDuration(workoutSeconds);
}

/* ---- 历史记录 ---- */
async function renderHistory() {
  const container = document.getElementById('workout-history');
  const logs = await Storage.getLogs();

  if (logs.length === 0) {
    container.innerHTML = '<p class="empty-state">暂无训练记录</p>';
    return;
  }

  container.innerHTML = logs
    .slice(0, 20)
    .map((log, i) => {
      const totalSets = log.exercises.reduce(
        (sum, ex) => sum + ex.sets.filter((s) => s.done).length,
        0
      );
      const duration = log.duration ? ` · ${formatDuration(log.duration)}` : '';
      return `
      <div class="history-item">
        <div class="history-head">
          <div class="history-main">
            <strong>${log.dayName}</strong> · ${log.focus}
            <div class="history-date">${formatDateTime(log.date)}${duration}</div>
          </div>
          <div class="history-actions">
            <span class="history-detail">${totalSets} 组</span>
            <button class="btn-icon" data-toggle="${i}">详情</button>
            <button class="btn-icon btn-danger-icon" data-delete="${i}" title="删除记录">✕</button>
          </div>
        </div>
        <div class="history-expand hidden" data-expand="${i}">
          ${log.exercises
            .map((ex) => {
              const done = ex.sets.filter((s) => s.done);
              const doneCount = done.length;
              const detail =
                doneCount > 0
                  ? done.map((s) => `${s.weight}kg×${s.reps}`).join('、')
                  : '未完成';
              return `
            <div class="history-exercise">
              <span>${ex.name}</span>
              <span class="history-exercise-detail">${doneCount}/${ex.sets.length} 组 · ${detail}</span>
            </div>`;
            })
            .join('')}
        </div>
      </div>`;
    })
    .join('');

  container.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = btn.dataset.toggle;
      const expand = container.querySelector(`[data-expand="${i}"]`);
      expand.classList.toggle('hidden');
      btn.textContent = expand.classList.contains('hidden') ? '详情' : '收起';
    });
  });

  container.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const i = parseInt(btn.dataset.delete);
      if (confirm('确定删除这条训练记录吗？')) {
        await Storage.deleteLog(i);
        showToast('记录已删除');
        renderHistory();
        Stats.refresh();
      }
    });
  });
}

/* ---- 问候语 ---- */
async function updateGreeting() {
  const p = await Storage.getProfile();
  const sub = document.getElementById('header-sub');
  if (p.name) {
    sub.textContent = `你好，${p.name}！开始今天的训练吧`;
  } else {
    sub.textContent = '你的私人健身助手';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  initTabs();
  initPlan();
  await initWorkout();
  Timer.init();
  Stats.init();
  Body.init();
  NutritionUI.init();
  AchievementsUI.init();
  Settings.init();
  await updateGreeting();
  
  // 检查成就
  const stats = {
    totalWorkouts: (await Storage.getLogs()).length,
    streak: Stats.calcStreak(await Storage.getLogs()),
    totalVolume: await calculateTotalVolume(),
    bodyWeight: await getBodyWeight(),
    earlyMorningWorkouts: 0,
    lateNightWorkouts: 0,
    weekendWorkouts: 0,
  };
  AchievementsUI.checkNewAchievements(stats);
  
  // 注册Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .then((registration) => {
        console.log('ServiceWorker registered:', registration.scope);
      })
      .catch((error) => {
        console.log('ServiceWorker registration failed:', error);
      });
  }
});

async function calculateTotalVolume() {
  const logs = await Storage.getLogs();
  let totalVolume = 0;
  logs.forEach(log => {
    log.exercises.forEach(ex => {
      ex.sets.forEach(set => {
        if (set.done && set.weight && set.reps) {
          totalVolume += set.weight * set.reps;
        }
      });
    });
  });
  return totalVolume;
}

async function getBodyWeight() {
  const records = await Storage.getBodyRecords();
  return records.length > 0 ? records[records.length - 1].weight : 70;
}
