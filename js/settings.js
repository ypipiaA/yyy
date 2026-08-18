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

  exportData() {
    const payload = Storage.exportAll();
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
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result);
        if (!Storage.importAll(json)) {
          showToast('导入失败：文件格式不正确');
          return;
        }
        showToast('数据导入成功');
        setTimeout(() => location.reload(), 600);
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
