/**
 * FitTrack 主题系统模块
 * 支持深色模式、浅色模式、跟随系统、自定义主题
 */

/**
 * 主题配置
 */
const THEMES = {
  light: {
    name: '浅色模式',
    icon: '☀️',
    colors: {
      // 背景色
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f8fafc',
      '--bg-tertiary': '#f1f5f9',
      '--bg-card': '#ffffff',
      '--bg-input': '#f8fafc',
      
      // 文字色
      '--text-primary': '#1e293b',
      '--text-secondary': '#475569',
      '--text-muted': '#94a3b8',
      
      // 主题色
      '--primary': '#16a34a',
      '--primary-light': '#22c55e',
      '--primary-dark': '#15803d',
      
      // 强调色
      '--accent': '#3b82f6',
      '--accent-light': '#60a5fa',
      
      // 状态色
      '--success': '#22c55e',
      '--warning': '#f59e0b',
      '--danger': '#ef4444',
      '--info': '#3b82f6',
      
      // 边框
      '--border': '#e2e8f0',
      '--border-light': '#f1f5f9',
      
      // 阴影
      '--shadow-sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      '--shadow': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      '--shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      '--shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      
      // 图表色
      '--chart-1': '#16a34a',
      '--chart-2': '#3b82f6',
      '--chart-3': '#f59e0b',
      '--chart-4': '#ef4444',
      '--chart-5': '#8b5cf6',
    },
  },
  
  dark: {
    name: '深色模式',
    icon: '🌙',
    colors: {
      '--bg-primary': '#0f172a',
      '--bg-secondary': '#1e293b',
      '--bg-tertiary': '#334155',
      '--bg-card': '#1e293b',
      '--bg-input': '#334155',
      
      '--text-primary': '#f1f5f9',
      '--text-secondary': '#cbd5e1',
      '--text-muted': '#64748b',
      
      '--primary': '#22c55e',
      '--primary-light': '#4ade80',
      '--primary-dark': '#16a34a',
      
      '--accent': '#60a5fa',
      '--accent-light': '#93c5fd',
      
      '--success': '#4ade80',
      '--warning': '#fbbf24',
      '--danger': '#f87171',
      '--info': '#60a5fa',
      
      '--border': '#334155',
      '--border-light': '#475569',
      
      '--shadow-sm': '0 1px 2px 0 rgb(0 0 0 / 0.3)',
      '--shadow': '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
      '--shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
      '--shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
      
      '--chart-1': '#4ade80',
      '--chart-2': '#60a5fa',
      '--chart-3': '#fbbf24',
      '--chart-4': '#f87171',
      '--chart-5': '#a78bfa',
    },
  },
  
  midnight: {
    name: '午夜蓝',
    icon: '🌑',
    colors: {
      '--bg-primary': '#0a1929',
      '--bg-secondary': '#132f4c',
      '--bg-tertiary': '#1a3a5c',
      '--bg-card': '#132f4c',
      '--bg-input': '#1a3a5c',
      
      '--text-primary': '#e3f2fd',
      '--text-secondary': '#90caf9',
      '--text-muted': '#546e7a',
      
      '--primary': '#4caf50',
      '--primary-light': '#66bb6a',
      '--primary-dark': '#388e3c',
      
      '--accent': '#42a5f5',
      '--accent-light': '#64b5f6',
      
      '--success': '#66bb6a',
      '--warning': '#ffa726',
      '--danger': '#ef5350',
      '--info': '#42a5f5',
      
      '--border': '#1a3a5c',
      '--border-light': '#2a4a6c',
      
      '--shadow-sm': '0 1px 2px 0 rgb(0 0 0 / 0.4)',
      '--shadow': '0 1px 3px 0 rgb(0 0 0 / 0.5), 0 1px 2px -1px rgb(0 0 0 / 0.4)',
      '--shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
      '--shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
      
      '--chart-1': '#66bb6a',
      '--chart-2': '#42a5f5',
      '--chart-3': '#ffa726',
      '--chart-4': '#ef5350',
      '--chart-5': '#ab47bc',
    },
  },
  
  forest: {
    name: '森林绿',
    icon: '🌲',
    colors: {
      '--bg-primary': '#f0fdf4',
      '--bg-secondary': '#dcfce7',
      '--bg-tertiary': '#bbf7d0',
      '--bg-card': '#ffffff',
      '--bg-input': '#f0fdf4',
      
      '--text-primary': '#14532d',
      '--text-secondary': '#166534',
      '--text-muted': '#15803d',
      
      '--primary': '#15803d',
      '--primary-light': '#22c55e',
      '--primary-dark': '#166534',
      
      '--accent': '#059669',
      '--accent-light': '#34d399',
      
      '--success': '#22c55e',
      '--warning': '#eab308',
      '--danger': '#dc2626',
      '--info': '#0891b2',
      
      '--border': '#bbf7d0',
      '--border-light': '#dcfce7',
      
      '--shadow-sm': '0 1px 2px 0 rgb(21 128 61 / 0.1)',
      '--shadow': '0 1px 3px 0 rgb(21 128 61 / 0.15), 0 1px 2px -1px rgb(21 128 61 / 0.1)',
      '--shadow-md': '0 4px 6px -1px rgb(21 128 61 / 0.15), 0 2px 4px -2px rgb(21 128 61 / 0.1)',
      '--shadow-lg': '0 10px 15px -3px rgb(21 128 61 / 0.15), 0 4px 6px -4px rgb(21 128 61 / 0.1)',
      
      '--chart-1': '#15803d',
      '--chart-2': '#059669',
      '--chart-3': '#eab308',
      '--chart-4': '#dc2626',
      '--chart-5': '#7c3aed',
    },
  },
};

