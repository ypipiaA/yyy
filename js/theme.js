/**
 * FitTrack 主题系统模块
 * 支持深色模式、浅色模式、跟随系统、自定义主题
 *
 * 变量名与 css/style.css 的 :root / .theme-* 定义一一对应。
 * 未做显式选择（localStorage 无记录）时不注入内联变量，
 * 保持 CSS `prefers-color-scheme` 媒体查询的原生行为。
 */

const THEMES = {
  light: {
    name: '浅色模式',
    icon: '☀️',
    // meta theme-color：浅色用品牌绿
    metaColor: '#16a34a',
    vars: {
      '--bg': '#ffffff',
      '--bg-soft': '#f4f6fa',
      '--surface': '#ffffff',
      '--surface-hover': '#f1f5f9',
      '--border': '#e6eaf0',
      '--text': '#1e293b',
      '--text-muted': '#64748b',
      '--primary': '#16a34a',
      '--primary-dark': '#15803d',
      '--primary-soft': 'rgba(22, 163, 74, 0.1)',
      '--accent': '#3b82f6',
      '--danger': '#dc2626',
      '--warning': '#d97706',
      '--shadow': '0 1px 3px rgba(15, 23, 42, 0.05), 0 4px 16px rgba(15, 23, 42, 0.06)',
      '--shadow-lg': '0 12px 40px rgba(15, 23, 42, 0.12)',
    },
  },

  dark: {
    name: '深色模式',
    icon: '🌙',
    metaColor: '#0f172a',
    vars: {
      '--bg': '#0f172a',
      '--bg-soft': '#1e293b',
      '--surface': '#1e293b',
      '--surface-hover': '#334155',
      '--border': '#334155',
      '--text': '#f1f5f9',
      '--text-muted': '#94a3b8',
      '--primary': '#22c55e',
      '--primary-dark': '#16a34a',
      '--primary-soft': 'rgba(34, 197, 94, 0.1)',
      '--accent': '#60a5fa',
      '--danger': '#f87171',
      '--warning': '#fbbf24',
      '--shadow': '0 1px 3px rgba(0, 0, 0, 0.2), 0 4px 16px rgba(0, 0, 0, 0.3)',
      '--shadow-lg': '0 12px 40px rgba(0, 0, 0, 0.4)',
    },
  },

  midnight: {
    name: '午夜蓝',
    icon: '🌑',
    metaColor: '#0a1929',
    vars: {
      '--bg': '#0a1929',
      '--bg-soft': '#132f4c',
      '--surface': '#132f4c',
      '--surface-hover': '#1a3a5c',
      '--border': '#1a3a5c',
      '--text': '#e3f2fd',
      '--text-muted': '#90caf9',
      '--primary': '#4caf50',
      '--primary-dark': '#388e3c',
      '--primary-soft': 'rgba(76, 175, 80, 0.1)',
      '--accent': '#42a5f5',
      '--danger': '#ef5350',
      '--warning': '#ffa726',
      '--shadow': '0 1px 3px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.4)',
      '--shadow-lg': '0 12px 40px rgba(0, 0, 0, 0.5)',
    },
  },

  forest: {
    name: '森林绿',
    icon: '🌲',
    metaColor: '#f0fdf4',
    vars: {
      '--bg': '#f0fdf4',
      '--bg-soft': '#dcfce7',
      '--surface': '#ffffff',
      '--surface-hover': '#bbf7d0',
      '--border': '#bbf7d0',
      '--text': '#14532d',
      '--text-muted': '#166534',
      '--primary': '#15803d',
      '--primary-dark': '#166534',
      '--primary-soft': 'rgba(21, 128, 61, 0.1)',
      '--accent': '#059669',
      '--danger': '#dc2626',
      '--warning': '#eab308',
      '--shadow': '0 1px 3px rgba(21, 128, 61, 0.1), 0 4px 16px rgba(21, 128, 61, 0.15)',
      '--shadow-lg': '0 12px 40px rgba(21, 128, 61, 0.2)',
    },
  },
};

/** 字号档位（类常量） */
const FONT_SIZES = {
  small: '14px',
  medium: '16px',
  large: '18px',
  xlarge: '20px',
};

/**
 * 主题控制器
 */
class ThemeController {
  constructor() {
    this.currentTheme = 'light';
    this.followSystem = false;
    // 用户是否做过显式选择；否则不注入内联变量，保持 CSS 原生表现
    this.hasExplicitChoice = false;
    this.mediaQuery = null;
    this.loadFromStorage();
    this.initSystemListener();
  }

