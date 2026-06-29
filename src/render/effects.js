// Lightweight pooled particle system for engine trail, touchdown smoke, sparks.
export class Particles {
  constructor(max = 200) {
    this.pool = [];
    for (let i = 0; i < max; i++) this.pool.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 2, color: '#fff' });
  }
  emit(x, y, vx, vy, life, color, size) {
    for (const p of this.pool) {
      if (!p.active) {
        p.active = true; p.x = x; p.y = y; p.vx = vx; p.vy = vy;
        p.life = life; p.max = life; p.size = size; p.color = color;
        return;
      }
    }
  }
  burst(x, y, n, color, opts = {}) {
    const spread = opts.spread ?? 120;
    const speed = opts.speed ?? 120;
    for (let i = 0; i < n; i++) {
      const a = (Math.random() - 0.5) * (spread * Math.PI / 180) - Math.PI / 2;
      const sp = speed * (0.4 + Math.random() * 0.6);
      this.emit(x, y, Math.cos(a) * sp, Math.sin(a) * sp, 0.4 + Math.random() * 0.5, color, (opts.size ?? 3) * (0.6 + Math.random()));
    }
  }
  update(dt) {
    for (const p of this.pool) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) { p.active = false; continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 60 * dt;
    }
  }
  draw(ctx) {
    for (const p of this.pool) {
      if (!p.active) continue;
      const a = p.life / p.max;
      ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.5 + a * 0.5), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