/**
 * 主题管理器类
 */
class ThemeManager {
  constructor() {
    this.currentTheme = 'light';
    this.followSystem = false;
    this.mediaQuery = null;
    this.loadFromStorage();
    this.initSystemListener();
  }
  
  /**
   * 从本地存储加载主题设置
   */
  loadFromStorage() {
    try {
      const savedTheme = localStorage.getItem('fittrack_theme');
      const savedFollowSystem = localStorage.getItem('fittrack_theme_follow_system');
      
      if (savedTheme) this.currentTheme = savedTheme;
      if (savedFollowSystem !== null) this.followSystem = savedFollowSystem === 'true';
      
      if (this.followSystem) {
        this.detectSystemTheme();
      }
      
      this.applyTheme();
    } catch (e) {
      console.error('加载主题设置失败:', e);
    }
  }
  
  /**
   * 保存主题设置到本地存储
   */
  saveToStorage() {
    try {
      localStorage.setItem('fittrack_theme', this.currentTheme);
      localStorage.setItem('fittrack_theme_follow_system', this.followSystem.toString());
    } catch (e) {
      console.error('保存主题设置失败:', e);
    }
  }
  
  /**
   * 初始化系统主题监听
   */
  initSystemListener() {
    if (window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', (e) => {
        if (this.followSystem) {
          this.currentTheme = e.matches ? 'dark' : 'light';
          this.applyTheme();
        }
      });
    }
  }
  
  /**
   * 检测系统主题
   */
  detectSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.currentTheme = 'dark';
    } else {
      this.currentTheme = 'light';
    }
  }
  
  /**
   * 应用主题
   */
  applyTheme() {
    const theme = THEMES[this.currentTheme];
    if (!theme) return;
    
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    
    // 更新meta主题色
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.content = theme.colors['--bg-primary'];
    }
    
    // 更新body类
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-midnight', 'theme-forest');
    document.body.classList.add(`theme-${this.currentTheme}`);
  }
  
  /**
   * 设置主题
   */
  setTheme(themeName) {
    if (THEMES[themeName]) {
      this.currentTheme = themeName;
      this.followSystem = false;
      this.applyTheme();
      this.saveToStorage();
    }
  }
  
  /**
   * 设置是否跟随系统
   */
  setFollowSystem(follow) {
    this.followSystem = follow;
    if (follow) {
      this.detectSystemTheme();
      this.applyTheme();
    }
    this.saveToStorage();
  }
  
  /**
   * 获取当前主题
   */
  getCurrentTheme() {
    return {
      name: this.currentTheme,
      ...THEMES[this.currentTheme],
      followSystem: this.followSystem,
    };
  }
  
  /**
   * 获取所有可用主题
   */
  getAvailableThemes() {
    return Object.entries(THEMES).map(([key, theme]) => ({
      id: key,
      ...theme,
      current: key === this.currentTheme,
    }));
  }
  
  /**
   * 切换主题
   */
  toggleTheme() {
    const themes = Object.keys(THEMES);
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
  }
}

/**
 * 字体大小管理
 */
class FontSizeManager {
  constructor() {
    this.fontSize = 'medium';
    this.loadFromStorage();
  }
  
  loadFromStorage() {
    try {
      const saved = localStorage.getItem('fittrack_font_size');
      if (saved) this.fontSize = saved;
      this.applyFontSize();
    } catch (e) {
      console.error('加载字体大小设置失败:', e);
    }
  }
  
  saveToStorage() {
    try {
      localStorage.setItem('fittrack_font_size', this.fontSize);
    } catch (e) {
      console.error('保存字体大小设置失败:', e);
    }
  }
  
  applyFontSize() {
    const sizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xlarge: '20px',
    };
    document.documentElement.style.setProperty('--font-size-base', sizes[this.fontSize] || '16px');
  }
  
  setFontSize(size) {
    if (sizes[size] || sizes[size] === 0) {
      this.fontSize = size;
      this.applyFontSize();
      this.saveToStorage();
    }
  }
  
  getFontSize() {
    return this.fontSize;
  }
  
  getAvailableSizes() {
    return [
      { id: 'small', name: '小', value: '14px' },
      { id: 'medium', name: '中', value: '16px' },
      { id: 'large', name: '大', value: '18px' },
      { id: 'xlarge', name: '特大', value: '20px' },
    ];
  }
}

/**
 * 动画管理
 */
class AnimationManager {
  constructor() {
    this.enabled = true;
    this.loadFromStorage();
  }
  
  loadFromStorage() {
    try {
      const saved = localStorage.getItem('fittrack_animations');
      if (saved !== null) this.enabled = saved === 'true';
      this.applyAnimations();
    } catch (e) {
      console.error('加载动画设置失败:', e);
    }
  }
  
  saveToStorage() {
    try {
      localStorage.setItem('fittrack_animations', this.enabled.toString());
    } catch (e) {
      console.error('保存动画设置失败:', e);
    }
  }
  
  applyAnimations() {
    if (this.enabled) {
      document.body.classList.remove('no-animations');
    } else {
      document.body.classList.add('no-animations');
    }
  }
  
  setEnabled(enabled) {
    this.enabled = enabled;
    this.applyAnimations();
    this.saveToStorage();
  }
  
  toggle() {
    this.setEnabled(!this.enabled);
  }
  
  isEnabled() {
    return this.enabled;
  }
}

// 创建全局实例
const themeManager = new ThemeManager();
const fontSizeManager = new FontSizeManager();
const animationManager = new AnimationManager();