const Settings = {
  init() {
    this.nameInput = document.getElementById('profile-name');
    this.heightInput = document.getElementById('profile-height');
    this.loadProfile();

    document.getElementById('profile-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveProfile();
    });

    document.getElementById('export-data').addEventListener('click', () => this.exportData());
    document.getElementById('import-data').addEventListener('click', () =>
      document.getElementById('import-file').click()
    );
    document.getElementById('import-file').addEventListener('change', (e) => this.importData(e));
    document.getElementById('clear-data').addEventListener('click', () => this.clearData());

    this.initAppearance();
  },

  /**
   * 外观设置卡片接线。对应的 index.html 元素由 C 包落地（§2.9-⑤），
   * 元素不存在时静默跳过，保证本包单独合入不报错。
   */
  initAppearance() {
    const switcher = document.getElementById('theme-switcher');
    if (switcher) {
      const render = () => {
        switcher.innerHTML = '';
        themeManager.getAvailableThemes().forEach((theme) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'theme-btn' + (theme.current ? ' active' : '');
          btn.textContent = `${theme.icon} ${theme.name}`;
          btn.setAttribute('aria-pressed', theme.current ? 'true' : 'false');
          btn.addEventListener('click', () => {
            ThemeManager.setTheme(theme.id);
            render();
          });
          switcher.appendChild(btn);
        });
      };
      render();
    }

    const fontSelect = document.getElementById('font-size-select');
    if (fontSelect) {
      fontSelect.value = fontSizeManager.getFontSize();
      fontSelect.addEventListener('change', () => {
        ThemeManager.setFontSize(fontSelect.value);
      });
    }

    const animToggle = document.getElementById('animations-toggle');
    if (animToggle) {
      animToggle.checked = animationManager.isEnabled();
      animToggle.addEventListener('change', () => {
        animationManager.setEnabled(animToggle.checked);
      });
    }
  },

  async loadProfile() {
    const p = await Storage.getProfile();
    this.nameInput.value = p.name || '';
    this.heightInput.value = p.height || '';
  },

  async saveProfile() {
    await Storage.saveProfile({
      name: this.nameInput.value.trim(),
      height: this.heightInput.value.trim(),
    });
    showToast('个人资料已保存');
    updateGreeting();
  },

  async exportData() {
    const payload = await Storage.exportAll();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fittrack-backup-${formatDate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('数据已导出');
  },

  importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const json = JSON.parse(reader.result);
        const result = await Storage.importAll(json);
        if (!result.success) {
          showToast(
            result.skipped.length > 0
              ? `导入失败：${result.skipped.join('、')}格式不正确，已跳过`
              : '导入失败：文件格式不正确'
          );
          return;
        }
        if (result.skipped.length > 0) {
          showToast(`数据已导入，但 ${result.skipped.join('、')} 格式不正确，已跳过`);
        } else {
          showToast('数据导入成功');
        }
        setTimeout(() => location.reload(), 800);
      } catch (err) {
        showToast('导入失败：无法解析文件');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  },

  clearData() {
    if (!confirm('确定要清空所有数据吗？此操作不可恢复，建议先导出备份。')) return;
    Storage.clearAll();
    showToast('数据已清空');
    setTimeout(() => location.reload(), 600);
  },
};
