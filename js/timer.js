const Timer = {
  seconds: 90,
  remaining: 90,
  interval: null,
  running: false,
  ring: null,
  RING_RADIUS: 88,
  RING_CIRC: 2 * Math.PI * 88,

  init() {
    this.display = document.getElementById('timer-display');
    this.ring = document.getElementById('timer-ring');
    this.startBtn = document.getElementById('timer-start');
    this.pauseBtn = document.getElementById('timer-pause');
    this.resetBtn = document.getElementById('timer-reset');
    this.addBtn = document.getElementById('timer-add');
    this.customInput = document.getElementById('timer-custom');
    this.presets = document.querySelectorAll('.btn-preset');

    this.startBtn.addEventListener('click', () => this.start());
    this.pauseBtn.addEventListener('click', () => this.pause());
    this.resetBtn.addEventListener('click', () => this.reset());
    this.addBtn.addEventListener('click', () => this.addTime());

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

    this.updateRing();
    this.updateDisplay();
  },

  setTime(seconds) {
    this.seconds = seconds;
    this.remaining = seconds;
    this.updateDisplay();
  },

  addTime() {
    if (this.running) return;
    this.remaining = Math.min(this.remaining + 30, 999);
    this.updateDisplay();
  },

  formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },

  updateRing() {
    const ratio = Math.max(this.remaining / this.seconds, 0);
    this.ring.style.strokeDasharray = `${this.RING_CIRC * ratio} ${this.RING_CIRC}`;
  },

  updateDisplay() {
    this.display.textContent = this.formatTime(this.remaining);
    this.display.classList.remove('warning', 'danger');
    this.ring.classList.remove('warning', 'danger');
    if (this.remaining <= 10 && this.remaining > 0) {
      this.display.classList.add('danger');
      this.ring.classList.add('danger');
    } else if (this.remaining <= 30) {
      this.display.classList.add('warning');
      this.ring.classList.add('warning');
    }
    this.updateRing();
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

    playBeep();
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    showToast('休息结束，继续训练！');
    this.remaining = this.seconds;
    setTimeout(() => this.updateDisplay(), 2000);
  },
};

function playBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    [880, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.25;
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  } catch (e) {
    /* 音频不可用时静默忽略 */
  }
}
