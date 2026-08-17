const Storage = {
  KEY_PLAN: 'fittrack_plan',
  KEY_LOGS: 'fittrack_logs',

  getPlan() {
    const data = localStorage.getItem(this.KEY_PLAN);
    return data ? JSON.parse(data) : null;
  },

  savePlan(plan) {
    localStorage.setItem(this.KEY_PLAN, JSON.stringify(plan));
  },

  getLogs() {
    const data = localStorage.getItem(this.KEY_LOGS);
    return data ? JSON.parse(data) : [];
  },

  saveLog(log) {
    const logs = this.getLogs();
    logs.unshift(log);
    localStorage.setItem(this.KEY_LOGS, JSON.stringify(logs));
  },

  getAllExerciseNames() {
    const names = new Set();
    const plan = this.getPlan();
    if (plan) {
      plan.planDays.forEach((day) =>
        day.exercises.forEach((ex) => names.add(ex.name))
      );
    }
    this.getLogs().forEach((log) =>
      log.exercises.forEach((ex) => names.add(ex.name))
    );
    return [...names];
  },
};

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateTime(iso) {
  const d = new Date(iso);
  return `${formatDate(iso)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
