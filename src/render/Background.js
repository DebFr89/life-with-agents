// Sky, ground, perspective scroll, horizon haze, distant ridges, weather tint.
import { CONFIG } from '../data/config.js';

const SKIES = {
  clear: { top: '#1f63b0', mid: '#5fa8e6', horizon: '#bfe2ff', ground: '#3c6b3a', groundFar: '#2a5230' },
  wind:  { top: '#3a6ea5', mid: '#79a7cf', horizon: '#d8e6f0', ground: '#6e7a4a', groundFar: '#4f5836' },
  storm: { top: '#1a2433', mid: '#37475c', horizon: '#566678', ground: '#2e3a33', groundFar: '#1f2a26' },
};

export class Background {
  constructor() { this.flicker = 0; this.rainSeed = 0; }

  draw(ctx, p3d, canvas, weather, distance, dt) {
    const W = canvas.width, H = canvas.height;
    const sky = SKIES[weather] || SKIES.clear;
    const hY = p3d.horizonY;

    // Sky gradient (screen-space; rotating a flat gradient is invisible anyway).
    const g = ctx.createLinearGradient(0, 0, 0, Math.max(1, hY));
    g.addColorStop(0, sky.top); g.addColorStop(1, sky.horizon);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, Math.max(0, hY));

    // Everything below rolls with the aircraft.
    p3d.beginWorld(ctx);

    // Ground plane (oversized so rotation never reveals an edge).
    const gg = ctx.createLinearGradient(0, hY, 0, H + W);
    gg.addColorStop(0, sky.groundFar); gg.addColorStop(1, sky.ground);
    ctx.fillStyle = gg;
    ctx.fillRect(-W, hY, W * 3, H * 2);

    // Distant ridge silhouette along the horizon.
    drawRidge(ctx, W, hY, weather);

    // Perspective scroll stripes that rush toward the camera.
    drawStripes(ctx, p3d, W, H, hY, distance, sky);

    // Horizon haze line.
    ctx.fillStyle = sky.horizon;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(-W, hY - 2, W * 3, 4);
    ctx.globalAlpha = 1;

    p3d.endWorld(ctx);

    // Weather overlays (screen space).
    if (weather === 'storm') this._storm(ctx, W, H, dt);
    if (weather === 'wind') this._haze(ctx, W, H);
  }

  _storm(ctx, W, H, dt) {
    this.flicker = Math.max(0, this.flicker - dt * 3);
    if (Math.random() < 0.006) this.flicker = 1;
    if (this.flicker > 0) { ctx.fillStyle = `rgba(220,235,255,${this.flicker * 0.25})`; ctx.fillRect(0, 0, W, H); }
    // rain streaks
    ctx.strokeStyle = 'rgba(180,200,220,0.25)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 40; i++) {
      const x = (i * 97 + (performance.now() * 0.6 % W)) % W;
      const y = (i * 53 + (performance.now() * 1.4 % H)) % H;
      ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 18);
    }
    ctx.stroke();
  }
  _haze(ctx, W, H) {
    ctx.fillStyle = 'rgba(200,215,230,0.05)';
    ctx.fillRect(0, 0, W, H);
  }
}

function drawRidge(ctx, W, hY, weather) {
  ctx.save();
  ctx.fillStyle = weather === 'storm' ? '#27313d' : '#7d93ad';
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.moveTo(-W, hY);
  let x = -W;
  let i = 0;
  while (x < W * 2) {
    const peak = hY - (18 + ((i * 37) % 46));
    ctx.lineTo(x + 60, peak);
    ctx.lineTo(x + 120, hY);
    x += 120; i++;
  }
  ctx.lineTo(W * 2, hY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawStripes(ctx, p3d, W, H, hY, distance, sky) {
  const SP = 120;                 // world spacing between stripes
  const start = Math.floor(distance / SP) * SP;
  ctx.fillStyle = sky.groundFar;
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 14; i++) {
    const z0 = (start + i * SP) - distance;   // distance ahead of camera
    if (z0 < 1) continue;
    const a = p3d.project(0, 0, z0);
    const b = p3d.project(0, 0, z0 + SP * 0.5);
    if (a.sy <= hY) continue;
    const h = Math.max(1, a.sy - b.sy);
    ctx.fillRect(-W, b.sy, W * 3, h);
  }
  ctx.globalAlpha = 1;
}
