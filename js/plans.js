/** 每天动作数（v3.2：移除经验水平后统一取原"中级"档） */
const DEFAULT_EXERCISE_COUNT = 5;

function generatePlan(goal, days) {
  const config = GOAL_CONFIG[goal];
  const template = SPLIT_TEMPLATES[days];

  const planDays = template.map((day) => {
    const exercises = [];

    day.groups.forEach((group) => {
      const pool = EXERCISES[group];
      const count = Math.ceil(DEFAULT_EXERCISE_COUNT / day.groups.length);
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      shuffled.slice(0, count).forEach((ex) => {
        exercises.push({
          name: ex.name,
          muscle: ex.muscle,
          equipment: ex.equipment,
          sets: config.sets,
          reps: config.reps,
          rest: config.rest,
        });
      });
    });

    return {
      name: day.name,
      focus: day.focus,
      exercises: exercises.slice(0, DEFAULT_EXERCISE_COUNT),
    };
  });

  return {
    goal,
    goalLabel: config.label,
    days: parseInt(days),
    createdAt: new Date().toISOString(),
    planDays,
  };
}

/**
 * 渲染单个训练日卡片（renderPlan / renderSavedPlan 共用）。
 * XSS 基线：所有动态插值字段一律经 escapeHtml。
 */
function renderPlanDayHtml(day, index) {
  const rest = day.exercises[0] ? Number(day.exercises[0].rest) || 0 : 0;
  return `
    <div class="plan-day">
      <div class="plan-day-header">
        <span class="plan-day-chip">${index + 1}</span>
        <div class="plan-day-titles">
          <span class="plan-day-name">${escapeHtml(day.name)}</span>
          <span class="plan-day-focus">${escapeHtml(day.focus)}</span>
        </div>
        <span class="plan-day-count">${day.exercises.length} 个动作</span>
      </div>
      <ul class="plan-exercises">
        ${day.exercises
          .map(
            (ex) => `
          <li>
            <span class="ex-name">${escapeHtml(ex.name)}</span>
            <span class="ex-tag">${escapeHtml(ex.muscle)}</span>
            ${ex.equipment ? `<span class="ex-tag ex-tag-equipment">${escapeHtml(ex.equipment)}</span>` : ''}
            <span class="ex-spec">${Number(ex.sets)}组 × ${escapeHtml(String(ex.reps))}次</span>
          </li>`
          )
          .join('')}
      </ul>
      <div class="plan-day-footer"><span class="plan-rest-pill">⏱ 组间休息 ${rest} 秒</span></div>
    </div>`;
}

function renderPlan(plan, container) {
  container.innerHTML = plan.planDays
    .map((day, i) => renderPlanDayHtml(day, i))
    .join('');
}

function renderSavedPlan(plan, container) {
  container.innerHTML = `
    <div class="plan-meta">
      <span class="badge">${escapeHtml(plan.goalLabel)}</span>
      <span class="badge">每周 ${Number(plan.days)} 天</span>
    </div>
    <div class="plan-days">
      ${plan.planDays.map((day, i) => renderPlanDayHtml(day, i)).join('')}
    </div>`;
}
