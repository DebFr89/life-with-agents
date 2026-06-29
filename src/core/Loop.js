// requestAnimationFrame loop with clamped delta time. Pauses on tab hide so a
// background stall doesn't produce a huge dt spike on return.
import { CONFIG } from '../data/config.js';

export class Loop {
  constructor(frame) {
    this.frame = frame;          // frame(dt) — dt in seconds, clamped
    this._raf = 0;
    this._last = 0;
    this._running = false;
    this._tick = this._tick.bind(this);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stop();
      else if (!this._running) this.start();
    });
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._last = performance.now();
    this._raf = requestAnimationFrame(this._tick);
  }

  stop() {
    this._running = false;
    cancelAnimationFrame(this._raf);
  }

  _tick(now) {
    if (!this._running) return;
    let dt = (now - this._last) / 1000;
    this._last = now;
    if (dt > CONFIG.maxDt) dt = CONFIG.maxDt;
    if (dt > 0) this.frame(dt);
    this._raf = requestAnimationFrame(this._tick);
  }
}
