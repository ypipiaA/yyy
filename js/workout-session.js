/**
 * 训练模式增强（引导界面 + 组间倒计时自动衔接）——工作包 C 新增（规格 §3.3）
 *
 * - #start-session：显式进入"进行中"状态并启动训练计时（优先于惰性启动）；
 *   未点开始就勾组时仍走 app.js 的惰性启动，并自动进入进行中状态。
 * - 进行中勾选任一 .set-done：底部 #rest-bar 弹出该动作 rest 秒数的倒计时，
 *   提供 +30s / 跳过；倒计时结束震动 + 闪烁 + toast。
 * - 最近一次勾选所在 .exercise-card 加 .active-exercise 高亮。
 * - rest-bar 倒计时为独立实现（简单 setInterval），不劫持 Timer 页签状态。
 * - 无新 localStorage key。
 */
const WorkoutSession = {
  active: false,
  restInterval: null,
  restRemaining: 0,
  _flashTimer: null,

  _exerciseList: null,
  _getPlan: null,
  _daySelect: null,

  /**
   * 集成点：app.js initWorkout 中 renderExercises 完成后调用。
   * 使用元素标记防止重复绑定（bind 会在每次 initWorkout 时被调用）。
   */
  bind(exerciseList, getPlan, daySelect) {
    this._exerciseList = exerciseList;
    this._getPlan = getPlan;
    this._daySelect = daySelect;

    const startBtn = document.getElementById('start-session');
    if (startBtn) {
      // 属性赋值防止多次 bind 造成监听器累积
      startBtn.onclick = () => {
        if (this.active) return;
        this.enterActive();
        startWorkoutTimer();
      };
    }

    // 与 app.js 的 exerciseList.onchange（惰性计时）并存：这里用 addEventListener，
    // 并以 dataset 标记保证只挂一次。
    if (!exerciseList.dataset.wsBound) {
      exerciseList.dataset.wsBound = '1';
      exerciseList.addEventListener('change', (e) => this._onSetChange(e));
    }

    this.updateProgress();
  },

  enterActive() {
    this.active = true;
    this.updateProgress();
  },

  _onSetChange(e) {
    if (!e.target.classList.contains('set-done')) return;

    // 未点"开始训练"就勾组：自动进入进行中状态（计时由 app.js 惰性启动）
    if (!this.active && e.target.checked) {
      this.enterActive();
    }
    if (!this.active) return;

    this.updateProgress();

    const card = e.target.closest('.exercise-card');
    if (e.target.checked && card) {
      this.highlight(card);
      this.startRest(this._restSecondsFor(card));
    }
  },

  /** 从计划数据读取当前动作的组间休息秒数，缺省 90 */
  _restSecondsFor(card) {
    try {
      const plan = this._getPlan ? this._getPlan() : null;
      const dayIndex = parseInt(this._daySelect ? this._daySelect.value : '0', 10) || 0;
      const exIndex = parseInt(card.dataset.exercise, 10) || 0;
      const ex =
        plan && Array.isArray(plan.planDays) && plan.planDays[dayIndex]
          ? plan.planDays[dayIndex].exercises[exIndex]
          : null;
      const rest = ex ? Number(ex.rest) : 0;
      return rest > 0 ? rest : 90;
    } catch (e) {
      return 90;
    }
  },

  highlight(card) {
    if (!this._exerciseList) return;
    this._exerciseList
      .querySelectorAll('.exercise-card.active-exercise')
      .forEach((c) => c.classList.remove('active-exercise'));
    card.classList.add('active-exercise');
  },

  /** 更新"开始训练"按钮文案：进行中 · 已完成 X/Y 组 */
  updateProgress() {
    const startBtn = document.getElementById('start-session');
    if (!startBtn) return;
    if (!this.active) {
      startBtn.textContent = '▶ 开始训练';
      startBtn.classList.remove('session-active');
      return;
    }
    const boxes = this._exerciseList
      ? this._exerciseList.querySelectorAll('.set-done')
      : [];
    let done = 0;
    boxes.forEach((b) => {
      if (b.checked) done++;
    });
    startBtn.textContent = `进行中 · 已完成 ${done}/${boxes.length} 组`;
    startBtn.classList.add('session-active');
  },

  /* ---------- 组间倒计时（rest-bar，独立于 Timer 页签） ---------- */

  startRest(seconds) {
    this.stopRest();
    this.restRemaining = seconds;
    this._renderRestBar(seconds);
    this.restInterval = setInterval(() => {
      this.restRemaining--;
      if (this.restRemaining <= 0) {
        this._finishRest();
      } else {
        this._updateRestText();
      }
    }, 1000);
  },

  stopRest() {
    if (this.restInterval) {
      clearInterval(this.restInterval);
      this.restInterval = null;
    }
    if (this._flashTimer) {
      clearTimeout(this._flashTimer);
      this._flashTimer = null;
    }
    const bar = document.getElementById('rest-bar');
    if (bar) {
      bar.classList.add('hidden');
      bar.classList.remove('rest-bar-flash');
    }
  },

  _renderRestBar(seconds) {
    const bar = document.getElementById('rest-bar');
    if (!bar) return;
    bar.textContent = '';
    bar.classList.remove('hidden', 'rest-bar-flash');

    const label = document.createElement('span');
    label.className = 'rest-bar-label';
    label.id = 'rest-bar-label';
    label.textContent = `休息 ${seconds}s`;
    bar.appendChild(label);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn btn-secondary rest-bar-btn';
    addBtn.textContent = '+30s';
    addBtn.addEventListener('click', () => {
      this.restRemaining += 30;
      this._updateRestText();
    });
    bar.appendChild(addBtn);

    const skipBtn = document.createElement('button');
    skipBtn.type = 'button';
    skipBtn.className = 'btn btn-secondary rest-bar-btn';
    skipBtn.textContent = '跳过';
    skipBtn.addEventListener('click', () => this.stopRest());
    bar.appendChild(skipBtn);
  },

  _updateRestText() {
    const label = document.getElementById('rest-bar-label');
    if (label) label.textContent = `休息 ${this.restRemaining}s`;
  },

  _finishRest() {
    clearInterval(this.restInterval);
    this.restInterval = null;

    if (navigator.vibrate) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch (e) {
        /* 忽略不支持的环境 */
      }
    }

    const bar = document.getElementById('rest-bar');
    if (bar) {
      const label = document.getElementById('rest-bar-label');
      if (label) label.textContent = '休息结束';
      bar.classList.add('rest-bar-flash'); // CSS 闪烁 3 次
      this._flashTimer = setTimeout(() => {
        this._flashTimer = null;
        this.stopRest();
      }, 1000);
    }
    showToast('休息结束，继续下一组');
  },

  /** 完成训练或切换训练日时调用：收起 rest-bar、清除高亮、按钮复位 */
  reset() {
    this.active = false;
    this.stopRest();
    if (this._exerciseList) {
      this._exerciseList
        .querySelectorAll('.exercise-card.active-exercise')
        .forEach((c) => c.classList.remove('active-exercise'));
    }
    this.updateProgress();
  },
};
