/**
 * FitTrack 营养追踪UI模块
 */

const NutritionUI = {
  // 当前搜索结果（渲染用 data-index 回查，避免把 JSON 塞进 DOM 属性）
  filtered: [],
  _searchTimer: null,

  init() {
    this.bindEvents();
    this.loadGoals();
    this.refresh();
  },

  bindEvents() {
    // 添加食物按钮
    document.getElementById('add-food-btn').addEventListener('click', () => {
      document.getElementById('food-search').classList.toggle('hidden');
      this.hideAddFoodForm();
    });

    // 食物搜索（150ms debounce）
    document.getElementById('food-search-input').addEventListener('input', (e) => {
      clearTimeout(this._searchTimer);
      this._searchTimer = setTimeout(() => this.searchFood(e.target.value), 150);
    });

    // 搜索结果点击：容器级事件委托
    document.getElementById('food-search-results').addEventListener('click', (e) => {
      const item = e.target.closest('.food-search-item');
      if (!item) return;
      const food = this.filtered[parseInt(item.dataset.index)];
      if (food) this.showAddFoodForm(food);
    });

    // 今日饮食删除：容器级事件委托
    document.getElementById('today-meals').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-delete-meal]');
      if (!btn) return;
      const id = parseInt(btn.dataset.deleteMeal);
      nutritionTracker.deleteMeal(id);
      this.refresh();
      showToast('餐次已删除');
    });

    // 喝水按钮
    document.querySelectorAll('.water-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const amount = parseInt(btn.dataset.amount);
        this.addWater(amount);
      });
    });

    // 营养目标表单
    document.getElementById('nutrition-goals-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveGoals();
    });
  },

  refresh() {
    this.updateProgress();
    this.renderMeals();
    this.updateWater();
  },

  updateProgress() {
    const progress = nutritionTracker.getProgress();
    const intake = nutritionTracker.getTodayIntake();

    // 更新卡路里
    document.getElementById('calories-current').textContent = intake.calories;
    document.getElementById('calories-goal').textContent = progress.calories.goal;
    document.getElementById('calories-remaining').textContent = Math.max(0, progress.calories.goal - intake.calories);

    // 更新卡路里进度环
    const caloriesProgress = document.getElementById('calories-progress');
    const circumference = 2 * Math.PI * 40;
    const offset = circumference - (progress.calories.percentage / 100) * circumference;
    caloriesProgress.style.strokeDasharray = circumference;
    caloriesProgress.style.strokeDashoffset = offset;

    // 更新宏量营养素
    document.getElementById('protein-current').textContent = intake.protein;
    document.getElementById('protein-goal').textContent = progress.protein.goal;
    document.getElementById('protein-progress').style.width = `${progress.protein.percentage}%`;

    document.getElementById('carbs-current').textContent = intake.carbs;
    document.getElementById('carbs-goal').textContent = progress.carbs.goal;
    document.getElementById('carbs-progress').style.width = `${progress.carbs.percentage}%`;

    document.getElementById('fat-current').textContent = intake.fat;
    document.getElementById('fat-goal').textContent = progress.fat.goal;
    document.getElementById('fat-progress').style.width = `${progress.fat.percentage}%`;
  },

  renderMeals() {
    const container = document.getElementById('today-meals');
    const today = formatDate(new Date());
    const todayMeals = nutritionTracker.meals.filter(m => formatDate(m.date) === today);

    if (todayMeals.length === 0) {
      container.innerHTML = '<p class="empty-state">今天还没有记录饮食</p>';
      return;
    }

    container.innerHTML = todayMeals.map(meal => `
      <div class="meal-item">
        <div class="meal-header">
          <span class="meal-name">${escapeHtml(meal.name || '未命名餐次')}</span>
          <span class="meal-time">${new Date(meal.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
          <button class="btn-icon btn-danger-icon" data-delete-meal="${Number(meal.id)}" aria-label="删除餐次">✕</button>
        </div>
        <div class="meal-foods">
          ${meal.foods.map(food => `
            <div class="food-item">
              <span class="food-name">${escapeHtml(food.name)}</span>
              <span class="food-amount">${Number(food.amount)}g</span>
              <span class="food-calories">${Math.round(food.calories * food.amount / 100)} 千卡</span>
            </div>
          `).join('')}
        </div>
        <div class="meal-summary">
          <span>蛋白质: ${this.calculateMealNutrient(meal, 'protein')}g</span>
          <span>碳水: ${this.calculateMealNutrient(meal, 'carbs')}g</span>
          <span>脂肪: ${this.calculateMealNutrient(meal, 'fat')}g</span>
        </div>
      </div>
    `).join('');
  },

  calculateMealNutrient(meal, nutrient) {
    return Math.round(meal.foods.reduce((sum, food) => {
      return sum + (food[nutrient] * food.amount / 100);
    }, 0));
  },

  searchFood(query) {
    const resultsContainer = document.getElementById('food-search-results');
    this.hideAddFoodForm();

    if (query.length < 1) {
      this.filtered = [];
      resultsContainer.innerHTML = '';
      return;
    }

    this.filtered = nutritionTracker.searchFood(query);

    if (this.filtered.length === 0) {
      resultsContainer.innerHTML = '<p class="empty-state">未找到匹配的食物</p>';
      return;
    }

    resultsContainer.innerHTML = this.filtered.map((food, i) => `
      <div class="food-search-item" data-index="${i}">
        <span class="food-name">${escapeHtml(food.name)}</span>
        <span class="food-info">${Number(food.calories)}千卡/100g</span>
        <span class="food-category">${escapeHtml(food.category)}</span>
      </div>
    `).join('');
  },

  /**
   * 内联添加表单（替代 prompt/confirm 流程）
   */
  showAddFoodForm(food) {
    this.hideAddFoodForm();
    const searchBox = document.getElementById('food-search');

    const form = document.createElement('div');
    form.className = 'food-add-form';
    form.id = 'food-add-form';

    const title = document.createElement('div');
    title.className = 'food-add-title';
    title.textContent = `添加「${food.name}」（每100g含${food.calories}千卡）`;
    form.appendChild(title);

    const row = document.createElement('div');
    row.className = 'food-add-row';

    const amountLabel = document.createElement('label');
    amountLabel.textContent = '克数';
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.id = 'food-add-amount';
    amountInput.setAttribute('inputmode', 'numeric');
    amountInput.min = '1';
    amountInput.max = '2000';
    amountInput.value = '100';
    amountLabel.appendChild(amountInput);
    row.appendChild(amountLabel);

    const mealLabel = document.createElement('label');
    mealLabel.textContent = '餐次';
    const mealSelect = document.createElement('select');
    mealSelect.id = 'food-add-meal';
    ['早餐', '午餐', '晚餐', '正餐', '加餐'].forEach((name) => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      if (name === '正餐') opt.selected = true;
      mealSelect.appendChild(opt);
    });
    mealLabel.appendChild(mealSelect);
    row.appendChild(mealLabel);

    form.appendChild(row);

    const actions = document.createElement('div');
    actions.className = 'food-add-actions';

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'btn btn-primary';
    confirmBtn.textContent = '确认添加';
    confirmBtn.addEventListener('click', () => {
      const amountNum = parseInt(amountInput.value);
      if (isNaN(amountNum) || amountNum <= 0) {
        showToast('请输入有效的克数');
        return;
      }
      this.addFood(food, amountNum, mealSelect.value);
    });
    actions.appendChild(confirmBtn);

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = '取消';
    cancelBtn.addEventListener('click', () => this.hideAddFoodForm());
    actions.appendChild(cancelBtn);

    form.appendChild(actions);
    searchBox.appendChild(form);
    amountInput.focus();
    amountInput.select();
  },

  hideAddFoodForm() {
    const form = document.getElementById('food-add-form');
    if (form) form.remove();
  },

  addFood(food, amount, mealName) {
    nutritionTracker.addMeal({
      name: mealName || '正餐',
      foods: [{
        ...food,
        amount,
      }],
    });

    document.getElementById('food-search-input').value = '';
    document.getElementById('food-search-results').innerHTML = '';
    this.filtered = [];
    this.hideAddFoodForm();
    document.getElementById('food-search').classList.add('hidden');

    this.refresh();
    showToast('食物已添加');
  },

  addWater(amount) {
    nutritionTracker.addWater(amount);
    this.updateWater();
    showToast(`已记录 ${amount}ml 水`);
  },

  updateWater() {
    const current = nutritionTracker.getTodayWater();
    const goal = nutritionTracker.goals.water;

    document.getElementById('water-current').textContent = current;
    document.getElementById('water-goal').textContent = goal;
  },

  loadGoals() {
    const goals = nutritionTracker.goals;

    document.getElementById('goal-calories').value = goals.calories;
    document.getElementById('goal-protein').value = goals.protein;
    document.getElementById('goal-carbs').value = goals.carbs;
    document.getElementById('goal-fat').value = goals.fat;
  },

  saveGoals() {
    const goals = {
      calories: parseInt(document.getElementById('goal-calories').value) || 2000,
      protein: parseInt(document.getElementById('goal-protein').value) || 150,
      carbs: parseInt(document.getElementById('goal-carbs').value) || 250,
      fat: parseInt(document.getElementById('goal-fat').value) || 65,
    };

    nutritionTracker.setGoals(goals);
    this.refresh();
    showToast('营养目标已保存');
  },
};
