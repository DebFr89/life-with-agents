// Projects and paints world entities, painter-sorted far→near. Entities carry
// { type, x, y, z, r, state } where z is distance ahead (set by FlightScene).
import { CONFIG, GRADE } from '../data/config.js';
import { THEME } from '../ui/theme.js';
import { drawTraffic } from './Sprite.js';

export function drawEntities(ctx, p3d, entities) {
  const visible = [];
  for (const e of entities) {
    if (!e.active) continue;
    if (!p3d.visible(e.z)) continue;
    visible.push(e);
  }
  visible.sort((a, b) => b.z - a.z);

  for (const e of visible) {
    const p = p3d.project(e.x, e.y, e.z);
    const fade = e.z > CONFIG.viewDistance * 0.7
      ? 1 - (e.z - CONFIG.viewDistance * 0.7) / (CONFIG.viewDistance * 0.3) : 1;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, fade));
    switch (e.type) {
      case 'gate': drawGate(ctx, p, e); break;
      case 'traffic': drawTraffic(ctx, p.sx, p.sy, Math.max(3, CONFIG.hazardRadius * p.scale), '#d7dee8'); break;
      case 'bird': drawBird(ctx, p); break;
      case 'storm': drawStormCell(ctx, p); break;
      case 'cloud': drawCloud(ctx, p); break;
      case 'mountain': drawMountain(ctx, p); break;
    }
    ctx.restore();
  }
}

function drawGate(ctx, p, e) {
  const rw = CONFIG.gateHalfWidth * p.scale;
  const rh = CONFIG.gateHalfHeight * p.scale;
  let color = THEME.accent;
  if (e.state === 'done') color = GRADE.PERFECT.color;
  else if (e.state === 'miss') color = THEME.bad;
  else if (e.state === 'next') color = '#ffffff';
  ctx.strokeStyle = color;
  ctx.globalAlpha *= (e.state === 'done' || e.state === 'miss') ? 0.5 : 1;
  ctx.lineWidth = Math.max(2, 4 * p.scale);
  ctx.beginPath();
  ctx.ellipse(p.sx, p.sy, rw, rh, 0, 0, Math.PI * 2);
  ctx.stroke();
  // inner glow ring for the next gate
  if (e.state === 'next') {
    ctx.globalAlpha *= 0.4;
    ctx.lineWidth = Math.max(1, 2 * p.scale);
    ctx.beginPath();
    ctx.ellipse(p.sx, p.sy, rw * 0.7, rh * 0.7, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawBird(ctx, p) {
  const s = Math.max(3, 10 * p.scale);
  ctx.strokeStyle = '#22303f'; ctx.lineWidth = Math.max(1, s * 0.25);
  ctx.beginPath();
  ctx.moveTo(p.sx - s, p.sy); ctx.lineTo(p.sx, p.sy - s * 0.5); ctx.lineTo(p.sx + s, p.sy);
  ctx.stroke();
}

function drawCloud(ctx, p) {
  const s = Math.max(6, 40 * p.scale);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (const [dx, dy, r] of [[-0.6, 0.1, 0.6], [0, -0.2, 0.8], [0.6, 0.1, 0.6], [0.2, 0.25, 0.5]]) {
    ctx.beginPath(); ctx.arc(p.sx + dx * s, p.sy + dy * s, r * s, 0, Math.PI * 2); ctx.fill();
  }
}

function drawStormCell(ctx, p) {
  const s = Math.max(8, 50 * p.scale);
  ctx.fillStyle = 'rgba(40,52,68,0.92)';
  for (const [dx, dy, r] of [[-0.7, 0, 0.7], [0, -0.3, 0.9], [0.7, 0, 0.7], [0, 0.3, 0.7]]) {
    ctx.beginPath(); ctx.arc(p.sx + dx * s, p.sy + dy * s, r * s, 0, Math.PI * 2); ctx.fill();
  }
  if (Math.random() < 0.1) {
    ctx.strokeStyle = 'rgba(200,225,255,0.9)'; ctx.lineWidth = Math.max(1, 2 * p.scale);
    ctx.beginPath(); ctx.moveTo(p.sx, p.sy); ctx.lineTo(p.sx + s * 0.2, p.sy + s * 0.6); ctx.stroke();
  }
}

function drawMountain(ctx, p) {
  const s = Math.max(20, 120 * p.scale);
  ctx.fillStyle = '#3a4a44';
  ctx.beginPath();
  ctx.moveTo(p.sx - s, p.sy + s * 0.6);
  ctx.lineTo(p.sx, p.sy - s * 0.5);
  ctx.lineTo(p.sx + s, p.sy + s * 0.6);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.moveTo(p.sx - s * 0.22, p.sy - s * 0.18);
  ctx.lineTo(p.sx, p.sy - s * 0.5);
  ctx.lineTo(p.sx + s * 0.22, p.sy - s * 0.18);
  ctx.closePath(); ctx.fill();
}
