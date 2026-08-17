const Stats = {
  weeklyChart: null,
  progressChart: null,

  init() {
    this.exerciseSelect = document.getElementById('chart-exercise');
    this.exerciseSelect.addEventListener('change', () => this.renderProgressChart());
  },

  refresh() {
    this.updateSummary();
    this.renderWeeklyChart();
    this.updateExerciseSelect();
    this.renderProgressChart();
  },

  updateSummary() {
    const logs = Storage.getLogs();
    const now = new Date();
    const weekStart = getWeekStart(now);

    document.getElementById('stat-total').textContent = logs.length;

    const weekCount = logs.filter((log) => new Date(log.date) >= weekStart).length;
    document.getElementById('stat-week').textContent = weekCount;

    document.getElementById('stat-streak').textContent = this.calcStreak(logs);

    let totalVolume = 0;
    logs.forEach((log) => {
      log.exercises.forEach((ex) => {
        ex.sets.forEach((set) => {
          if (set.done && set.weight && set.reps) {
            totalVolume += set.weight * set.reps;
          }
        });
      });
    });
    document.getElementById('stat-volume').textContent = totalVolume.toLocaleString();
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

  renderWeeklyChart() {
    const logs = Storage.getLogs();
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
            backgroundColor: 'rgba(34, 197, 94, 0.7)',
            borderColor: '#22c55e',
            borderWidth: 1,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: '#8b9cb3' },
            grid: { color: '#2d3a4f' },
          },
          x: {
            ticks: { color: '#8b9cb3' },
            grid: { display: false },
          },
        },
      },
    });
  },

  updateExerciseSelect() {
    const names = Storage.getAllExerciseNames();
    const current = this.exerciseSelect.value;
    this.exerciseSelect.innerHTML = names
      .map((n) => `<option value="${n}">${n}</option>`)
      .join('');
    if (names.includes(current)) {
      this.exerciseSelect.value = current;
    }
  },

  renderProgressChart() {
    const exerciseName = this.exerciseSelect.value;
    if (!exerciseName) return;

    const logs = Storage.getLogs().slice().reverse();
    const labels = [];
    const maxWeights = [];

    logs.forEach((log) => {
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
            ticks: { color: '#8b9cb3' },
            grid: { color: '#2d3a4f' },
          },
          x: {
            ticks: { color: '#8b9cb3', maxRotation: 45 },
            grid: { display: false },
          },
        },
      },
    });
  },
};
