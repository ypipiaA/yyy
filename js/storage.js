const Storage = {
  KEY_PLAN: 'fittrack_plan',
  KEY_LOGS: 'fittrack_logs',
  KEY_BODY: 'fittrack_body',
  KEY_PROFILE: 'fittrack_profile',

  _get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  },

  _set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  /* ---- 训练计划 ---- */
  async getPlan() {
    if (API.USE_API) {
      try {
        const plans = await API.plans.getAll();
        return plans && plans.length > 0 ? plans[0] : null;
      } catch (e) {
        console.error('获取计划失败:', e);
        return this._get(this.KEY_PLAN, null);
      }
    }
    return this._get(this.KEY_PLAN, null);
  },

  async savePlan(plan) {
    if (API.USE_API) {
      try {
        const existingPlan = await this.getPlan();
        if (existingPlan && existingPlan.id) {
          await API.plans.activate(existingPlan.id);
        } else {
          await API.plans.create(plan);
        }
      } catch (e) {
        console.error('保存计划失败:', e);
      }
    }
    this._set(this.KEY_PLAN, plan);
  },

  /* ---- 训练记录 ---- */
  async getLogs() {
    if (API.USE_API) {
      try {
        return await API.workouts.getAll();
      } catch (e) {
        console.error('获取训练记录失败:', e);
        return this._get(this.KEY_LOGS, []);
      }
    }
    return this._get(this.KEY_LOGS, []);
  },

  async saveLog(log) {
    if (API.USE_API) {
      try {
        await API.workouts.create(log);
      } catch (e) {
        console.error('保存训练记录失败:', e);
      }
    }
    const logs = this._get(this.KEY_LOGS, []);
    logs.unshift(log);
    this._set(this.KEY_LOGS, logs);
  },

  async deleteLog(index) {
    const logs = this._get(this.KEY_LOGS, []);
    logs.splice(index, 1);
    this._set(this.KEY_LOGS, logs);
  },

  async replaceLogs(logs) {
    this._set(this.KEY_LOGS, logs);
  },

  /* ---- 身体记录 ---- */
  async getBodyRecords() {
    if (API.USE_API) {
      try {
        return await API.body.getAll();
      } catch (e) {
        console.error('获取身体记录失败:', e);
        return this._get(this.KEY_BODY, []);
      }
    }
    return this._get(this.KEY_BODY, []);
  },

  async addBodyRecord(record) {
    if (API.USE_API) {
      try {
        await API.body.create(record);
      } catch (e) {
        console.error('保存身体记录失败:', e);
      }
    }
    const records = this._get(this.KEY_BODY, []);
    records.push(record);
    records.sort((a, b) => a.date.localeCompare(b.date));
    this._set(this.KEY_BODY, records);
  },

  async deleteBodyRecord(index) {
    const records = this._get(this.KEY_BODY, []);
    records.splice(index, 1);
    this._set(this.KEY_BODY, records);
  },

  async replaceBodyRecords(records) {
    this._set(this.KEY_BODY, records);
  },

  /* ---- 个人资料 ---- */
  async getProfile() {
    if (API.USE_API) {
      try {
        return await API.settings.getProfile();
      } catch (e) {
        console.error('获取个人资料失败:', e);
        return this._get(this.KEY_PROFILE, { name: '', height: '' });
      }
    }
    return this._get(this.KEY_PROFILE, { name: '', height: '' });
  },

  async saveProfile(profile) {
    if (API.USE_API) {
      try {
        await API.settings.updateProfile(profile);
      } catch (e) {
        console.error('保存个人资料失败:', e);
      }
    }
    this._set(this.KEY_PROFILE, profile);
  },

  /* ---- 查询辅助 ---- */
  async getAllExerciseNames() {
    const names = new Set();
    const plan = await this.getPlan();
    if (plan) {
      plan.planDays.forEach((day) =>
        day.exercises.forEach((ex) => names.add(ex.name))
      );
    }
    const logs = await this.getLogs();
    logs.forEach((log) =>
      log.exercises.forEach((ex) => names.add(ex.name))
    );
    return [...names];
  },

  async getExerciseLastRecord(name) {
    const logs = await this.getLogs();
    for (const log of logs) {
      const ex = log.exercises.find((e) => e.name === name);
      if (!ex) continue;
      const doneSets = ex.sets.filter((s) => s.done && s.weight > 0 && s.reps > 0);
      if (doneSets.length === 0) continue;
      const bestSet = doneSets.reduce((a, b) =>
        a.weight * a.reps >= b.weight * b.reps ? a : b
      );
      const maxWeight = Math.max(...doneSets.map((s) => s.weight));
      return {
        maxWeight,
        bestWeight: bestSet.weight,
        bestReps: bestSet.reps,
        date: log.date,
      };
    }
    return null;
  },

  /* ---- 导出 / 导入 / 清空 ---- */
  exportAll() {
    return {
      app: 'fittrack',
      version: 2,
      exportedAt: new Date().toISOString(),
      data: {
        plan: this.getPlan(),
        logs: this.getLogs(),
        bodyRecords: this.getBodyRecords(),
        profile: this.getProfile(),
      },
    };
  },

  importAll(json) {
    const data = json.data || json;
    if (!data) return false;
    if (data.plan) this.savePlan(data.plan);
    if (Array.isArray(data.logs)) this.replaceLogs(data.logs);
    if (Array.isArray(data.bodyRecords)) this.replaceBodyRecords(data.bodyRecords);
    if (data.profile) this.saveProfile(data.profile);
    return true;
  },

  clearAll() {
    localStorage.removeItem(this.KEY_PLAN);
    localStorage.removeItem(this.KEY_LOGS);
    localStorage.removeItem(this.KEY_BODY);
    localStorage.removeItem(this.KEY_PROFILE);
  },
};

/* ---- 通用工具 ---- */
function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2500);
}

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateTime(iso) {
  const d = new Date(iso);
  return `${formatDate(iso)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}时${String(m).padStart(2, '0')}分`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
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