  loadFromStorage() {
    try {
      const savedTheme = localStorage.getItem('fittrack_theme');
      const savedFollowSystem = localStorage.getItem('fittrack_theme_follow_system');

      if (savedTheme && THEMES[savedTheme]) {
        this.currentTheme = savedTheme;
        this.hasExplicitChoice = true;
      }
      if (savedFollowSystem !== null) {
        this.followSystem = savedFollowSystem === 'true';
        if (this.followSystem) this.hasExplicitChoice = true;
      }

      if (this.followSystem) {
        this.detectSystemTheme();
      }

      this.applyTheme();
    } catch (e) {
      console.error('加载主题设置失败:', e);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('fittrack_theme', this.currentTheme);
      localStorage.setItem('fittrack_theme_follow_system', this.followSystem.toString());
    } catch (e) {
      console.error('保存主题设置失败:', e);
    }
  }

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

  detectSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.currentTheme = 'dark';
    } else {
      this.currentTheme = 'light';
    }
  }

  applyTheme() {
    const theme = THEMES[this.currentTheme];
    if (!theme) return;

    const root = document.documentElement;
    const applyToBody = () => {
      if (!document.body) return;
      document.body.classList.remove('theme-light', 'theme-dark', 'theme-midnight', 'theme-forest');
      if (this.hasExplicitChoice) {
        document.body.classList.add(`theme-${this.currentTheme}`);
      }
    };

    if (!this.hasExplicitChoice) {
      // 未显式选择：清掉可能残留的内联变量，交还 CSS 控制
      Object.keys(theme.vars).forEach((property) => root.style.removeProperty(property));
      applyToBody();
      return;
    }

    Object.entries(theme.vars).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.content = theme.metaColor;
    }

    applyToBody();
  }

  setTheme(themeName) {
    if (THEMES[themeName]) {
      this.currentTheme = themeName;
      this.followSystem = false;
      this.hasExplicitChoice = true;
      this.applyTheme();
      this.saveToStorage();
    }
  }

  setFollowSystem(follow) {
    this.followSystem = follow;
    this.hasExplicitChoice = true;
    if (follow) {
      this.detectSystemTheme();
    }
    this.applyTheme();
    this.saveToStorage();
  }

  getCurrentTheme() {
    return {
      name: this.currentTheme,
      ...THEMES[this.currentTheme],
      followSystem: this.followSystem,
    };
  }

  getAvailableThemes() {
    return Object.entries(THEMES).map(([key, theme]) => ({
      id: key,
      ...theme,
      current: key === this.currentTheme,
    }));
  }

  toggleTheme() {
    const themes = Object.keys(THEMES);
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
  }
}

/**
 * 字体大小控制器
 */
class FontSizeController {
  constructor() {
    this.fontSize = 'medium';
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('fittrack_font_size');
      if (saved && FONT_SIZES[saved]) this.fontSize = saved;
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
    document.documentElement.style.setProperty(
      '--font-size-base',
      FONT_SIZES[this.fontSize] || '16px'
    );
  }

  setFontSize(size) {
    if (FONT_SIZES[size]) {
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
      { id: 'small', name: '小', value: FONT_SIZES.small },
      { id: 'medium', name: '中', value: FONT_SIZES.medium },
      { id: 'large', name: '大', value: FONT_SIZES.large },
      { id: 'xlarge', name: '特大', value: FONT_SIZES.xlarge },
    ];
  }
}

/**
 * 动画控制器
 */
class AnimationController {
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
    const apply = () => {
      if (!document.body) return;
      if (this.enabled) {
        document.body.classList.remove('no-animations');
      } else {
        document.body.classList.add('no-animations');
      }
    };
    if (document.body) {
      apply();
    } else {
      document.addEventListener('DOMContentLoaded', apply);
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
const themeManager = new ThemeController();
const fontSizeManager = new FontSizeController();
const animationManager = new AnimationController();

// body 在脚本执行时已存在（脚本位于 </body> 前），但保险起见等 DOM 就绪后再同步一次主题类
document.addEventListener('DOMContentLoaded', () => {
  themeManager.applyTheme();
  animationManager.applyAnimations();
});

/**
 * 统一门面：供设置页与控制台调用
 * （ThemeManager.setTheme / setFontSize / toggleAnimations 均可安全调用）
 */
const ThemeManager = {
  setTheme: (name) => themeManager.setTheme(name),
  setFollowSystem: (follow) => themeManager.setFollowSystem(follow),
  toggleTheme: () => themeManager.toggleTheme(),
  getCurrentTheme: () => themeManager.getCurrentTheme(),
  getAvailableThemes: () => themeManager.getAvailableThemes(),
  setFontSize: (size) => fontSizeManager.setFontSize(size),
  getFontSize: () => fontSizeManager.getFontSize(),
  toggleAnimations: () => animationManager.toggle(),
  setAnimationsEnabled: (enabled) => animationManager.setEnabled(enabled),
  isAnimationsEnabled: () => animationManager.isEnabled(),
};
