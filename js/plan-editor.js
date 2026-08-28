/**
 * 手动创建训练计划编辑器（规格 v3.2 §4）
 *
 * - 草稿纯内存（不落盘），保存时经 buildPlanObject() 输出与生成计划
 *   完全一致的存储格式（训练页/统计页/导入导出零改动）。
 * - XSS 门禁：本文件禁止任何 HTML 字符串注入式赋值，DOM 全程
 *   createElement / textContent / replaceChildren 构建。
 */

/** 动作库部位 → 中文标签 */
const GROUP_LABELS = {
  chest: '胸',
  back: '背',
  legs: '腿',
  shoulders: '肩',
  arms: '手臂',
  core: '核心',
  cardio: '有氧',
  forearm: '前臂',
  flexibility: '柔韧',
};

const PlanEditor = {
  MAX_DAYS: 7, // 与 SPLIT_TEMPLATES 同级上限
  DEFAULTS: { sets: 4, reps: '8-12', rest: 90 },

  draft: null,
  _onSaved: null,
  _picker: null, // 弹层 DOM（惰性创建一次）
  _pickerList: null,
  _pickerDayIndex: 0,
  _pickerGroup: 'chest',

  /** opts = { onSaved: (plan) => void } */
  init(opts) {
    this._onSaved = opts && opts.onSaved ? opts.onSaved : null;

    const nameInput = document.getElementById('manual-plan-name');
    nameInput.oninput = () => {
      this.draft.name = nameInput.value;
    };
    document.getElementById('manual-add-day').onclick = () => this._addDay();
    document.getElementById('manual-save-plan').onclick = () => this._save();

    // 容器级事件委托（按钮 dataset.action/day/ex 定位）
    const container = document.getElementById('manual-days');
    container.onclick = (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const day = parseInt(btn.dataset.day, 10);
      const ex = parseInt(btn.dataset.ex, 10);
      switch (btn.dataset.action) {
        case 'remove-day':
          this._removeDay(day);
          break;
        case 'add-exercise':
          this._openPicker(day);
          break;
        case 'remove-ex':
          this._removeExercise(day, ex);
          break;
        case 'move-up':
          this._moveExercise(day, ex, -1);
          break;
        case 'move-down':
          this._moveExercise(day, ex, 1);
          break;
      }
    };

    // 训练重点：input 实时写回草稿
    container.oninput = (e) => {
      const t = e.target;
      if (!t.classList.contains('editor-day-focus')) return;
      const d = this.draft.planDays[parseInt(t.dataset.day, 10)];
      if (d) d.focus = t.value;
    };

    // 组数/次数/休息：change 写回草稿（clamp / 空值回落默认）
    container.onchange = (e) => {
      const t = e.target;
      const d = this.draft.planDays[parseInt(t.dataset.day, 10)];
      if (!d) return;
      const exercise = d.exercises[parseInt(t.dataset.ex, 10)];
      if (!exercise) return;
      if (t.classList.contains('editor-sets')) {
        exercise.sets = this._clamp(t.value, 1, 10, this.DEFAULTS.sets);
        t.value = exercise.sets;
      } else if (t.classList.contains('editor-reps')) {
        exercise.reps = t.value.trim() || this.DEFAULTS.reps;
        t.value = exercise.reps;
      } else if (t.classList.contains('editor-rest')) {
        exercise.rest = this._clamp(t.value, 10, 600, this.DEFAULTS.rest);
        t.value = exercise.rest;
      }
    };

    this.reset();
  },

  /** 草稿恢复为 1 个空训练日、清空名称输入 */
  reset() {
    this.draft = {
      name: '',
      planDays: [{ name: '第1天', focus: '', exercises: [] }],
    };
    const nameInput = document.getElementById('manual-plan-name');
    if (nameInput) nameInput.value = '';
    this._renderDays();
  },

  _clamp(value, min, max, fallback) {
    const n = parseInt(value, 10);
    if (isNaN(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  },

  /* ---------- 训练日 ---------- */

  _addDay() {
    if (this.draft.planDays.length >= this.MAX_DAYS) {
      showToast(`最多 ${this.MAX_DAYS} 个训练日`);
      return;
    }
    this.draft.planDays.push({
      name: `第${this.draft.planDays.length + 1}天`,
      focus: '',
      exercises: [],
    });
    this._renderDays();
  },

  _removeDay(dayIndex) {
    if (!confirm('确定删除该训练日吗？')) return;
    this.draft.planDays.splice(dayIndex, 1);
    this._renumberDays();
    this._renderDays();
  },

  _renumberDays() {
    this.draft.planDays.forEach((d, i) => {
      d.name = `第${i + 1}天`;
    });
  },

  /* ---------- 动作 ---------- */

  _addExercise(dayIndex, exercise) {
    const day = this.draft.planDays[dayIndex];
    if (!day) return;
    day.exercises.push(exercise);
    this._renderDays();
  },

  _removeExercise(dayIndex, exIndex) {
    this.draft.planDays[dayIndex].exercises.splice(exIndex, 1);
    this._renderDays();
  },

  _moveExercise(dayIndex, exIndex, dir) {
    const list = this.draft.planDays[dayIndex].exercises;
    const target = exIndex + dir;
    if (target < 0 || target >= list.length) return;
    [list[exIndex], list[target]] = [list[target], list[exIndex]];
    this._renderDays();
  },

  /* ---------- 渲染（全量重渲，数据量小） ---------- */

  _renderDays() {
    const container = document.getElementById('manual-days');
    if (!container) return;
    container.replaceChildren();

    this.draft.planDays.forEach((day, dayIndex) => {
      container.appendChild(this._buildDayCard(day, dayIndex));
    });
  },

  _buildDayCard(day, dayIndex) {
    const card = document.createElement('div');
    card.className = 'editor-day';

    // 头部：序号圆片 + 名称 + 重点输入 + 删除
    const header = document.createElement('div');
    header.className = 'editor-day-header';

    const chip = document.createElement('span');
    chip.className = 'plan-day-chip';
    chip.textContent = String(dayIndex + 1);
    header.appendChild(chip);

    const name = document.createElement('span');
    name.className = 'editor-day-name';
    name.textContent = day.name;
    header.appendChild(name);

    const focus = document.createElement('input');
    focus.type = 'text';
    focus.className = 'editor-day-focus';
    focus.placeholder = '训练重点，如：胸+三头';
    focus.maxLength = 15;
    focus.value = day.focus;
    focus.dataset.day = dayIndex;
    header.appendChild(focus);

    const removeDay = document.createElement('button');
    removeDay.type = 'button';
    removeDay.className = 'btn-icon btn-danger-icon';
    removeDay.textContent = '✕';
    removeDay.dataset.action = 'remove-day';
    removeDay.dataset.day = dayIndex;
    removeDay.setAttribute('aria-label', `删除${day.name}`);
    header.appendChild(removeDay);

    card.appendChild(header);

    // 动作列表
    const list = document.createElement('div');
    list.className = 'editor-ex-list';
    day.exercises.forEach((ex, exIndex) => {
      list.appendChild(this._buildExerciseRow(ex, dayIndex, exIndex, day.exercises.length));
    });
    card.appendChild(list);

    // 添加动作（复用虚线按钮样式）
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'add-set-btn';
    addBtn.textContent = '＋ 添加动作';
    addBtn.dataset.action = 'add-exercise';
    addBtn.dataset.day = dayIndex;
    card.appendChild(addBtn);

    return card;
  },

  _buildExerciseRow(ex, dayIndex, exIndex, total) {
    const row = document.createElement('div');
    row.className = 'editor-ex-row';

    // 名称 + 部位标签
    const main = document.createElement('div');
    main.className = 'editor-ex-main';
    const name = document.createElement('span');
    name.className = 'ex-name';
    name.textContent = ex.name;
    main.appendChild(name);
    const tag = document.createElement('span');
    tag.className = 'ex-tag';
    tag.textContent = ex.muscle;
    main.appendChild(tag);
    row.appendChild(main);

    // 组数 / 次数 / 休息
    const fields = document.createElement('div');
    fields.className = 'editor-ex-fields';
    fields.appendChild(
      this._buildField('组数', 'editor-sets', { type: 'number', min: 1, max: 10 }, ex.sets, dayIndex, exIndex)
    );
    fields.appendChild(
      this._buildField('次数', 'editor-reps', { type: 'text', maxLength: 10 }, ex.reps, dayIndex, exIndex)
    );
    fields.appendChild(
      this._buildField('休息(秒)', 'editor-rest', { type: 'number', min: 10, max: 600, step: 5 }, ex.rest, dayIndex, exIndex)
    );
    row.appendChild(fields);

    // ↑ ↓ ✕
    const actions = document.createElement('div');
    actions.className = 'editor-ex-actions';
    const up = this._buildActionBtn('↑', 'move-up', dayIndex, exIndex, '上移动作');
    up.disabled = exIndex === 0;
    actions.appendChild(up);
    const down = this._buildActionBtn('↓', 'move-down', dayIndex, exIndex, '下移动作');
    down.disabled = exIndex === total - 1;
    actions.appendChild(down);
    const del = this._buildActionBtn('✕', 'remove-ex', dayIndex, exIndex, '删除动作');
    del.classList.add('btn-danger-icon');
    actions.appendChild(del);
    row.appendChild(actions);

    return row;
  },

  _buildField(labelText, className, attrs, value, dayIndex, exIndex) {
    const label = document.createElement('label');
    label.appendChild(document.createTextNode(labelText));
    const input = document.createElement('input');
    input.className = className;
    input.type = attrs.type;
    if (attrs.min !== undefined) input.min = attrs.min;
    if (attrs.max !== undefined) input.max = attrs.max;
    if (attrs.step !== undefined) input.step = attrs.step;
    if (attrs.maxLength !== undefined) input.maxLength = attrs.maxLength;
    if (attrs.type === 'number') input.inputMode = 'numeric';
    input.value = value;
    input.dataset.day = dayIndex;
    input.dataset.ex = exIndex;
    label.appendChild(input);
    return label;
  },

  _buildActionBtn(text, action, dayIndex, exIndex, ariaLabel) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-icon';
    btn.textContent = text;
    btn.dataset.action = action;
    btn.dataset.day = dayIndex;
    btn.dataset.ex = exIndex;
    btn.setAttribute('aria-label', ariaLabel);
    return btn;
  },

  /* ---------- 动作选择弹层 ---------- */

  _openPicker(dayIndex) {
    this._pickerDayIndex = dayIndex;
    if (!this._picker) this._buildPicker();
    this._renderPickerList();
    this._picker.classList.remove('hidden');
  },

  _closePicker() {
    if (this._picker) this._picker.classList.add('hidden');
  },

  _buildPicker() {
    const overlay = document.createElement('div');
    overlay.className = 'picker-overlay hidden';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this._closePicker();
    });

    const sheet = document.createElement('div');
    sheet.className = 'picker-sheet';

    // 头部
    const header = document.createElement('div');
    header.className = 'picker-header';
    const title = document.createElement('span');
    title.textContent = '选择动作';
    header.appendChild(title);
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn-icon';
    closeBtn.textContent = '✕';
    closeBtn.setAttribute('aria-label', '关闭');
    closeBtn.addEventListener('click', () => this._closePicker());
    header.appendChild(closeBtn);
    sheet.appendChild(header);

    // 部位 chips
    const groups = document.createElement('div');
    groups.className = 'picker-groups';
    Object.keys(GROUP_LABELS).forEach((key) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'picker-group-chip' + (key === this._pickerGroup ? ' active' : '');
      chip.textContent = GROUP_LABELS[key];
      chip.dataset.group = key;
      chip.addEventListener('click', () => {
        this._pickerGroup = key;
        groups.querySelectorAll('.picker-group-chip').forEach((c) => {
          c.classList.toggle('active', c === chip);
        });
        this._renderPickerList();
      });
      groups.appendChild(chip);
    });
    sheet.appendChild(groups);

    // 动作列表
    const list = document.createElement('div');
    list.className = 'picker-list';
    sheet.appendChild(list);
    this._pickerList = list;

    // 自定义动作区
    const custom = document.createElement('div');
    custom.className = 'picker-custom';
    const customName = document.createElement('input');
    customName.type = 'text';
    customName.id = 'picker-custom-name';
    customName.maxLength = 20;
    customName.placeholder = '自定义动作名称';
    custom.appendChild(customName);
    const customMuscle = document.createElement('select');
    customMuscle.id = 'picker-custom-muscle';
    Object.values(GROUP_LABELS).forEach((label) => {
      const option = document.createElement('option');
      option.value = label;
      option.textContent = label;
      customMuscle.appendChild(option);
    });
    custom.appendChild(customMuscle);
    const customBtn = document.createElement('button');
    customBtn.type = 'button';
    customBtn.className = 'btn btn-secondary';
    customBtn.textContent = '添加自定义动作';
    customBtn.addEventListener('click', () => {
      const name = customName.value.trim();
      if (!name) {
        showToast('请输入动作名称');
        return;
      }
      this._addExercise(this._pickerDayIndex, {
        name,
        muscle: customMuscle.value,
        equipment: '自定义',
        sets: this.DEFAULTS.sets,
        reps: this.DEFAULTS.reps,
        rest: this.DEFAULTS.rest,
      });
      customName.value = '';
      showToast('已添加');
    });
    custom.appendChild(customBtn);
    sheet.appendChild(custom);

    overlay.appendChild(sheet);
    document.body.appendChild(overlay);
    this._picker = overlay;
  },

  _renderPickerList() {
    if (!this._pickerList) return;
    this._pickerList.replaceChildren();
    const pool = EXERCISES[this._pickerGroup] || [];
    pool.forEach((ex) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'picker-item';

      const name = document.createElement('span');
      name.className = 'ex-name';
      name.textContent = ex.name;
      item.appendChild(name);

      const tag = document.createElement('span');
      tag.className = 'ex-tag';
      tag.textContent = ex.muscle;
      item.appendChild(tag);

      const equip = document.createElement('span');
      equip.className = 'ex-tag ex-tag-equipment';
      equip.textContent = ex.equipment;
      item.appendChild(equip);

      // 点选即加入当日（默认规格），不关闭弹层，可连续添加
      item.addEventListener('click', () => {
        this._addExercise(this._pickerDayIndex, {
          name: ex.name,
          muscle: ex.muscle,
          equipment: ex.equipment,
          sets: this.DEFAULTS.sets,
          reps: this.DEFAULTS.reps,
          rest: this.DEFAULTS.rest,
        });
        showToast('已添加');
      });
      this._pickerList.appendChild(item);
    });
  },

  /* ---------- 校验 / 保存 ---------- */

  _validate() {
    if (this.draft.planDays.length === 0) {
      return { ok: false, message: '请至少添加 1 个训练日' };
    }
    for (let i = 0; i < this.draft.planDays.length; i++) {
      if (this.draft.planDays[i].exercises.length === 0) {
        return { ok: false, message: `第${i + 1}天还没有动作` };
      }
    }
    return { ok: true, message: '' };
  },

  /** 输出与现有存储格式逐字段对齐的计划对象 */
  buildPlanObject() {
    return {
      goal: 'custom',
      goalLabel: this.draft.name.trim() || '自定义计划',
      days: this.draft.planDays.length,
      createdAt: new Date().toISOString(),
      planDays: this.draft.planDays.map((d) => ({
        name: d.name,
        focus: d.focus.trim() || '自定义训练',
        exercises: d.exercises.map((ex) => ({
          name: ex.name,
          muscle: ex.muscle,
          equipment: ex.equipment,
          sets: Number(ex.sets),   // 训练页 Array.from({length}) 依赖 number
          reps: String(ex.reps),   // 训练页展示字符串
          rest: Number(ex.rest),   // WorkoutSession._restSecondsFor 依赖 number
        })),
      })),
    };
  },

  _save() {
    const check = this._validate();
    if (!check.ok) {
      showToast(check.message);
      return;
    }
    const plan = this.buildPlanObject();
    Storage.savePlan(plan);
    if (this._onSaved) this._onSaved(plan);
    showToast('计划已保存！');
  },
};
