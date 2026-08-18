/**
 * FitTrack 成就系统模块
 * 包含成就、徽章、连续训练记录、里程碑
 */

/**
 * 成就定义
 */
const ACHIEVEMENTS = {
  // 训练成就
  firstWorkout: {
    id: 'firstWorkout',
    name: '初次训练',
    description: '完成第一次训练',
    icon: '🏋️',
    category: 'training',
    condition: (stats) => stats.totalWorkouts >= 1,
    reward: { type: 'badge', value: 'beginner' },
  },
  tenWorkouts: {
    id: 'tenWorkouts',
    name: '十次训练',
    description: '完成10次训练',
    icon: '💪',
    category: 'training',
    condition: (stats) => stats.totalWorkouts >= 10,
    reward: { type: 'badge', value: 'dedicated' },
  },
  fiftyWorkouts: {
    id: 'fiftyWorkouts',
    name: '五十次训练',
    description: '完成50次训练',
    icon: '🔥',
    category: 'training',
    condition: (stats) => stats.totalWorkouts >= 50,
    reward: { type: 'badge', value: 'veteran' },
  },
  hundredWorkouts: {
    id: 'hundredWorkouts',
    name: '百次训练',
    description: '完成100次训练',
    icon: '👑',
    category: 'training',
    condition: (stats) => stats.totalWorkouts >= 100,
    reward: { type: 'badge', value: 'legend' },
  },
  
  // 连续训练成就
  threeDayStreak: {
    id: 'threeDayStreak',
    name: '三天连续',
    description: '连续训练3天',
    icon: '📅',
    category: 'streak',
    condition: (stats) => stats.streak >= 3,
    reward: { type: 'badge', value: 'consistent' },
  },
  sevenDayStreak: {
    id: 'sevenDayStreak',
    name: '一周坚持',
    description: '连续训练7天',
    icon: '🌟',
    category: 'streak',
    condition: (stats) => stats.streak >= 7,
    reward: { type: 'badge', value: 'committed' },
  },
  thirtyDayStreak: {
    id: 'thirtyDayStreak',
    name: '月度达人',
    description: '连续训练30天',
    icon: '🏆',
    category: 'streak',
    condition: (stats) => stats.streak >= 30,
    reward: { type: 'badge', value: 'champion' },
  },
  
  // 力量成就
  firstHeavyLift: {
    id: 'firstHeavyLift',
    name: '重量突破',
    description: '单次举起超过体重的重量',
    icon: '🦾',
    category: 'strength',
    condition: (stats) => stats.maxWeight > stats.bodyWeight,
    reward: { type: 'badge', value: 'strong' },
  },
  totalVolume1000: {
    id: 'totalVolume1000',
    name: '千公斤俱乐部',
    description: '累计训练量达到1000公斤',
    icon: '🎯',
    category: 'strength',
    condition: (stats) => stats.totalVolume >= 1000,
    reward: { type: 'badge', value: 'powerlifter' },
  },
  totalVolume10000: {
    id: 'totalVolume10000',
    name: '万公斤传奇',
    description: '累计训练量达到10000公斤',
    icon: '🏅',
    category: 'strength',
    condition: (stats) => stats.totalVolume >= 10000,
    reward: { type: 'badge', value: 'elite' },
  },
  
  // 时间成就
  firstMonth: {
    id: 'firstMonth',
    name: '月度会员',
    description: '使用应用满1个月',
    icon: '📆',
    category: 'time',
    condition: (stats) => stats.daysSinceRegistration >= 30,
    reward: { type: 'badge', value: 'monthly' },
  },
  oneYear: {
    id: 'oneYear',
    name: '年度会员',
    description: '使用应用满1年',
    icon: '🎊',
    category: 'time',
    condition: (stats) => stats.daysSinceRegistration >= 365,
    reward: { type: 'badge', value: 'yearly' },
  },
  
  // 特殊成就
  earlyBird: {
    id: 'earlyBird',
    name: '早起鸟',
    description: '在早上6点前完成训练',
    icon: '🌅',
    category: 'special',
    condition: (stats) => stats.earlyMorningWorkouts >= 1,
    reward: { type: 'badge', value: 'earlyBird' },
  },
  nightOwl: {
    id: 'nightOwl',
    name: '夜猫子',
    description: '在晚上10点后完成训练',
    icon: '🦉',
    category: 'special',
    condition: (stats) => stats.lateNightWorkouts >= 1,
    reward: { type: 'badge', value: 'nightOwl' },
  },
  weekendWarrior: {
    id: 'weekendWarrior',
    name: '周末战士',
    description: '在周末完成训练',
    icon: '⚔️',
    category: 'special',
    condition: (stats) => stats.weekendWorkouts >= 1,
    reward: { type: 'badge', value: 'weekendWarrior' },
  },
};

