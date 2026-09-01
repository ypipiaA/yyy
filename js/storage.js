/* ---- 通用工具 ---- */

/**
 * HTML 转义（XSS 基线）：所有插入 innerHTML 的动态字符串必须先经过本函数。
 * 非字符串（数字等）原样返回。
 */
function escapeHtml(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
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

/** 本地日期 → date 输入框格式（YYYY-MM-DD） */
function toDateInputValue(d = new Date()) {
  return formatDate(d.toISOString());
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

const Storage = {
  KEY_PLAN: 'fittrack_plan',
  KEY_LOGS: 'fittrack_logs',
  KEY_BODY: 'fittrack_body',
  KEY_PROFILE: 'fittrack_profile',

  BACKUP_VERSION: 3,

  /**
   * 备份版本迁移表（GAP-9 占位）：key 为源版本，迁移到 key+1。
   * 2→3：新增 nutrition/achievements 段，旧备份缺段导入时跳过即可（空迁移）。
   */
  MIGRATIONS: {
    1: (data) => data,
    2: (data) => data,
  },

  /* ---- 内存缓存：_get 结果按 key 缓存，写入/删除时写穿或失效 ---- */
  _cache: {},

  _get(key, fallback) {
    if (Object.prototype.hasOwnProperty.call(this._cache, key)) {
      return this._cache[key];
    }
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      const value = JSON.parse(raw);
      this._cache[key] = value;
      return value;
    } catch (e) {
      return fallback;
    }
  },

  _set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this._cache[key] = value;
      return true;
    } catch (e) {
      delete this._cache[key];
      console.error('写入本地存储失败:', e);
      if (typeof showToast === 'function') {
        showToast('存储空间不足，数据未保存');
      }
      return false;
    }
  },

  _remove(key) {
    delete this._cache[key];
    localStorage.removeItem(key);
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
          await API.plans.update(existingPlan.id, plan);
        } else {
          await API.plans.create(plan);
        }
      } catch (e) {
        console.error('保存计划失败:', e);
        showToast('后端同步失败，数据已保存在本地');
      }
    }
    this._set(this.KEY_PLAN, plan);
  },

  clearPlan() {
    this._remove(this.KEY_PLAN);
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
        // 回填后端 id，保证后续 deleteLog 能同步删除后端记录
        const created = await API.workouts.create(log);
        if (created && created.id) log.id = created.id;
      } catch (e) {
        console.error('保存训练记录失败:', e);
        showToast('后端同步失败，数据已保存在本地');
      }
    }
    const logs = this._get(this.KEY_LOGS, []);
    logs.unshift(log);
    // 支持补录过去日期：按日期降序排列，历史列表与删除索引保持一致
    logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    this._set(this.KEY_LOGS, logs);
  },

  async deleteLog(index) {
    const logs = this._get(this.KEY_LOGS, []);
    const log = logs[index];
    if (API.USE_API && log) {
      if (log.id) {
        try {
          await API.workouts.delete(log.id);
        } catch (e) {
          console.error('删除训练记录失败:', e);
          showToast('后端同步失败，仅删除了本地记录');
        }
      } else {
        console.warn('本地训练记录缺少后端 id，仅删除本地条目');
      }
    }
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
        // 回填后端 id，保证后续 deleteBodyRecord 能同步删除后端记录
        const created = await API.body.create(record);
        if (created && created.id) record.id = created.id;
      } catch (e) {
        console.error('保存身体记录失败:', e);
        showToast('后端同步失败，数据已保存在本地');
      }
    }
    const records = this._get(this.KEY_BODY, []);
    records.push(record);
    records.sort((a, b) => a.date.localeCompare(b.date));
    this._set(this.KEY_BODY, records);
  },

  async deleteBodyRecord(index) {
    const records = this._get(this.KEY_BODY, []);
    const record = records[index];
    if (API.USE_API && record) {
      if (record.id) {
        try {
          await API.body.delete(record.id);
        } catch (e) {
          console.error('删除身体记录失败:', e);
          showToast('后端同步失败，仅删除了本地记录');
        }
      } else {
        console.warn('本地身体记录缺少后端 id，仅删除本地条目');
      }
    }
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
        showToast('后端同步失败，数据已保存在本地');
      }
    }
    this._set(this.KEY_PROFILE, profile);
  },

  /* ---- 查询辅助 ---- */
  async getAllExerciseNames() {
    const names = new Set();
    const plan = await this.getPlan();
    if (plan && Array.isArray(plan.planDays)) {
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
    return findExerciseLastRecord(logs, name);
  },

  /* ---- 导出 / 导入 / 清空 ---- */
  async exportAll() {
    const [plan, logs, bodyRecords, profile] = await Promise.all([
      this.getPlan(),
      this.getLogs(),
      this.getBodyRecords(),
      this.getProfile(),
    ]);
    return {
      app: 'fittrack',
      version: this.BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        plan,
        logs,
        bodyRecords,
        profile,
        nutrition:
          typeof nutritionTracker !== 'undefined'
            ? nutritionTracker.exportData()
            : undefined,
        achievements:
          typeof achievementSystem !== 'undefined'
            ? achievementSystem.exportData()
            : undefined,
      },
    };
  },

  /**
   * 导入备份。返回 { success, skipped }：
   * success 表示至少成功导入了一段数据；skipped 为被跳过的段名列表。
   * 兼容 version 2 / 无版本的旧备份（缺失的 nutrition/achievements 段直接跳过）。
   */
  async importAll(json) {
    const result = { success: false, skipped: [] };
    if (!json || typeof json !== 'object') return result;
    let data = json.data || json;
    if (!data || typeof data !== 'object') return result;

    const version = Number(json.version) || 1;
    for (let v = version; v < this.BACKUP_VERSION; v++) {
      const migrate = this.MIGRATIONS[v];
      if (migrate) data = migrate(data) || data;
    }

    // 计划：必须有 planDays 数组，否则跳过（自愈 BUG-1 产生的坏备份）
    if (data.plan !== undefined && data.plan !== null) {
      if (data.plan && typeof data.plan === 'object' && Array.isArray(data.plan.planDays)) {
        await this.savePlan(data.plan);
        result.success = true;
      } else {
        result.skipped.push('训练计划');
      }
    }

    // 训练记录：逐条校验必备字段，非法条目丢弃
    if (data.logs !== undefined) {
      if (Array.isArray(data.logs)) {
        const valid = data.logs.filter(
          (l) => l && typeof l === 'object' && l.date && Array.isArray(l.exercises)
        );
        if (valid.length < data.logs.length) result.skipped.push('部分训练记录');
        await this.replaceLogs(valid);
        result.success = true;
      } else {
        result.skipped.push('训练记录');
      }
    }

    // 身体记录：逐条校验 date/weight
    if (data.bodyRecords !== undefined) {
      if (Array.isArray(data.bodyRecords)) {
        const valid = data.bodyRecords.filter(
          (r) => r && typeof r === 'object' && r.date && typeof r.weight === 'number'
        );
        if (valid.length < data.bodyRecords.length) result.skipped.push('部分身体记录');
        await this.replaceBodyRecords(valid);
        result.success = true;
      } else {
        result.skipped.push('身体记录');
      }
    }

    if (data.profile !== undefined && data.profile !== null) {
      if (typeof data.profile === 'object') {
        await this.saveProfile(data.profile);
        result.success = true;
      } else {
        result.skipped.push('个人资料');
      }
    }

    if (data.nutrition !== undefined && typeof nutritionTracker !== 'undefined') {
      if (nutritionTracker.importData(data.nutrition)) {
        result.success = true;
      } else {
        result.skipped.push('营养数据');
      }
    }

    if (data.achievements !== undefined && typeof achievementSystem !== 'undefined') {
      if (achievementSystem.importData(data.achievements)) {
        result.success = true;
      } else {
        result.skipped.push('成就数据');
      }
    }

    return result;
  },

  clearAll() {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('fittrack_'))
      .forEach((k) => localStorage.removeItem(k));
    this._cache = {};
  },
};

/**
 * 在给定 logs 中查找某动作最近一次的有效记录（纯函数，供批量渲染复用，
 * 避免每个动作各自读盘）。
 */
function findExerciseLastRecord(logs, name) {
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
}
