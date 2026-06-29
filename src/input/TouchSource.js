// Pointer-based controls (works with touch and mouse).
//  - Tilt ON:  any held pointer = throttle ("gas pedal").
//  - Tilt OFF: left-half pointer = virtual stick (steer + pitch), right-half = throttle.
const JOY_RADIUS = 70;        // px of drag for full deflection

export class TouchSource {
  constructor(manager) {
    this.m = manager;
    this.pointers = new Map();    // id -> { role, sx, sy, x, y }
    this.steer = 0;
    this.pitch = 0;
    this.throttle = 0;
    this.joyActive = false;
    this.joyOrigin = null;        // { x, y } for HUD rendering
    this.joyVec = { x: 0, y: 0 };
  }

  onPointerDown(id, x, y) {
    const w = this.m.game.canvas.width;
    let role;
    if (this.m.tiltActive) role = 'throttle';
    else role = (x < w * 0.5) ? 'joy' : 'throttle';
    this.pointers.set(id, { role, sx: x, sy: y, x, y });
  }
  onPointerMove(id, x, y) {
    const p = this.pointers.get(id);
    if (p) { p.x = x; p.y = y; }
  }
  onPointerUp(id) { this.pointers.delete(id); }
  clear() { this.pointers.clear(); }

  update() {
    let throttle = 0;
    let joy = null;
    for (const p of this.pointers.values()) {
      if (p.role === 'throttle') throttle = 1;
      else if (p.role === 'joy' && !joy) joy = p;
    }
    this.throttle = throttle;
    if (joy) {
      const dx = clamp((joy.x - joy.sx) / JOY_RADIUS, -1, 1);
      const dy = clamp((joy.sy - joy.y) / JOY_RADIUS, -1, 1);  // up (smaller y) = climb
      this.steer = dx;
      this.pitch = dy;
      this.joyActive = true;
      this.joyOrigin = { x: joy.sx, y: joy.sy };
      this.joyVec = { x: dx * JOY_RADIUS, y: -dy * JOY_RADIUS };
    } else {
      this.steer = 0; this.pitch = 0; this.joyActive = false; this.joyOrigin = null;
    }
  }
}

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
