// Handcrafted Web Audio synthesizer for Coucou (Notch Buddy) companion sound effects

class CoucouSoundEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  public enabled: boolean = true;

  public init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        // Generate 1-second white noise buffer for clicks & wooshes
        const sampleRate = this.ctx.sampleRate;
        this.noiseBuffer = this.ctx.createBuffer(1, sampleRate, sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < sampleRate; i++) {
          data[i] = Math.random() * 2 - 1;
        }
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  tone({
    f = 440,
    to = 0,
    d = 0.15,
    type = 'sine' as OscillatorType,
    g = 0.05,
    a = 0.008,
    delay = 0,
    vib = 0,
    vibf = 6,
    h = 0,
  }) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const c = this.ctx;
      const t = c.currentTime + delay;
      const o = c.createOscillator();
      const gn = c.createGain();

      o.type = type;
      o.frequency.setValueAtTime(f, t);
      if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + d);

      if (vib) {
        const vo = c.createOscillator();
        const vg = c.createGain();
        vo.frequency.value = vibf;
        vg.gain.value = vib;
        vo.connect(o.frequency);
        vo.start(t);
        vo.stop(t + d + 0.1);
      }

      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.exponentialRampToValueAtTime(g, t + a);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + d);

      o.connect(gn);
      gn.connect(c.destination);
      o.start(t);
      o.stop(t + d + 0.05);

      if (h) {
        const o2 = c.createOscillator();
        o2.frequency.setValueAtTime(f * h, t);
        const g2 = c.createGain();
        g2.gain.setValueAtTime(0.0001, t);
        g2.gain.exponentialRampToValueAtTime(g * 0.3, t + a);
        g2.gain.exponentialRampToValueAtTime(0.0001, t + d * 0.35);
        o2.connect(g2);
        g2.connect(c.destination);
        o2.start(t);
        o2.stop(t + d);
      }
    } catch {}
  }

  noise({
    d = 0.2,
    g = 0.04,
    f = 1500,
    to = 0,
    q = 0.9,
    type = 'bandpass' as BiquadFilterType,
    delay = 0,
  }) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.noiseBuffer) return;

    try {
      const c = this.ctx;
      const t = c.currentTime + delay;
      const s = c.createBufferSource();
      s.buffer = this.noiseBuffer;

      const fl = c.createBiquadFilter();
      fl.type = type;
      fl.Q.value = q;
      fl.frequency.setValueAtTime(f, t);
      if (to) fl.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + d);

      const gn = c.createGain();
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.exponentialRampToValueAtTime(g, t + d * 0.35);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + d);

      s.connect(fl);
      fl.connect(gn);
      gn.connect(c.destination);
      s.start(t);
      s.stop(t + d + 0.05);
    } catch {}
  }

  // Coucou sound library
  play(name: string) {
    if (!this.enabled) return;
    switch (name) {
      case 'peek':
        this.tone({ f: 1320, d: 0.09, g: 0.04 });
        this.tone({ f: 1760, d: 0.12, g: 0.035, delay: 0.07 });
        break;
      case 'open':
        this.tone({ f: 300, to: 560, d: 0.24, g: 0.06 });
        this.noise({ d: 0.28, g: 0.018, f: 900, to: 3200 });
        break;
      case 'close':
        this.tone({ f: 540, to: 300, d: 0.2, g: 0.05 });
        this.noise({ d: 0.2, g: 0.014, f: 2600, to: 800 });
        break;
      case 'hover':
        this.tone({ f: 2100, d: 0.05, g: 0.014 });
        break;
      case 'blip':
        this.tone({ f: 1480, d: 0.07, g: 0.035 });
        break;
      case 'slap':
        this.tone({ f: 280, to: 110, d: 0.18, type: 'triangle', g: 0.16 });
        this.noise({ d: 0.06, g: 0.06, f: 900, q: 0.6 });
        break;
      case 'annoyed':
        this.tone({ f: 240, to: 185, d: 0.2, type: 'triangle', g: 0.07, delay: 0.06 });
        break;
      case 'dizzy':
        this.tone({ f: 640, to: 380, d: 1, g: 0.06, vib: 45, vibf: 9 });
        this.tone({ f: 960, to: 560, d: 1, g: 0.025, vib: 70, vibf: 7, delay: 0.06 });
        break;
      case 'greet':
        [523.25, 659.25, 783.99].forEach((f, i) =>
          this.tone({ f, d: 0.32, g: 0.06, delay: i * 0.085, h: 4 })
        );
        break;
      case 'work':
        this.tone({ f: 880, d: 0.14, g: 0.028 });
        this.tone({ f: 1174.7, d: 0.18, g: 0.022, delay: 0.07 });
        break;
      case 'finish':
        this.tone({ f: 783.99, d: 0.6, g: 0.08, h: 4 });
        this.tone({ f: 1046.5, d: 0.9, g: 0.08, h: 4, delay: 0.11 });
        this.tone({ f: 1318.5, d: 1.1, g: 0.045, h: 3, delay: 0.22 });
        break;
      case 'error':
        this.tone({ f: 392, d: 0.35, type: 'triangle', g: 0.09 });
        this.tone({ f: 311.1, d: 0.55, type: 'triangle', g: 0.09, delay: 0.16 });
        break;
      case 'approval':
        this.tone({ f: 987.8, d: 0.35, g: 0.07, h: 2.76 });
        this.tone({ f: 987.8, d: 0.5, g: 0.07, h: 2.76, delay: 0.18 });
        break;
      case 'question':
        this.tone({ f: 659.3, d: 0.24, g: 0.06, h: 3 });
        this.tone({ f: 880, d: 0.4, g: 0.06, h: 3, delay: 0.12 });
        break;
      case 'approve':
      case 'faceid':
        this.tone({ f: 660, d: 0.18, g: 0.06 });
        this.tone({ f: 990, d: 0.3, g: 0.06, delay: 0.08, h: 3 });
        break;
      case 'gulp':
        this.tone({ f: 340, to: 120, d: 0.16, g: 0.11 });
        this.tone({ f: 210, to: 80, d: 0.22, g: 0.09, delay: 0.1 });
        break;
      case 'tick':
        this.tone({ f: 2400, d: 0.03, g: 0.012 });
        break;
      case 'send':
        this.noise({ d: 0.38, g: 0.04, f: 700, to: 4200 });
        this.tone({ f: 600, to: 1250, d: 0.26, g: 0.035 });
        break;
      case 'love':
        this.tone({ f: 1046.5, d: 0.32, g: 0.045, vib: 14, vibf: 8 });
        this.tone({ f: 1318.5, d: 0.5, g: 0.045, vib: 14, vibf: 8, delay: 0.14 });
        break;
      case 'pop':
        this.tone({ f: 480, to: 1150, d: 0.11, g: 0.07 });
        break;
      case 'proud':
        [784, 988, 1175, 1568].forEach((f, i) =>
          this.tone({ f, d: 0.4, g: 0.045, delay: i * 0.06, h: 4 })
        );
        break;
      case 'wink':
        this.tone({ f: 1400, to: 1900, d: 0.09, g: 0.035 });
        break;
      case 'yawn':
        this.tone({ f: 430, to: 250, d: 0.8, g: 0.045, vib: 9, vibf: 4 });
        break;
      case 'attach':
        [1568, 1976, 2349, 2637, 3136].forEach((f, i) =>
          this.tone({ f, d: 0.7, g: 0.022, delay: i * 0.05 })
        );
        this.noise({ d: 0.7, g: 0.02, f: 3000, to: 6000 });
        break;
      case 'think':
        this.tone({ f: 520, d: 0.2, g: 0.03 });
        this.tone({ f: 620, d: 0.25, g: 0.03, delay: 0.12 });
        break;
      case 'search':
        this.tone({ f: 740, d: 0.12, g: 0.025 });
        this.tone({ f: 990, d: 0.12, g: 0.025, delay: 0.1 });
        this.tone({ f: 1245, d: 0.2, g: 0.025, delay: 0.2 });
        break;
      case 'rate':
        this.tone({ f: 500, to: 420, d: 0.3, g: 0.04 });
        this.tone({ f: 420, to: 350, d: 0.4, g: 0.04, delay: 0.18 });
        break;
      case 'sleep':
        this.tone({ f: 330, to: 290, d: 0.5, g: 0.03 });
        break;
      default:
        this.playPop();
        break;
    }
  }

  // Backward compatibility methods
  playPop() {
    this.play('pop');
  }

  playSquish() {
    this.play('slap');
  }

  playSparkChime() {
    this.play('finish');
  }

  playTorchClick(_on: boolean) {
    this.play('blip');
  }
}

export const soundFX = new CoucouSoundEngine();
