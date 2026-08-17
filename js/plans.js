function generatePlan(goal, days, level) {
  const config = GOAL_CONFIG[goal];
  const template = SPLIT_TEMPLATES[days];
  const exerciseCount = LEVEL_EXERCISE_COUNT[level];

  const planDays = template.map((day) => {
    const exercises = [];

    day.groups.forEach((group) => {
      const pool = EXERCISES[group];
      const count = Math.ceil(exerciseCount / day.groups.length);
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
      exercises: exercises.slice(0, exerciseCount),
    };
  });

  return {
    goal,
    goalLabel: config.label,
    days: parseInt(days),
    level,
    createdAt: new Date().toISOString(),
    planDays,
  };
}

function renderPlan(plan, container) {
  container.innerHTML = plan.planDays
    .map(
      (day) => `
    <div class="plan-day">
      <div class="plan-day-header">
        <span class="plan-day-name">${day.name}</span>
        <span class="plan-day-focus">${day.focus}</span>
      </div>
      <ul class="plan-exercises">
        ${day.exercises
          .map(
            (ex) =>
              `<li>${ex.name} — ${ex.sets}组 × ${ex.reps}次 (${ex.muscle})</li>`
          )
          .join('')}
      </ul>
    </div>
  `
    )
    .join('');
}

function renderSavedPlan(plan, container) {
  container.innerHTML = `
    <p style="color: var(--text-muted); margin-bottom: 0.75rem; font-size: 0.85rem;">
      ${plan.goalLabel} · 每周 ${plan.days} 天 · ${plan.level === 'beginner' ? '新手' : plan.level === 'intermediate' ? '中级' : '高级'}
    </p>
    ${plan.planDays
      .map(
        (day) => `
      <div class="plan-day" style="margin-bottom: 0.5rem;">
        <div class="plan-day-header">
          <span class="plan-day-name">${day.name}</span>
          <span class="plan-day-focus">${day.focus}</span>
        </div>
      </div>
    `
      )
      .join('')}
  `;
}
