/**
 * FitTrack 营养追踪UI模块
 */

const NutritionUI = {
  init() {
    this.bindEvents();
    this.loadGoals();
    this.refresh();
  },

  bindEvents() {
    // 添加食物按钮
    document.getElementById('add-food-btn').addEventListener('click', () => {
      document.getElementById('food-search').classList.toggle('hidden');
    });

    // 食物搜索
    document.getElementById('food-search-input').addEventListener('input', (e) => {
      this.searchFood(e.target.value);
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
    const today = new Date().toISOString().split('T')[0];
    const todayMeals = nutritionTracker.meals.filter(m => m.date.startsWith(today));

    if (todayMeals.length === 0) {
      container.innerHTML = '<p class="empty-state">今天还没有记录饮食</p>';
      return;
    }

    container.innerHTML = todayMeals.map(meal => `
      <div class="meal-item">
        <div class="meal-header">
          <span class="meal-name">${meal.name || '未命名餐次'}</span>
          <span class="meal-time">${new Date(meal.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
          <button class="btn-icon btn-danger-icon" data-delete-meal="${meal.id}">✕</button>
        </div>
        <div class="meal-foods">
          ${meal.foods.map(food => `
            <div class="food-item">
              <span class="food-name">${food.name}</span>
              <span class="food-amount">${food.amount}g</span>
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

    // 绑定删除事件
    container.querySelectorAll('[data-delete-meal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.deleteMeal);
        nutritionTracker.deleteMeal(id);
        this.refresh();
        showToast('餐次已删除');
      });
    });
  },

  calculateMealNutrient(meal, nutrient) {
    return Math.round(meal.foods.reduce((sum, food) => {
      return sum + (food[nutrient] * food.amount / 100);
    }, 0));
  },

  searchFood(query) {
    const resultsContainer = document.getElementById('food-search-results');
    
    if (query.length < 1) {
      resultsContainer.innerHTML = '';
      return;
    }

    const results = nutritionTracker.searchFood(query);
    
    if (results.length === 0) {
      resultsContainer.innerHTML = '<p class="empty-state">未找到匹配的食物</p>';
      return;
    }

    resultsContainer.innerHTML = results.map(food => `
      <div class="food-search-item" data-food='${JSON.stringify(food)}'>
        <span class="food-name">${food.name}</span>
        <span class="food-info">${food.calories}千卡/100g</span>
        <span class="food-category">${food.category}</span>
      </div>
    `).join('');

    resultsContainer.querySelectorAll('.food-search-item').forEach(item => {
      item.addEventListener('click', () => {
        const food = JSON.parse(item.dataset.food);
        this.showAddFoodModal(food);
      });
    });
  },

  showAddFoodModal(food) {
    const amount = prompt(`添加 ${food.name}\n请输入克数（每100g含${food.calories}千卡）:`, '100');
    
    if (amount === null) return;
    
    const amountNum = parseInt(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('请输入有效的克数');
      return;
    }

    const mealName = prompt('餐次名称（如：早餐、午餐、晚餐）:', '正餐');
    
    nutritionTracker.addMeal({
      name: mealName || '正餐',
      foods: [{
        ...food,
        amount: amountNum,
      }],
    });

    document.getElementById('food-search-input').value = '';
    document.getElementById('food-search-results').innerHTML = '';
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