const Stats = {
  weeklyChart: null,
  progressChart: null,
  muscleChart: null,
  MUSCLE_COLORS: ['#16a34a', '#3b82f6', '#d97706', '#dc2626', '#8b5cf6', '#0891b2', '#ec4899', '#84cc16', '#64748b', '#f59e0b'],

  init() {
    this.exerciseSelect = document.getElementById('chart-exercise');
    this.exerciseSelect.addEventListener('change', () => this.renderProgressChart());
  },

  async refresh() {
    // 一次取出全部 logs 传递各子方法（避免重复读取），并驱动热力图/PR 摘要
    const logs = await Storage.getLogs();
    await this.updateSummary(logs);
    Heatmap.render(logs); // 集成点（§3.1）：训练日历热力图
    await this.renderWeeklyChart(logs);
    await this.renderMuscleChart(logs);
    await this.updateExerciseSelect();
    await this.renderProgressChart(logs);
  },

  async updateSummary(logs) {
    if (!logs) logs = await Storage.getLogs();
    const now = new Date();
    const weekStart = getWeekStart(now);

    document.getElementById('stat-total').textContent = logs.length;

    const weekCount = logs.filter((log) => new Date(log.date) >= weekStart).length;
    document.getElementById('stat-week').textContent = weekCount;

    document.getElementById('stat-streak').textContent = this.calcStreak(logs);

    let totalVolume = 0;
    let totalSets = 0;
    let totalDuration = 0;
    logs.forEach((log) => {
      if (log.duration) totalDuration += log.duration;
      log.exercises.forEach((ex) => {
        ex.sets.forEach((set) => {
          if (set.done) {
            totalSets++;
            if (set.weight && set.reps) {
              totalVolume += set.weight * set.reps;
            }
          }
        });
      });
    });
    document.getElementById('stat-volume').textContent = totalVolume.toLocaleString();
    document.getElementById('stat-sets').textContent = totalSets.toLocaleString();
    document.getElementById('stat-duration').textContent = formatDuration(totalDuration);
  },

  calcStreak(logs) {
    if (logs.length === 0) return 0;

    const dates = [...new Set(logs.map((l) => formatDate(l.date)))].sort().reverse();
    const today = formatDate(new Date());
    const yesterday = formatDate(new Date(Date.now() - 86400000));

    if (dates[0] !== today && dates[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diff = (prev - curr) / 86400000;
      if (diff <= 1.5) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  },

  async renderWeeklyChart(logs) {
    if (!logs) logs = await Storage.getLogs();
    const weeks = [];
    const counts = [];

    for (let i = 3; i >= 0; i--) {
      const start = getWeekStart(new Date(Date.now() - i * 7 * 86400000));
      const end = new Date(start);
      end.setDate(end.getDate() + 7);

      const label = `${start.getMonth() + 1}/${start.getDate()}`;
      weeks.push(label);

      const count = logs.filter((log) => {
        const d = new Date(log.date);
        return d >= start && d < end;
      }).length;
      counts.push(count);
    }

    const ctx = document.getElementById('chart-weekly');
    if (this.weeklyChart) this.weeklyChart.destroy();

    this.weeklyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: weeks,
        datasets: [
          {
            label: '训练次数',
            data: counts,
            backgroundColor: 'rgba(22, 163, 74, 0.75)',
            borderColor: '#16a34a',
            borderWidth: 1,
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: '#64748b' },
            grid: { color: '#eef1f6' },
          },
          x: {
            ticks: { color: '#64748b' },
            grid: { display: false },
          },
        },
      },
    });
  },

  async renderMuscleChart(logs) {
    if (!logs) logs = await Storage.getLogs();
    const muscleCount = {};

    logs.forEach((log) => {
      log.exercises.forEach((ex) => {
        const done = ex.sets.filter((s) => s.done).length;
        if (done > 0) {
          muscleCount[ex.muscle] = (muscleCount[ex.muscle] || 0) + done;
        }
      });
    });

    const labels = Object.keys(muscleCount);
    const values = Object.values(muscleCount);
    const ctx = document.getElementById('chart-muscle');
    if (this.muscleChart) this.muscleChart.destroy();

    if (labels.length === 0) {
      ctx.style.display = 'none';
      let empty = ctx.parentElement.querySelector('.chart-empty');
      if (!empty) {
        empty = document.createElement('p');
        empty.className = 'chart-empty';
        empty.textContent = '暂无训练数据';
        ctx.parentElement.appendChild(empty);
      }
      return;
    }
    ctx.style.display = '';
    const empty = ctx.parentElement.querySelector('.chart-empty');
    if (empty) empty.remove();

    this.muscleChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: this.MUSCLE_COLORS,
            borderWidth: 3,
            borderColor: '#ffffff',
          },
        ],
      },
      options: {
        responsive: true,
        cutout: '62%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#475569', usePointStyle: true, padding: 12, boxWidth: 8 },
          },
        },
      },
    });
  },

  async updateExerciseSelect() {
    const names = await Storage.getAllExerciseNames();
    const current = this.exerciseSelect.value;
    this.exerciseSelect.innerHTML = names
      .map((n) => `<option value="${n}">${n}</option>`)
      .join('');
    if (names.includes(current)) {
      this.exerciseSelect.value = current;
    }
  },

  async renderProgressChart(logs) {
    const exerciseName = this.exerciseSelect.value;
    if (!logs) logs = await Storage.getLogs();

    // 集成点（§3.2）：动作切换/统计刷新时渲染当前动作的 PR 摘要
    Records.renderSummary(exerciseName, logs);

    if (!exerciseName) return;

    const ordered = logs.slice().reverse();
    const labels = [];
    const maxWeights = [];

    ordered.forEach((log) => {
      const ex = log.exercises.find((e) => e.name === exerciseName);
      if (!ex) return;

      const doneSets = ex.sets.filter((s) => s.done && s.weight > 0);
      if (doneSets.length === 0) return;

      const maxWeight = Math.max(...doneSets.map((s) => s.weight));
      labels.push(formatDate(log.date));
      maxWeights.push(maxWeight);
    });

    const ctx = document.getElementById('chart-progress');
    if (this.progressChart) this.progressChart.destroy();

    this.progressChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: '最大重量 (kg)',
            data: maxWeights,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: '#3b82f6',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: false,
            ticks: { color: '#64748b' },
            grid: { color: '#eef1f6' },
          },
          x: {
            ticks: { color: '#64748b', maxRotation: 45 },
            grid: { display: false },
          },
        },
      },
    });
  },
};
