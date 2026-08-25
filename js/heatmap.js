/**
 * 训练日历热力图（GitHub 风格）——工作包 C 新增
 *
 * 纯 DOM/CSS Grid 实现，不依赖 Chart.js。
 * 数据完全由 fittrack_logs 派生（由 Stats.refresh 传入，不自行读盘），无新 localStorage key。
 * 渲染最近 26 周（7 行 × 26 列），周一为首行（与 getWeekStart 口径一致）。
 */
const Heatmap = {
  WEEKS: 26,

  /** 每日完成组数 → 等级（0-4） */
  levelFor(count) {
    if (count <= 0) return 0;
    if (count <= 5) return 1;
    if (count <= 12) return 2;
    if (count <= 20) return 3;
    return 4;
  },

  /** 按本地日期聚合每日完成组数：{ 'YYYY-MM-DD': setCount } */
  aggregate(logs) {
    const byDay = {};
    (logs || []).forEach((log) => {
      if (!log || !log.date || !Array.isArray(log.exercises)) return;
      const day = formatDate(log.date);
      let done = 0;
      log.exercises.forEach((ex) => {
        if (!ex || !Array.isArray(ex.sets)) return;
        done += ex.sets.filter((s) => s && s.done).length;
      });
      byDay[day] = (byDay[day] || 0) + done;
    });
    return byDay;
  },

  /**
   * 渲染热力图。logs 由调用方（Stats.refresh）传入。
   */
  render(logs) {
    const container = document.getElementById('workout-heatmap');
    if (!container) return;

    const byDay = this.aggregate(logs);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentWeekStart = getWeekStart(today);

    const grid = document.createElement('div');
    grid.className = 'heatmap-grid';
    grid.setAttribute('role', 'img');
    grid.setAttribute('aria-label', `最近 ${this.WEEKS} 周训练日历热力图`);

    // 按列（周）填充：grid-auto-flow: column，每列 7 天，周一在首行
    for (let w = 0; w < this.WEEKS; w++) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(weekStart.getDate() - (this.WEEKS - 1 - w) * 7);
      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(weekStart);
        cellDate.setDate(cellDate.getDate() + d);

        const cell = document.createElement('span');
        cell.className = 'hm-cell';
        if (cellDate > today) {
          // 未来日期：占位保持网格对齐，但不显示
          cell.classList.add('hm-future');
          cell.setAttribute('aria-hidden', 'true');
        } else {
          const key = formatDate(cellDate);
          const count = byDay[key] || 0;
          const label = `${key} · ${count} 组`;
          cell.dataset.level = String(this.levelFor(count));
          // 日期/数字为程序生成的安全字符串，仍统一走属性赋值（非 innerHTML）
          cell.title = label;
          cell.setAttribute('aria-label', label);
        }
        grid.appendChild(cell);
      }
    }

    container.textContent = '';
    container.appendChild(grid);
    // 初始滚动到最右（最近一周）
    container.scrollLeft = container.scrollWidth;
  },
};
