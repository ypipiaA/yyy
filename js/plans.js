function levelLabel(level) {
  return level === 'beginner' ? '新手' : level === 'intermediate' ? '中级' : '高级';
}

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
    .map((day) => {
      const rest = day.exercises[0] ? day.exercises[0].rest : 0;
      return `
    <div class="plan-day">
      <div class="plan-day-header">
        <span class="plan-day-name">${day.name}</span>
        <span class="plan-day-focus">${day.focus}</span>
      </div>
      <ul class="plan-exercises">
        ${day.exercises
          .map(
            (ex) => `
          <li>
            <span class="ex-name">${ex.name}</span>
            <span class="ex-tag">${ex.muscle}</span>
            <span class="ex-tag ex-tag-equipment">${ex.equipment}</span>
            <span class="ex-spec">${ex.sets}组 × ${ex.reps}次</span>
          </li>`
          )
          .join('')}
      </ul>
      <div class="plan-rest">组间休息 ${rest} 秒</div>
    </div>
  `;
    })
    .join('');
}

function renderSavedPlan(plan, container) {
  container.innerHTML = `
    <div class="plan-meta">
      <span class="badge">${plan.goalLabel}</span>
      <span class="badge">每周 ${plan.days} 天</span>
      <span class="badge">${levelLabel(plan.level)}</span>
    </div>
    ${plan.planDays
      .map((day) => {
        const rest = day.exercises[0] ? day.exercises[0].rest : 0;
        return `
      <div class="plan-day" style="margin-bottom: 0.5rem;">
        <div class="plan-day-header">
          <span class="plan-day-name">${day.name}</span>
          <span class="plan-day-focus">${day.focus}</span>
        </div>
        <ul class="plan-exercises">
          ${day.exercises
            .map(
              (ex) => `
            <li>
              <span class="ex-name">${ex.name}</span>
              <span class="ex-tag">${ex.muscle}</span>
              <span class="ex-spec">${ex.sets}组 × ${ex.reps}次</span>
            </li>`
            )
            .join('')}
        </ul>
        <div class="plan-rest">组间休息 ${rest} 秒</div>
      </div>
    `;
      })
      .join('')}
  `;
}
