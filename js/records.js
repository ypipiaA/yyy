/**
 * 1RM 计算器 + PR（个人纪录）追踪——工作包 C 新增
 *
 * PR 一律从 fittrack_logs 派生（logs 是唯一事实源）；
 * fittrack_prs 仅为加速与"是否新 PR"比对的缓存键，可随时通过 rebuild(logs) 全量重建。
 * 导入数据、删除记录后必须调用 rebuild（集成点在 settings.js / app.js）。
 */
const Records = {
  KEY_PRS: 'fittrack_prs',

  /* ---------- 公式 ---------- */

  /**
   * Epley 公式：1RM = weight × (1 + reps/30)；reps === 1 直接取 weight。
   * reps > 12 时仍计算，但 UI 标注"估算精度有限"。
   */
  epley1RM(weight, reps) {
    const w = Number(weight);
    const r = Number(reps);
    if (!(w > 0) || !(r > 0)) return 0;
    if (r === 1) return w;
    return w * (1 + r / 30);
  },

  round1(n) {
    return Math.round(n * 10) / 10;
  },

  /* ---------- 缓存读写 ---------- */

  getAll() {
    try {
      const raw = localStorage.getItem(this.KEY_PRS);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      return {};
    }
  },

  getPR(name) {
    const all = this.getAll();
    return Object.prototype.hasOwnProperty.call(all, name) ? all[name] : null;
  },

  _write(prs) {
    try {
      localStorage.setItem(this.KEY_PRS, JSON.stringify(prs));
    } catch (e) {
      console.error('写入 PR 缓存失败:', e);
    }
  },

  /* ---------- 派生计算 ---------- */

  /**
   * 从 logs 全量计算 PR 映射：
   * { 动作名: { bestWeight, best1RM, bestVolumeSet: {weight, reps}, date } }
   * date 语义：最近一次刷新任一纪录（最大重量或估算 1RM）的日期。
   * 使用 Object.create(null) 承载用户可控键名（动作名可能为 __proto__ 等）。
   */
  computeAll(logs) {
    const prs = Object.create(null);
    (logs || []).forEach((log) => {
      if (!log || !Array.isArray(log.exercises)) return;
      const day = log.date ? formatDate(log.date) : '';
      log.exercises.forEach((ex) => {
        if (!ex || !ex.name || !Array.isArray(ex.sets)) return;
        ex.sets.forEach((set) => {
          if (!set || !set.done) return;
          const weight = Number(set.weight);
          const reps = Number(set.reps);
          if (!(weight > 0) || !(reps > 0)) return;

          const orm = this.round1(this.epley1RM(weight, reps));
          const entry = prs[ex.name];
          if (!entry) {
            prs[ex.name] = {
              bestWeight: weight,
              best1RM: orm,
              bestVolumeSet: { weight, reps },
              date: day,
            };
            return;
          }
          if (weight > entry.bestWeight) {
            entry.bestWeight = weight;
            entry.date = day;
          }
          if (orm > entry.best1RM) {
            entry.best1RM = orm;
            entry.date = day;
          }
          if (
            weight * reps >
            entry.bestVolumeSet.weight * entry.bestVolumeSet.reps
          ) {
            entry.bestVolumeSet = { weight, reps };
          }
        });
      });
    });
    return prs;
  },

  /** 全量重算并覆写缓存键（导入数据、删除记录后必须调用） */
  rebuild(logs) {
    this._write(this.computeAll(logs));
  },

  /**
   * 完成训练时调用：与缓存比对，破纪录时合并 toast 提示，随后 rebuild。
   * 仅对已有历史纪录的动作提示（首次出现的动作不算"破"纪录）。
   */
  async checkNewPRs(log) {
    const cached = this.getAll();
    const messages = [];

    if (log && Array.isArray(log.exercises)) {
      log.exercises.forEach((ex) => {
        if (!ex || !ex.name || !Array.isArray(ex.sets)) return;
        // hasOwnProperty 防护：动作名可能命中原型链成员（如 __proto__）
        const prev = Object.prototype.hasOwnProperty.call(cached, ex.name)
          ? cached[ex.name]
          : null;
        if (!prev) return;

        let bestNewWeight = 0;
        let bestNew1RM = 0;
        ex.sets.forEach((set) => {
          if (!set || !set.done) return;
          const weight = Number(set.weight);
          const reps = Number(set.reps);
          if (!(weight > 0) || !(reps > 0)) return;
          if (weight > bestNewWeight) bestNewWeight = weight;
          const orm = this.round1(this.epley1RM(weight, reps));
          if (orm > bestNew1RM) bestNew1RM = orm;
        });

        if (bestNewWeight > prev.bestWeight) {
          messages.push(`${ex.name} ${bestNewWeight}kg`);
        } else if (bestNew1RM > prev.best1RM) {
          messages.push(`${ex.name} 估算1RM ${bestNew1RM}kg`);
        }
      });
    }

    if (messages.length > 0) {
      showToast(`🎉 新纪录：${messages.join('、')}`);
    }

    const logs = await Storage.getLogs();
    this.rebuild(logs);
    return messages;
  },

  /* ---------- 统计页 PR 摘要 ---------- */

  /**
   * 渲染 #pr-summary：当前所选动作的 最大重量 / 估算1RM / 创造日期。
   * 缓存缺失时从传入 logs 现算（自愈，不依赖缓存正确性）。
   */
  renderSummary(exerciseName, logs) {
    const box = document.getElementById('pr-summary');
    if (!box) return;
    box.textContent = '';
    if (!exerciseName) return;

    let pr = this.getPR(exerciseName);
    if (!pr && Array.isArray(logs)) {
      pr = this.computeAll(logs)[exerciseName] || null;
    }
    if (!pr) return;

    const items = [
      ['最大重量', `${Number(pr.bestWeight)} kg`],
      ['估算 1RM', `${Number(pr.best1RM)} kg`],
      ['创造日期', String(pr.date || '--')],
    ];
    items.forEach(([label, value]) => {
      const item = document.createElement('div');
      item.className = 'pr-item';
      const v = document.createElement('span');
      v.className = 'pr-value';
      v.textContent = value; // textContent，天然免疫 XSS
      const l = document.createElement('span');
      l.className = 'pr-label';
      l.textContent = label;
      item.appendChild(v);
      item.appendChild(l);
      box.appendChild(item);
    });
  },

  /* ---------- 1RM 计算器 ---------- */

  initCalculator() {
    const form = document.getElementById('orm-form');
    const result = document.getElementById('orm-result');
    if (!form || !result) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const weight = parseFloat(document.getElementById('orm-weight').value);
      const reps = parseInt(document.getElementById('orm-reps').value, 10);
      result.textContent = '';

      if (!(weight > 0) || !(reps > 0)) {
        showToast('请输入有效的重量与次数');
        return;
      }

      const orm = this.round1(this.epley1RM(weight, reps));

      const head = document.createElement('div');
      head.className = 'orm-headline';
      head.textContent = `估算 1RM：${orm} kg`;
      result.appendChild(head);

      if (reps > 12) {
        const note = document.createElement('div');
        note.className = 'orm-note';
        note.textContent = '次数大于 12 时估算精度有限，仅供参考';
        result.appendChild(note);
      }

      // 强度对照小表（纯 DOM）
      const table = document.createElement('table');
      table.className = 'orm-table';
      const thead = document.createElement('thead');
      const headRow = document.createElement('tr');
      ['强度', '重量 (kg)'].forEach((t) => {
        const th = document.createElement('th');
        th.textContent = t;
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      [95, 90, 85, 80, 75, 70].forEach((pct) => {
        const tr = document.createElement('tr');
        const td1 = document.createElement('td');
        td1.textContent = `${pct}%`;
        const td2 = document.createElement('td');
        td2.textContent = String(this.round1((orm * pct) / 100));
        tr.appendChild(td1);
        tr.appendChild(td2);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      result.appendChild(table);
    });
  },
};
