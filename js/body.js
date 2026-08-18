const Body = {
  chart: null,

  init() {
    this.form = document.getElementById('body-form');
    this.dateInput = document.getElementById('body-date');
    this.weightInput = document.getElementById('body-weight');
    this.historyEl = document.getElementById('body-history');

    if (!this.dateInput.value) {
      this.dateInput.value = formatDate(new Date());
    }

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addRecord();
    });
  },

  async addRecord() {
    const weight = parseFloat(this.weightInput.value);
    if (!weight || weight <= 0) {
      showToast('请输入有效体重');
      return;
    }
    const date = this.dateInput.value || formatDate(new Date());
    await Storage.addBodyRecord({ date, weight });
    showToast('体重已记录');
    this.weightInput.value = '';
    this.refresh();
  },

  async refresh() {
    await this.updateSummary();
    await this.renderChart();
    await this.renderHistory();
  },

  async updateSummary() {
    const records = await Storage.getBodyRecords();
    const profile = await Storage.getProfile();
    const height = parseFloat(profile.height) || 0;

    document.getElementById('body-total').textContent = records.length;
    const latestEl = document.getElementById('body-latest');
    const changeEl = document.getElementById('body-change');
    const bmiEl = document.getElementById('body-bmi');
    const bmiLabel = document.getElementById('body-bmi-label');

    if (records.length === 0) {
      latestEl.textContent = '--';
      changeEl.textContent = '--';
      bmiEl.textContent = '--';
      bmiLabel.textContent = 'BMI';
      return;
    }

    const latest = records[records.length - 1];
    latestEl.textContent = latest.weight.toFixed(1);

    if (records.length > 1) {
      const prev = records[records.length - 2];
      const diff = latest.weight - prev.weight;
      changeEl.textContent = (diff >= 0 ? '+' : '') + diff.toFixed(1);
      changeEl.style.color = diff > 0 ? 'var(--warning)' : 'var(--primary)';
    } else {
      changeEl.textContent = '--';
      changeEl.style.color = '';
    }

    if (height > 0) {
      const bmi = latest.weight / Math.pow(height / 100, 2);
      bmiEl.textContent = bmi.toFixed(1);
      if (bmi < 18.5) {
        bmiLabel.textContent = 'BMI · 偏瘦';
      } else if (bmi < 24) {
        bmiLabel.textContent = 'BMI · 正常';
      } else if (bmi < 28) {
        bmiLabel.textContent = 'BMI · 超重';
      } else {
        bmiLabel.textContent = 'BMI · 肥胖';
      }
    } else {
      bmiEl.textContent = '--';
      bmiLabel.textContent = 'BMI（设置身高后可见）';
    }
  },

  async renderChart() {
    const records = await Storage.getBodyRecords();
    const ctx = document.getElementById('chart-body');
    if (this.chart) this.chart.destroy();

    if (records.length === 0) {
      ctx.style.display = 'none';
      let empty = ctx.parentElement.querySelector('.chart-empty');
      if (!empty) {
        empty = document.createElement('p');
        empty.className = 'chart-empty';
        empty.textContent = '暂无体重记录，先记录一次体重吧';
        ctx.parentElement.appendChild(empty);
      }
      return;
    }
    ctx.style.display = '';
    const empty = ctx.parentElement.querySelector('.chart-empty');
    if (empty) empty.remove();

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: records.map((r) => r.date),
        datasets: [
          {
            label: '体重 (kg)',
            data: records.map((r) => r.weight),
            borderColor: '#16a34a',
            backgroundColor: 'rgba(22, 163, 74, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: '#16a34a',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: false,
            ticks: { color: '#64748b' },
            grid: { color: '#eef1f6' },
          },
          x: {
            ticks: { color: '#64748b', maxRotation: 45 },
            grid: { display: false },
          },
        },
      },
    });
  },

  async renderHistory() {
    const records = await Storage.getBodyRecords();

    if (records.length === 0) {
      this.historyEl.innerHTML = '<p class="empty-state">暂无体重记录</p>';
      return;
    }

    this.historyEl.innerHTML = records
      .slice()
      .reverse()
      .map((r, i) => {
        const idx = records.length - 1 - i;
        const change =
          idx > 0
            ? (() => {
                const diff = records[idx].weight - records[idx - 1].weight;
                return `<span class="body-record-change">${diff >= 0 ? '+' : ''}${diff.toFixed(1)}</span>`;
              })()
            : '';
        return `
        <div class="body-record">
          <span class="body-record-date">${r.date}</span>
          <div>
            ${change}
            <strong>${r.weight.toFixed(1)} kg</strong>
          </div>
          <button class="btn-icon btn-danger-icon" data-delete-body="${idx}">✕</button>
        </div>`;
      })
      .join('');

    this.historyEl.querySelectorAll('[data-delete-body]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await Storage.deleteBodyRecord(parseInt(btn.dataset.deleteBody));
        this.refresh();
        showToast('记录已删除');
      });
    });
  },
};