/**
 * 徽章定义
 */
const BADGES = {
  beginner: { name: '新手', color: '#95a5a6', icon: '🌱' },
  dedicated: { name: '专注', color: '#3498db', icon: '💪' },
  veteran: { name: '老手', color: '#9b59b6', icon: '🔥' },
  legend: { name: '传奇', color: '#f39c12', icon: '👑' },
  consistent: { name: '坚持', color: '#2ecc71', icon: '📅' },
  committed: { name: '承诺', color: '#1abc9c', icon: '🌟' },
  champion: { name: '冠军', color: '#e74c3c', icon: '🏆' },
  strong: { name: '强壮', color: '#e67e22', icon: '🦾' },
  powerlifter: { name: '力量举', color: '#34495e', icon: '🎯' },
  elite: { name: '精英', color: '#f1c40f', icon: '🏅' },
  monthly: { name: '月度', color: '#27ae60', icon: '📆' },
  yearly: { name: '年度', color: '#8e44ad', icon: '🎊' },
  earlyBird: { name: '早起', color: '#f39c12', icon: '🌅' },
  nightOwl: { name: '夜猫', color: '#2c3e50', icon: '🦉' },
  weekendWarrior: { name: '周末', color: '#16a085', icon: '⚔️' },
};

/**
 * 成就系统类
 */
class AchievementSystem {
  constructor() {
    this.unlockedAchievements = [];
    this.earnedBadges = [];
    this.registrationDate = null;
    this.loadFromStorage();
  }
  
  /**
   * 从本地存储加载数据
   */
  loadFromStorage() {
    try {
      const savedAchievements = localStorage.getItem('fittrack_achievements');
      const savedBadges = localStorage.getItem('fittrack_badges');
      const savedRegDate = localStorage.getItem('fittrack_registration_date');
      
      if (savedAchievements) this.unlockedAchievements = JSON.parse(savedAchievements);
      if (savedBadges) this.earnedBadges = JSON.parse(savedBadges);
      if (savedRegDate) this.registrationDate = new Date(savedRegDate);
    } catch (e) {
      console.error('加载成就数据失败:', e);
    }
  }
  
  /**
   * 保存数据到本地存储
   */
  saveToStorage() {
    try {
      localStorage.setItem('fittrack_achievements', JSON.stringify(this.unlockedAchievements));
      localStorage.setItem('fittrack_badges', JSON.stringify(this.earnedBadges));
      if (this.registrationDate) {
        localStorage.setItem('fittrack_registration_date', this.registrationDate.toISOString());
      }
    } catch (e) {
      console.error('保存成就数据失败:', e);
    }
  }
  
  /**
   * 设置注册日期
   */
  setRegistrationDate(date) {
    this.registrationDate = date;
    this.saveToStorage();
  }
  
