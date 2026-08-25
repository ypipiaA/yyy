/**
 * FitTrack 营养追踪模块
 * 包含饮食记录、卡路里计算、营养目标、食物数据库
 */

/**
 * 常见食物数据库（每100g）
 */
const FOOD_DATABASE = {
  // 蛋白质来源
  protein: [
    { name: '鸡胸肉', calories: 165, protein: 31, carbs: 0, fat: 3.6, category: '肉类' },
    { name: '鸡腿肉', calories: 209, protein: 26, carbs: 0, fat: 10.9, category: '肉类' },
    { name: '牛肉（瘦）', calories: 250, protein: 26, carbs: 0, fat: 15, category: '肉类' },
    { name: '牛肉（肥）', calories: 291, protein: 23, carbs: 0, fat: 21, category: '肉类' },
    { name: '猪里脊', calories: 143, protein: 21, carbs: 0, fat: 6, category: '肉类' },
    { name: '三文鱼', calories: 208, protein: 20, carbs: 0, fat: 13, category: '鱼类' },
    { name: '金枪鱼', calories: 184, protein: 30, carbs: 0, fat: 6, category: '鱼类' },
    { name: '虾仁', calories: 99, protein: 24, carbs: 0, fat: 0.3, category: '海鲜' },
    { name: '鸡蛋（全蛋）', calories: 155, protein: 13, carbs: 1.1, fat: 11, category: '蛋类' },
    { name: '蛋白', calories: 52, protein: 11, carbs: 0.7, fat: 0.2, category: '蛋类' },
    { name: '希腊酸奶', calories: 59, protein: 10, carbs: 3.6, fat: 0.4, category: '乳制品' },
    { name: '脱脂牛奶', calories: 34, protein: 3.4, carbs: 5, fat: 0.1, category: '乳制品' },
    { name: '豆腐', calories: 76, protein: 8, carbs: 1.9, fat: 4.8, category: '豆制品' },
    { name: '毛豆', calories: 122, protein: 11, carbs: 9, fat: 5, category: '豆制品' },
  ],
  
  // 碳水化合物来源
  carbs: [
    { name: '白米饭', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, category: '谷物' },
    { name: '糙米饭', calories: 111, protein: 2.6, carbs: 23, fat: 0.9, category: '谷物' },
    { name: '燕麦', calories: 389, protein: 17, carbs: 66, fat: 7, category: '谷物' },
    { name: '全麦面包', calories: 247, protein: 13, carbs: 41, fat: 3.4, category: '谷物' },
    { name: '意大利面', calories: 131, protein: 5, carbs: 25, fat: 1.1, category: '谷物' },
    { name: '红薯', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, category: '薯类' },
    { name: '土豆', calories: 77, protein: 2, carbs: 17, fat: 0.1, category: '薯类' },
    { name: '玉米', calories: 86, protein: 3.2, carbs: 19, fat: 1.2, category: '薯类' },
    { name: '香蕉', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, category: '水果' },
    { name: '苹果', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, category: '水果' },
    { name: '蓝莓', calories: 57, protein: 0.7, carbs: 14, fat: 0.3, category: '水果' },
    { name: '西瓜', calories: 30, protein: 0.6, carbs: 8, fat: 0.2, category: '水果' },
  ],
  
  // 脂肪来源
  fats: [
    { name: '橄榄油', calories: 884, protein: 0, carbs: 0, fat: 100, category: '油脂' },
    { name: '椰子油', calories: 862, protein: 0, carbs: 0, fat: 100, category: '油脂' },
    { name: '黄油', calories: 717, protein: 0.9, carbs: 0.1, fat: 81, category: '油脂' },
    { name: '牛油果', calories: 160, protein: 2, carbs: 9, fat: 15, category: '水果' },
    { name: '杏仁', calories: 579, protein: 21, carbs: 22, fat: 50, category: '坚果' },
    { name: '核桃', calories: 654, protein: 15, carbs: 14, fat: 65, category: '坚果' },
    { name: '花生酱', calories: 588, protein: 25, carbs: 20, fat: 50, category: '坚果' },
    { name: '亚麻籽', calories: 534, protein: 18, carbs: 29, fat: 42, category: '种子' },
    { name: '奇亚籽', calories: 486, protein: 17, carbs: 42, fat: 31, category: '种子' },
  ],
  
  // 蔬菜
  vegetables: [
    { name: '西兰花', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, category: '蔬菜' },
    { name: '菠菜', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, category: '蔬菜' },
    { name: '生菜', calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, category: '蔬菜' },
    { name: '番茄', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, category: '蔬菜' },
    { name: '黄瓜', calories: 16, protein: 0.7, carbs: 3.6, fat: 0.1, category: '蔬菜' },
    { name: '胡萝卜', calories: 41, protein: 0.9, carbs: 10, fat: 0.2, category: '蔬菜' },
    { name: '青椒', calories: 20, protein: 0.9, carbs: 4.6, fat: 0.2, category: '蔬菜' },
    { name: '洋葱', calories: 40, protein: 1.1, carbs: 9, fat: 0.1, category: '蔬菜' },
  ],
  
  // 补剂
  supplements: [
    { name: '乳清蛋白粉', calories: 120, protein: 25, carbs: 3, fat: 1.5, category: '补剂', serving: '30g' },
    { name: '肌酸', calories: 0, protein: 0, carbs: 0, fat: 0, category: '补剂', serving: '5g' },
    { name: 'BCAA', calories: 10, protein: 0, carbs: 0, fat: 0, category: '补剂', serving: '10g' },
    { name: '蛋白棒', calories: 200, protein: 20, carbs: 22, fat: 7, category: '补剂', serving: '60g' },
  ],
};

