/**
 * FitTrack API客户端
 * 支持后端API和本地localStorage双模式
 */
const API = {
  BASE_URL: 'http://localhost:8000/api',
  USE_API: false, // 设置为true使用后端API，false使用localStorage

  async request(endpoint, options = {}) {
    if (!this.USE_API) {
      return null;
    }

    const url = `${this.BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API请求失败:', error);
      throw error;
    }
  },

  // 训练计划API
  plans: {
    async getAll() {
      return API.request('/plans/');
    },

    async get(id) {
      return API.request(`/plans/${id}`);
    },

    async create(plan) {
      return API.request('/plans/', {
        method: 'POST',
        body: JSON.stringify(plan),
      });
    },

    async update(id, plan) {
      return API.request(`/plans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(plan),
      });
    },

    async activate(id) {
      return API.request(`/plans/${id}/activate`, {
        method: 'PUT',
      });
    },

    async delete(id) {
      return API.request(`/plans/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // 训练记录API
  workouts: {
    // limit=0 表示不分页拉全量（前端统计/成就/streak 依赖完整 logs）
    async getAll(skip = 0, limit = 0) {
      return API.request(`/workouts/?skip=${skip}&limit=${limit}`);
    },

    async get(id) {
      return API.request(`/workouts/${id}`);
    },

    async create(workout) {
      return API.request('/workouts/', {
        method: 'POST',
        body: JSON.stringify(workout),
      });
    },

    async delete(id) {
      return API.request(`/workouts/${id}`, {
        method: 'DELETE',
      });
    },

    async getSummary() {
      return API.request('/workouts/stats/summary');
    },
  },

  // 身体数据API
  body: {
    async getAll(skip = 0, limit = 100) {
      return API.request(`/body/?skip=${skip}&limit=${limit}`);
    },

    async getLatest() {
      return API.request('/body/latest');
    },

    async create(record) {
      return API.request('/body/', {
        method: 'POST',
        body: JSON.stringify(record),
      });
    },

    async delete(id) {
      return API.request(`/body/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // 统计API
  // tz_offset 为 JS Date.getTimezoneOffset() 语义（分钟，UTC = 本地 + offset），
  // 供后端把 UTC 时间戳归入客户端本地日期桶
  stats: {
    async getOverview() {
      return API.request(
        `/stats/overview?tz_offset=${new Date().getTimezoneOffset()}`
      );
    },

    async getWeekly() {
      return API.request(
        `/stats/weekly?tz_offset=${new Date().getTimezoneOffset()}`
      );
    },

    async getMuscle() {
      return API.request('/stats/muscle');
    },

    async getProgress(exerciseName) {
      return API.request(`/stats/progress/${encodeURIComponent(exerciseName)}`);
    },
  },

  // 设置API
  settings: {
    async getProfile() {
      return API.request('/settings/profile');
    },

    async updateProfile(profile) {
      return API.request('/settings/profile', {
        method: 'PUT',
        body: JSON.stringify(profile),
      });
    },

    async getSettings() {
      return API.request('/settings/settings');
    },

    async updateSettings(settings) {
      return API.request('/settings/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    },
  },

  // 营养追踪API
  nutrition: {
    async getGoals() {
      return API.request('/nutrition/goals');
    },

    async updateGoals(goals) {
      return API.request('/nutrition/goals', {
        method: 'PUT',
        body: JSON.stringify(goals),
      });
    },

    async getMeals(skip = 0, limit = 50) {
      return API.request(`/nutrition/meals?skip=${skip}&limit=${limit}`);
    },

    async createMeal(meal) {
      return API.request('/nutrition/meals', {
        method: 'POST',
        body: JSON.stringify(meal),
      });
    },

    async deleteMeal(id) {
      return API.request(`/nutrition/meals/${id}`, {
        method: 'DELETE',
      });
    },

    async getToday() {
      return API.request('/nutrition/today');
    },

    async addWater(amount) {
      return API.request('/nutrition/water', {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
    },

    async getTodayWater() {
      return API.request('/nutrition/water/today');
    },
  },

  // 成就系统API
  achievements: {
    async getAchievements() {
      return API.request('/achievements/achievements');
    },

    async unlockAchievement(id) {
      return API.request(`/achievements/achievements/${id}`, {
        method: 'POST',
      });
    },

    async getBadges() {
      return API.request('/achievements/badges');
    },

    async earnBadge(id) {
      return API.request(`/achievements/badges/${id}`, {
        method: 'POST',
      });
    },

    async getStats() {
      return API.request('/achievements/stats');
    },
  },

  // 切换API模式
  useAPI(enable) {
    this.USE_API = enable;
    localStorage.setItem('fittrack_use_api', enable.toString());
  },

  // 初始化
  init() {
    const useApi = localStorage.getItem('fittrack_use_api');
    if (useApi !== null) {
      this.USE_API = useApi === 'true';
    }
  },
};

// 初始化API
API.init();