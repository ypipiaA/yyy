/**
 * FitTrack 成就系统UI模块
 */

const AchievementsUI = {
  init() {
    this.refresh();
  },

  refresh() {
    this.updateStats();
    this.renderBadges();
    this.renderAchievements();
  },

  updateStats() {
    const overview = achievementSystem.getStatsOverview();
    
    document.getElementById('achievements-unlocked').textContent = overview.totalUnlocked;
    document.getElementById('achievements-total').textContent = overview.totalAchievements;
    document.getElementById('badges-earned').textContent = overview.totalBadges;
  },

  renderBadges() {
    const container = document.getElementById('earned-badges');
    const badges = achievementSystem.getEarnedBadges();

    if (badges.length === 0) {
      container.innerHTML = '<p class="empty-state">还没有获得任何徽章</p>';
      return;
    }

    container.innerHTML = badges.map(badge => `
      <div class="badge-item" style="border-color: ${badge.color}">
        <span class="badge-icon">${badge.icon}</span>
        <span class="badge-name">${badge.name}</span>
      </div>
    `).join('');
  },

  renderAchievements() {
    const container = document.getElementById('achievements-list');
    const achievements = achievementSystem.getAchievementStatus();

    container.innerHTML = achievements.map(achievement => `
      <div class="achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}">
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-info">
          <div class="achievement-name">${achievement.name}</div>
          <div class="achievement-description">${achievement.description}</div>
          ${achievement.badge ? `
            <div class="achievement-reward">
              奖励徽章: <span style="color: ${achievement.badge.color}">${achievement.badge.icon} ${achievement.badge.name}</span>
            </div>
          ` : ''}
        </div>
        <div class="achievement-status">
          ${achievement.unlocked ? '✅' : '🔒'}
        </div>
      </div>
    `).join('');
  },

  checkNewAchievements(stats) {
    const newAchievements = achievementSystem.checkAchievements(stats);
    
    if (newAchievements.length > 0) {
      newAchievements.forEach(achievement => {
        this.showAchievementPopup(achievement);
      });
      this.refresh();
    }
  },

  showAchievementPopup(achievement) {
    const popup = document.createElement('div');
    popup.className = 'achievement-popup';
    popup.innerHTML = `
      <div class="achievement-popup-content">
        <div class="achievement-popup-icon">${achievement.icon}</div>
        <div class="achievement-popup-title">成就解锁!</div>
        <div class="achievement-popup-name">${achievement.name}</div>
        <div class="achievement-popup-description">${achievement.description}</div>
      </div>
    `;
    
    document.body.appendChild(popup);
    
    setTimeout(() => {
      popup.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      popup.classList.remove('show');
      setTimeout(() => popup.remove(), 300);
    }, 3000);
  },
};