/**
 * 每日营养目标（默认值）
 */
const DEFAULT_NUTRITION_GOALS = {
  calories: 2000,
  protein: 150,  // 克
  carbs: 250,    // 克
  fat: 65,       // 克
  fiber: 25,     // 克
  water: 2000,   // 毫升
};

/**
 * 营养追踪类
 */
class NutritionTracker {
  constructor() {
    this.meals = [];
    this.waterLog = [];
    this.goals = DEFAULT_NUTRITION_GOALS;
    this.loadFromStorage();
  }
  
  /**
   * 从本地存储加载数据
   */
  loadFromStorage() {
    try {
      const savedMeals = localStorage.getItem('fittrack_meals');
      const savedWater = localStorage.getItem('fittrack_water');
      const savedGoals = localStorage.getItem('fittrack_nutrition_goals');
      
      if (savedMeals) this.meals = JSON.parse(savedMeals);
      if (savedWater) this.waterLog = JSON.parse(savedWater);
      if (savedGoals) this.goals = JSON.parse(savedGoals);
    } catch (e) {
      console.error('加载营养数据失败:', e);
    }
  }
  
  /**
   * 保存数据到本地存储
   */
  saveToStorage() {
    try {
      localStorage.setItem('fittrack_meals', JSON.stringify(this.meals));
      localStorage.setItem('fittrack_water', JSON.stringify(this.waterLog));
      localStorage.setItem('fittrack_nutrition_goals', JSON.stringify(this.goals));
    } catch (e) {
      console.error('保存营养数据失败:', e);
    }
  }
  
  /**
   * 添加一餐
   */
  addMeal(meal) {
    const newMeal = {
      id: Date.now(),
      date: new Date().toISOString(),
      ...meal,
    };
    this.meals.unshift(newMeal);
    this.saveToStorage();
    return newMeal;
  }
  
  /**
   * 删除一餐
   */
  deleteMeal(id) {
    this.meals = this.meals.filter(m => m.id !== id);
    this.saveToStorage();
  }
  
  /**
   * 获取今日营养摄入
   * "今天"的判定统一用客户端本地日期（formatDate）。
   * 注：历史数据中按 UTC 记录的条目保持原样，不强行重算；仅保证判定口径一律本地日期。
   */
  getTodayIntake() {
    const today = formatDate(new Date());
    const todayMeals = this.meals.filter(m => formatDate(m.date) === today);
    
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    
    todayMeals.forEach(meal => {
      meal.foods.forEach(food => {
        const multiplier = food.amount / 100;
        totalCalories += food.calories * multiplier;
        totalProtein += food.protein * multiplier;
        totalCarbs += food.carbs * multiplier;
        totalFat += food.fat * multiplier;
      });
    });
    
    return {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fat: Math.round(totalFat),
    };
  }
  
