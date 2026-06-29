// All sound is synthesized with WebAudio — no asset files. The context starts
// suspended (autoplay policy) and is resumed on the first user gesture.
export class Audio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.engine = null;        // { osc, gain, filter } while flying
    this.sfxVolume = 0.8;
    this.musicVolume = 0.5;
    this.unlocked = false;
  }

  // Call from inside a user-gesture handler.
  unlock() {
    if (this.unlocked) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);
    this.unlocked = true;
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

  // Short blip for UI / gates / events.
  blip(kind = 'ui') {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const map = {
      ui:    { f: 440, type: 'triangle', a: 0.18, d: 0.12 },
      gate:  { f: 660, type: 'sine',     a: 0.25, d: 0.16 },
      good:  { f: 720, type: 'sine',     a: 0.3,  d: 0.4 },
      bad:   { f: 150, type: 'sawtooth', a: 0.3,  d: 0.3 },
      crash: { f: 80,  type: 'sawtooth', a: 0.5,  d: 0.7 },
      buy:   { f: 880, type: 'triangle', a: 0.3,  d: 0.25 },
    };
    const s = map[kind] || map.ui;
    osc.type = s.type;
    osc.frequency.setValueAtTime(s.f, t);
    if (kind === 'good' || kind === 'buy') osc.frequency.exponentialRampToValueAtTime(s.f * 1.5, t + s.d);
    if (kind === 'bad' || kind === 'crash') osc.frequency.exponentialRampToValueAtTime(s.f * 0.5, t + s.d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(s.a * this.sfxVolume, t + s.a * 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + s.d);
    osc.connect(g); g.connect(this.master);
    osc.start(t); osc.stop(t + s.d + 0.05);
  }

  startEngine() {
    if (!this.ctx || this.engine) return;
    const osc = this.ctx.createOscillator();
    const sub = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = 'sawtooth'; sub.type = 'sine';
    osc.frequency.value = 70; sub.frequency.value = 35;
    filter.type = 'lowpass'; filter.frequency.value = 500;
    gain.gain.value = 0.0;
    osc.connect(filter); sub.connect(filter); filter.connect(gain); gain.connect(this.master);
    osc.start(); sub.start();
    this.engine = { osc, sub, gain, filter };
  }

  // throttle 0..1, speedFrac 0..1
  setEngine(throttle, speedFrac) {
    if (!this.engine) return;
    const t = this.ctx.currentTime;
    const base = 60 + speedFrac * 120 + throttle * 40;
    this.engine.osc.frequency.setTargetAtTime(base, t, 0.1);
    this.engine.sub.frequency.setTargetAtTime(base * 0.5, t, 0.1);
    this.engine.filter.frequency.setTargetAtTime(400 + throttle * 1600, t, 0.1);
    this.engine.gain.gain.setTargetAtTime((0.05 + throttle * 0.16) * this.sfxVolume, t, 0.1);
  }

  stopEngine() {
    if (!this.engine) return;
    const { osc, sub, gain } = this.engine;
    const t = this.ctx.currentTime;
    gain.gain.setTargetAtTime(0.0001, t, 0.1);
    osc.stop(t + 0.3); sub.stop(t + 0.3);
    this.engine = null;
  }
}
