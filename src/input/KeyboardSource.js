// Desktop dev fallback: arrows / WASD to steer & pitch, Space to throttle.
export class KeyboardSource {
  constructor() {
    this.keys = new Set();
    this.steer = 0;
    this.pitch = 0;
    this.throttle = 0;
  }
  attach() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.keys.clear());
  }
  update() {
    const k = this.keys;
    const L = k.has('arrowleft') || k.has('a');
    const R = k.has('arrowright') || k.has('d');
    const U = k.has('arrowup') || k.has('w');
    const D = k.has('arrowdown') || k.has('s');
    this.steer = (R ? 1 : 0) - (L ? 1 : 0);
    this.pitch = (U ? 1 : 0) - (D ? 1 : 0);
    this.throttle = (k.has(' ') || k.has('shift')) ? 1 : 0;
    this.active = L || R || U || D;
  }
}
