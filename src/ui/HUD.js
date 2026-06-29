// In-flight heads-up display, drawn in screen space over the 3D scene.
import { THEME, FONT, roundRect, text } from './theme.js';

function bar(ctx, x, y, w, h, frac, color, bg = 'rgba(0,0,0,0.35)') {
  frac = Math.max(0, Math.min(1, frac));
  roundRect(ctx, x, y, w, h, h / 2); ctx.fillStyle = bg; ctx.fill();
  if (frac > 0) { roundRect(ctx, x, y, w * frac, h, h / 2); ctx.fillStyle = color; ctx.fill(); }
}

function readout(ctx, x, y, label, value, scale, align = 'left') {
  text(ctx, value, x, y, { font: FONT.mono(22 * scale, 700), color: THEME.text, align });
  text(ctx, label, x, y + 14 * scale, { font: FONT.ui(10 * scale, 600), color: THEME.textDim, align });
}

export function drawHUD(ctx, game, info) {
  const { canvas } = game;
  const W = canvas.width, H = canvas.height;
  const s = Math.max(0.8, Math.min(1.5, H / 420));
  const pad = 16 * s;

  // --- Top center: phase + progress + gates ---
  const barW = Math.min(W * 0.5, 360 * s);
  const bx = (W - barW) / 2, by = pad + 6 * s;
  text(ctx, info.phaseLabel, W / 2, pad - 2 * s, { font: FONT.ui(13 * s, 700), color: THEME.accent, align: 'center', baseline: 'top' });
  bar(ctx, bx, by + 16 * s, barW, 8 * s, info.progress, THEME.accent);
  text(ctx, info.route.from, bx, by + 16 * s + 18 * s, { font: FONT.ui(10 * s, 600), color: THEME.textDim, baseline: 'top' });
  text(ctx, info.route.to, bx + barW, by + 16 * s + 18 * s, { font: FONT.ui(10 * s, 600), color: THEME.textDim, align: 'right', baseline: 'top' });
  text(ctx, `Gates ${info.gatesHit}/${info.gatesTotal}`, W / 2, by + 16 * s + 18 * s, { font: FONT.ui(10 * s, 600), color: THEME.textDim, align: 'center', baseline: 'top' });

  // --- Top-left: speed + altitude ---
  readout(ctx, pad, pad + 18 * s, 'SPEED (kt)', Math.round(info.state.speed * 1.6).toString(), s);
  readout(ctx, pad + 90 * s, pad + 18 * s, 'ALT (ft)', Math.round(info.state.altitude * 10).toString(), s);

  // --- Top-right: fuel + hull ---
  const rw = 110 * s, rx = W - pad - rw;
  text(ctx, 'FUEL', rx, pad + 4 * s, { font: FONT.ui(10 * s, 600), color: THEME.textDim, baseline: 'top' });
  bar(ctx, rx, pad + 18 * s, rw, 9 * s, info.fuelFrac, info.fuelFrac < 0.2 ? THEME.bad : THEME.good);
  text(ctx, 'HULL', rx, pad + 34 * s, { font: FONT.ui(10 * s, 600), color: THEME.textDim, baseline: 'top' });
  bar(ctx, rx, pad + 48 * s, rw, 9 * s, info.hull, info.hull < 0.35 ? THEME.bad : THEME.warn);

  // --- Bottom-left: throttle ---
  const tx = pad, tH = 90 * s, ty = H - pad - tH;
  text(ctx, 'THR', tx, ty - 6 * s, { font: FONT.ui(10 * s, 600), color: THEME.textDim, baseline: 'bottom' });
  roundRect(ctx, tx, ty, 12 * s, tH, 6 * s); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
  const thr = info.state.throttle ?? 0;
  if (thr > 0) { roundRect(ctx, tx, ty + tH * (1 - thr), 12 * s, tH * thr, 6 * s); ctx.fillStyle = THEME.accent; ctx.fill(); }

  // --- Approach guidance (alignment + glideslope) ---
  if (info.approach && info.approach.active) drawApproach(ctx, W, H, s, info.approach);

  // --- Virtual joystick (touch-steer mode) ---
  const touch = game.input.touch;
  if (touch.joyActive && touch.joyOrigin) {
    const o = touch.joyOrigin;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.arc(o.x, o.y, 60 * s, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(63,169,245,0.7)';
    ctx.beginPath(); ctx.arc(o.x + touch.joyVec.x, o.y + touch.joyVec.y, 22 * s, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // --- Center event message ---
  if (info.message) {
    text(ctx, info.message.text, W / 2, H * 0.34, {
      font: FONT.ui(26 * s, 800), color: info.message.color || THEME.text, align: 'center', baseline: 'middle',
    });
  }
}

function drawApproach(ctx, W, H, s, ap) {
  // Horizontal alignment strip near the bottom-center.
  const stripW = Math.min(W * 0.6, 420 * s);
  const sx = (W - stripW) / 2, sy = H - 40 * s;
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = THEME.stroke; ctx.lineWidth = 2 * s;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + stripW, sy); ctx.stroke();
  // center target
  ctx.strokeStyle = THEME.good;
  ctx.beginPath(); ctx.moveTo(W / 2, sy - 8 * s); ctx.lineTo(W / 2, sy + 8 * s); ctx.stroke();
  // plane marker (lateral offset -1..1)
  const px = W / 2 + ap.lateral * (stripW / 2);
  ctx.fillStyle = Math.abs(ap.lateral) < 0.2 ? THEME.good : THEME.warn;
  ctx.beginPath(); ctx.arc(px, sy, 6 * s, 0, Math.PI * 2); ctx.fill();
  text(ctx, 'ALIGN', W / 2, sy + 12 * s, { font: FONT.ui(9 * s, 600), color: THEME.textDim, align: 'center', baseline: 'top' });

  // Vertical glideslope on the right.
  const gx = W - 28 * s, gh = 120 * s, gy = (H - gh) / 2;
  ctx.strokeStyle = THEME.stroke;
  ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.stroke();
  ctx.strokeStyle = THEME.good;
  ctx.beginPath(); ctx.moveTo(gx - 8 * s, gy + gh / 2); ctx.lineTo(gx + 8 * s, gy + gh / 2); ctx.stroke();
  const gpy = gy + gh / 2 - ap.glide * (gh / 2);
  ctx.fillStyle = Math.abs(ap.glide) < 0.25 ? THEME.good : THEME.warn;
  ctx.beginPath(); ctx.arc(gx, Math.max(gy, Math.min(gy + gh, gpy)), 6 * s, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