  /**
   * 检查并解锁成就
   */
  checkAchievements(stats) {
    const newAchievements = [];
    
    // 计算额外统计
    const enhancedStats = {
      ...stats,
      daysSinceRegistration: this.registrationDate 
        ? Math.floor((Date.now() - this.registrationDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0,
    };
    
    Object.values(ACHIEVEMENTS).forEach(achievement => {
      if (!this.unlockedAchievements.includes(achievement.id)) {
        if (achievement.condition(enhancedStats)) {
          this.unlockedAchievements.push(achievement.id);
          if (achievement.reward && achievement.reward.type === 'badge') {
            if (!this.earnedBadges.includes(achievement.reward.value)) {
              this.earnedBadges.push(achievement.reward.value);
            }
          }
          newAchievements.push(achievement);
        }
      }
    });
    
    if (newAchievements.length > 0) {
      this.saveToStorage();
    }
    
    return newAchievements;
  }
  
  /**
   * 获取所有成就状态
   */
  getAchievementStatus() {
    return Object.values(ACHIEVEMENTS).map(achievement => ({
      ...achievement,
      unlocked: this.unlockedAchievements.includes(achievement.id),
      badge: achievement.reward?.value ? BADGES[achievement.reward.value] : null,
    }));
  }
  
  /**
   * 获取已解锁的成就
   */
  getUnlockedAchievements() {
    return Object.values(ACHIEVEMENTS)
      .filter(a => this.unlockedAchievements.includes(a.id))
      .map(a => ({
        ...a,
        badge: a.reward?.value ? BADGES[a.reward.value] : null,
        unlockedAt: this.getUnlockDate(a.id),
      }));
  }
  
  /**
   * 获取已获得的徽章
   */
  getEarnedBadges() {
    return this.earnedBadges.map(badgeId => ({
      id: badgeId,
      ...BADGES[badgeId],
    }));
  }
  
  /**
   * 获取成就解锁日期
   */
  getUnlockDate(achievementId) {
    const record = localStorage.getItem(`fittrack_achievement_${achievementId}`);
    return record ? new Date(record) : null;
  }
  
  /**
   * 获取成就进度
   */
  getAchievementProgress(stats) {
    const progress = {};
    
    Object.values(ACHIEVEMENTS).forEach(achievement => {
      if (!this.unlockedAchievements.includes(achievement.id)) {
        progress[achievement.id] = this.calculateProgress(achievement, stats);
      }
    });
    
    return progress;
  }
  
  /**
   * 计算单个成就进度
   */
  calculateProgress(achievement, stats) {
    // 根据成就类型计算进度
    if (achievement.id.includes('Workout')) {
      const target = parseInt(achievement.id.match(/\d+/)?.[0] || 10);
      return Math.min(100, Math.round(stats.totalWorkouts / target * 100));
    }
    if (achievement.id.includes('Streak')) {
      const target = parseInt(achievement.id.match(/\d+/)?.[0] || 7);
      return Math.min(100, Math.round(stats.streak / target * 100));
    }
    if (achievement.id.includes('Volume')) {
      const target = parseInt(achievement.id.match(/\d+/)?.[0] || 1000);
      return Math.min(100, Math.round(stats.totalVolume / target * 100));
    }
    return 0;
  }
  
  /**
   * 获取统计概览
   */
  getStatsOverview() {
    return {
      totalUnlocked: this.unlockedAchievements.length,
      totalAchievements: Object.keys(ACHIEVEMENTS).length,
      totalBadges: this.earnedBadges.length,
      totalBadgeTypes: Object.keys(BADGES).length,
    };
  }
  
  /**
   * 导出成就数据
   */
  exportData() {
    return {
      achievements: this.unlockedAchievements,
      badges: this.earnedBadges,
      registrationDate: this.registrationDate,
      exportedAt: new Date().toISOString(),
    };
  }
  
  /**
   * 导入成就数据
   */
  importData(data) {
    if (data.achievements) this.unlockedAchievements = data.achievements;
    if (data.badges) this.earnedBadges = data.badges;
    if (data.registrationDate) this.registrationDate = new Date(data.registrationDate);
    this.saveToStorage();
  }
  
  /**
   * 清空所有数据
   */
  clearAll() {
    this.unlockedAchievements = [];
    this.earnedBadges = [];
    this.registrationDate = null;
    this.saveToStorage();
  }
}

// 创建全局成就系统实例
const achievementSystem = new AchievementSystem();