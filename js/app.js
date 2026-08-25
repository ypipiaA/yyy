let currentPlan = null;
let generatedPlan = null;
let workoutSeconds = 0;
let workoutTimerInterval = null;

function initTabs() {
  const buttons = document.querySelectorAll('.nav-btn');
  const syncAria = () => {
    buttons.forEach((b) => {
      b.setAttribute('aria-selected', b.classList.contains('active') ? 'true' : 'false');
    });
  };
  syncAria();

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
      syncAria();
      btn.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });

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

/**
 * 计划数据自愈：planDays 不是数组视为坏数据（历史 BUG-1 污染），清除。
 */
function sanitizePlan(plan) {
  if (plan && !Array.isArray(plan.planDays)) {
    console.warn('检测到损坏的计划数据，已清除');
    Storage.clearPlan();
    return null;
  }
  return plan;
}

async function loadSavedPlan() {
  currentPlan = sanitizePlan(await Storage.getPlan());
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
    currentPlan = sanitizePlan(await Storage.getPlan());
  } else {
    currentPlan = sanitizePlan(currentPlan);
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
        `<option value="${i}">${escapeHtml(day.name)} - ${escapeHtml(day.focus)}</option>`
    )
    .join('');

  async function renderExercises() {
    const dayIndex = parseInt(daySelect.value);
    const day = currentPlan.planDays[dayIndex];
    const rest = day.exercises[0] ? Number(day.exercises[0].rest) || 0 : 0;

    // 一次取出全部 logs，循环内查找（避免逐动作重复读取）
    const logs = await Storage.getLogs();

    exerciseList.innerHTML = day.exercises
      .map((ex, exIndex) => {
        const last = findExerciseLastRecord(logs, ex.name);
        const lastHtml = last
          ? `<div class="last-record">上次参考：${Number(last.bestWeight)}kg × ${Number(last.bestReps)}次（${formatDate(last.date)}，最大 ${Number(last.maxWeight)}kg）</div>`
          : '';
        return `
      <div class="exercise-card" data-exercise="${exIndex}">
        <div class="exercise-card-header">
          <span class="exercise-name">${escapeHtml(ex.name)}</span>
          <span class="exercise-target">${Number(ex.sets)}组 × ${escapeHtml(String(ex.reps))}次 · 休息${rest}s</span>
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
                <td><input type="number" class="set-weight" inputmode="decimal" min="0" step="0.5" value=""></td>
                <td><input type="number" class="set-reps" inputmode="numeric" min="0" value=""></td>
                <td><input type="checkbox" class="set-done" aria-label="标记本组完成"></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <button class="add-set-btn" data-exercise="${exIndex}">+ 加一组</button>
      </div>
    `;
      })
      .join('');
  }

  // 用属性赋值（而非 addEventListener）避免多次 initWorkout 造成监听器累积
  daySelect.onchange = renderExercises;

  // 事件委托：加一组按钮
  exerciseList.onclick = (e) => {
    const btn = e.target.closest('.add-set-btn');
    if (!btn) return;
    const card = btn.closest('.exercise-card');
    const tbody = card.querySelector('tbody');
    const rowCount = tbody.querySelectorAll('tr').length + 1;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${rowCount}</td>
      <td><input type="number" class="set-weight" inputmode="decimal" min="0" step="0.5" value=""></td>
      <td><input type="number" class="set-reps" inputmode="numeric" min="0" value=""></td>
      <td><input type="checkbox" class="set-done" aria-label="标记本组完成"></td>
    `;
    tbody.appendChild(row);
  };

  // 惰性启动计时：首次勾选任一"完成"复选框时开始计时（打开训练页不计时）
  exerciseList.onchange = (e) => {
    if (
      e.target.classList.contains('set-done') &&
      e.target.checked &&
      workoutTimerInterval === null &&
      workoutSeconds === 0
    ) {
      startWorkoutTimer();
    }
  };

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

    // 计时归零，不自动重启（下次首次勾选时再计时）
    workoutSeconds = 0;
    updateWorkoutTimerDisplay();

    showToast('训练记录已保存！');
    renderHistory();
    Stats.refresh();
    AchievementsUI.checkNewAchievements(await buildAchievementStats());
    renderExercises();
  };

  renderHistory();
}

/* ---- 训练计时 ---- */
function startWorkoutTimer() {
  if (workoutTimerInterval) return;
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

/* ---- 成就统计 ---- */
async function buildAchievementStats(logs, records) {
  if (!logs) logs = await Storage.getLogs();
  if (!records) records = await Storage.getBodyRecords();

  let totalVolume = 0;
  let maxWeight = 0;
  let earlyMorningWorkouts = 0;
  let lateNightWorkouts = 0;
  let weekendWorkouts = 0;

  logs.forEach((log) => {
    const d = new Date(log.date);
    const hour = d.getHours();
    const weekday = d.getDay();
    if (hour < 8) earlyMorningWorkouts++;
    if (hour >= 22) lateNightWorkouts++;
    if (weekday === 0 || weekday === 6) weekendWorkouts++;

    log.exercises.forEach((ex) => {
      ex.sets.forEach((set) => {
        if (set.done) {
          if (set.weight && set.reps) totalVolume += set.weight * set.reps;
          if (set.weight > maxWeight) maxWeight = set.weight;
        }
      });
    });
  });

  return {
    totalWorkouts: logs.length,
    streak: Stats.calcStreak(logs),
    totalVolume,
    maxWeight,
    bodyWeight: records.length > 0 ? records[records.length - 1].weight : 70,
    earlyMorningWorkouts,
    lateNightWorkouts,
    weekendWorkouts,
  };
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
            <strong>${escapeHtml(log.dayName)}</strong> · ${escapeHtml(log.focus)}
            <div class="history-date">${formatDateTime(log.date)}${duration}</div>
          </div>
          <div class="history-actions">
            <span class="history-detail">${totalSets} 组</span>
            <button class="btn-icon" data-toggle="${i}">详情</button>
            <button class="btn-icon btn-danger-icon" data-delete="${i}" title="删除记录" aria-label="删除记录">✕</button>
          </div>
        </div>
        <div class="history-expand hidden" data-expand="${i}">
          ${log.exercises
            .map((ex) => {
              const done = ex.sets.filter((s) => s.done);
              const doneCount = done.length;
              const detail =
                doneCount > 0
                  ? done.map((s) => `${Number(s.weight)}kg×${Number(s.reps)}`).join('、')
                  : '未完成';
              return `
            <div class="history-exercise">
              <span>${escapeHtml(ex.name)}</span>
              <span class="history-exercise-detail">${doneCount}/${ex.sets.length} 组 · ${detail}</span>
            </div>`;
            })
            .join('')}
        </div>
      </div>`;
    })
    .join('');

  // 容器级事件委托（避免逐条绑定监听器）
  container.onclick = async (e) => {
    const toggleBtn = e.target.closest('[data-toggle]');
    if (toggleBtn) {
      const i = toggleBtn.dataset.toggle;
      const expand = container.querySelector(`[data-expand="${i}"]`);
      expand.classList.toggle('hidden');
      toggleBtn.textContent = expand.classList.contains('hidden') ? '详情' : '收起';
      return;
    }
    const deleteBtn = e.target.closest('[data-delete]');
    if (deleteBtn) {
      const i = parseInt(deleteBtn.dataset.delete);
      if (confirm('确定删除这条训练记录吗？')) {
        await Storage.deleteLog(i);
        showToast('记录已删除');
        renderHistory();
        Stats.refresh();
      }
    }
  };
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

  // 首次启动写注册日期（用于时间类成就）
  if (!achievementSystem.registrationDate) {
    achievementSystem.setRegistrationDate();
  }

  // 检查成就（真实统计，替代硬编码 0）
  AchievementsUI.checkNewAchievements(await buildAchievementStats());

  // 注册 Service Worker 并监听新版本
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('service-worker.js')
      .then((registration) => {
        console.log('ServiceWorker registered:', registration.scope);
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              showToast('新版本已就绪，刷新后生效');
            }
          });
        });
      })
      .catch((error) => {
        console.log('ServiceWorker registration failed:', error);
      });
  }
});