  /**
   * 获取指定日期的营养摄入
   */
  getDateIntake(date) {
    const dateStr = formatDate(date);
    const dateMeals = this.meals.filter(m => formatDate(m.date) === dateStr);
    
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    
    dateMeals.forEach(meal => {
      meal.foods.forEach(food => {
        const multiplier = food.amount / 100;
        totalCalories += food.calories * multiplier;
        totalProtein += food.protein * multiplier;
        totalCarbs += food.carbs * multiplier;
        totalFat += food.fat * multiplier;
      });
    });
    
    return {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fat: Math.round(totalFat),
    };
  }
  
  /**
   * 获取本周营养趋势
   */
  getWeeklyTrend() {
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trend.push({
        date: formatDate(date),
        ...this.getDateIntake(date),
      });
    }
    return trend;
  }
  
  /**
   * 记录喝水
   */
  addWater(amount = 250) {
    const record = {
      id: Date.now(),
      date: new Date().toISOString(),
      amount,
    };
    this.waterLog.unshift(record);
    this.saveToStorage();
    return record;
  }
  
  /**
   * 获取今日喝水量
   */
  getTodayWater() {
    const today = formatDate(new Date());
    return this.waterLog
      .filter(w => formatDate(w.date) === today)
      .reduce((sum, w) => sum + w.amount, 0);
  }
  
  /**
   * 设置营养目标
   */
  setGoals(goals) {
    this.goals = { ...this.goals, ...goals };
    this.saveToStorage();
  }
  
  /**
   * 获取营养进度
   */
  getProgress() {
    const intake = this.getTodayIntake();
    const water = this.getTodayWater();
    
    return {
      calories: {
        current: intake.calories,
        goal: this.goals.calories,
        percentage: Math.min(100, Math.round(intake.calories / this.goals.calories * 100)),
      },
      protein: {
        current: intake.protein,
        goal: this.goals.protein,
        percentage: Math.min(100, Math.round(intake.protein / this.goals.protein * 100)),
      },
      carbs: {
        current: intake.carbs,
        goal: this.goals.carbs,
        percentage: Math.min(100, Math.round(intake.carbs / this.goals.carbs * 100)),
      },
      fat: {
        current: intake.fat,
        goal: this.goals.fat,
        percentage: Math.min(100, Math.round(intake.fat / this.goals.fat * 100)),
      },
      water: {
        current: water,
        goal: this.goals.water,
        percentage: Math.min(100, Math.round(water / this.goals.water * 100)),
      },
    };
  }
  
  /**
   * 搜索食物
   */
  searchFood(query) {
    const allFoods = [
      ...FOOD_DATABASE.protein,
      ...FOOD_DATABASE.carbs,
      ...FOOD_DATABASE.fats,
      ...FOOD_DATABASE.vegetables,
      ...FOOD_DATABASE.supplements,
    ];
    
    return allFoods.filter(food => 
      food.name.toLowerCase().includes(query.toLowerCase()) ||
      food.category.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  /**
   * 导出营养数据
   */
  exportData() {
    return {
      meals: this.meals,
      waterLog: this.waterLog,
      goals: this.goals,
      exportedAt: new Date().toISOString(),
    };
  }
  
  /**
   * 导入营养数据（带结构校验，非法数据返回 false）
   */
  importData(data) {
    if (!data || typeof data !== 'object') return false;
    if (Array.isArray(data.meals)) this.meals = data.meals;
    if (Array.isArray(data.waterLog)) this.waterLog = data.waterLog;
    if (data.goals && typeof data.goals === 'object') {
      this.goals = { ...DEFAULT_NUTRITION_GOALS, ...data.goals };
    }
    this.saveToStorage();
    return true;
  }
  
  /**
   * 清空所有数据
   */
  clearAll() {
    this.meals = [];
    this.waterLog = [];
    this.goals = DEFAULT_NUTRITION_GOALS;
    this.saveToStorage();
  }
}

// 创建全局营养追踪器实例
const nutritionTracker = new NutritionTracker();