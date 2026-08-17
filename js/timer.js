const Timer = {
  seconds: 90,
  remaining: 90,
  interval: null,
  running: false,

  init() {
    this.display = document.getElementById('timer-display');
    this.startBtn = document.getElementById('timer-start');
    this.pauseBtn = document.getElementById('timer-pause');
    this.resetBtn = document.getElementById('timer-reset');
    this.customInput = document.getElementById('timer-custom');
    this.presets = document.querySelectorAll('.btn-preset');

    this.startBtn.addEventListener('click', () => this.start());
    this.pauseBtn.addEventListener('click', () => this.pause());
    this.resetBtn.addEventListener('click', () => this.reset());

    this.presets.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.presets.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.setTime(parseInt(btn.dataset.seconds));
      });
    });

    this.customInput.addEventListener('change', () => {
      this.presets.forEach((b) => b.classList.remove('active'));
      this.setTime(parseInt(this.customInput.value) || 90);
    });

    this.updateDisplay();
  },

  setTime(seconds) {
    this.seconds = seconds;
    this.remaining = seconds;
    this.updateDisplay();
  },

  formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },

  updateDisplay() {
    this.display.textContent = this.formatTime(this.remaining);
    this.display.classList.remove('warning', 'danger');
    if (this.remaining <= 10 && this.remaining > 0) {
      this.display.classList.add('danger');
    } else if (this.remaining <= 30) {
      this.display.classList.add('warning');
    }
  },

  start() {
    if (this.running) return;
    this.running = true;
    this.startBtn.classList.add('hidden');
    this.pauseBtn.classList.remove('hidden');

    this.interval = setInterval(() => {
      this.remaining--;
      this.updateDisplay();

      if (this.remaining <= 0) {
        this.complete();
      }
    }, 1000);
  },

  pause() {
    this.running = false;
    clearInterval(this.interval);
    this.startBtn.classList.remove('hidden');
    this.pauseBtn.classList.add('hidden');
    this.startBtn.textContent = '继续';
  },

  reset() {
    this.running = false;
    clearInterval(this.interval);
    this.remaining = this.seconds;
    this.updateDisplay();
    this.startBtn.classList.remove('hidden');
    this.pauseBtn.classList.add('hidden');
    this.startBtn.textContent = '开始';
  },

  complete() {
    this.running = false;
    clearInterval(this.interval);
    this.remaining = 0;
    this.updateDisplay();
    this.startBtn.classList.remove('hidden');
    this.pauseBtn.classList.add('hidden');
    this.startBtn.textContent = '开始';

    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    showToast('休息结束，继续训练！');
    this.remaining = this.seconds;
    setTimeout(() => this.updateDisplay(), 2000);
  },
};
