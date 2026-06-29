// Immediate-ish canvas widgets. Scenes build Button instances, render them, and
// hit-test them in pointer handlers (see scenes/Scene.js).
import { THEME, FONT, roundRect } from './theme.js';

export class Button {
  constructor({ x, y, w, h, label, onClick, kind = 'primary', enabled = true, sub = null }) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.label = label; this.onClick = onClick; this.kind = kind;
    this.enabled = enabled; this.sub = sub;
    this.pressed = false;
  }
  hit(px, py) {
    return px >= this.x && px <= this.x + this.w && py >= this.y && py <= this.y + this.h;
  }
  render(ctx, scale = 1) {
    const r = 12 * scale;
    let fill, stroke, fg;
    if (this.kind === 'primary') { fill = THEME.accent; stroke = THEME.accent; fg = THEME.accentText; }
    else if (this.kind === 'ghost') { fill = 'transparent'; stroke = THEME.stroke; fg = THEME.text; }
    else if (this.kind === 'danger') { fill = THEME.bad; stroke = THEME.bad; fg = '#1a0606'; }
    else { fill = THEME.panelHi; stroke = THEME.stroke; fg = THEME.text; }

    ctx.save();
    if (!this.enabled) ctx.globalAlpha = 0.4;
    if (this.pressed && this.enabled) { ctx.translate(0, 1 * scale); }
    roundRect(ctx, this.x, this.y, this.w, this.h, r);
    if (fill !== 'transparent') { ctx.fillStyle = fill; ctx.fill(); }
    ctx.lineWidth = 1.5 * scale; ctx.strokeStyle = stroke; ctx.stroke();

    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    if (this.sub) {
      ctx.textBaseline = 'alphabetic';
      ctx.font = FONT.ui(16 * scale, 700);
      ctx.fillText(this.label, this.x + this.w / 2, this.y + this.h / 2 - 2 * scale);
      ctx.font = FONT.ui(11 * scale, 500);
      ctx.globalAlpha *= 0.85;
      ctx.fillText(this.sub, this.x + this.w / 2, this.y + this.h / 2 + 14 * scale);
    } else {
      ctx.textBaseline = 'middle';
      ctx.font = FONT.ui(16 * scale, 700);
      ctx.fillText(this.label, this.x + this.w / 2, this.y + this.h / 2);
    }
    ctx.restore();
  }
}

export function panel(ctx, x, y, w, h, scale = 1, opts = {}) {
  roundRect(ctx, x, y, w, h, (opts.radius ?? 14) * scale);
  ctx.fillStyle = opts.fill || THEME.panel;
  ctx.fill();
  if (opts.stroke !== false) {
    ctx.lineWidth = 1.5 * scale;
    ctx.strokeStyle = opts.strokeColor || THEME.stroke;
    ctx.stroke();
  }
}

// Top career bar: license + hours on the left, cash on the right, title centred.
export function careerBar(ctx, game, scale, title = '') {
  const { canvas, save } = game;
  const lic = game.data.LICENSES.find(l => l.id === save.data.currentLicense);
  const h = 44 * scale;
  ctx.save();
  ctx.fillStyle = 'rgba(8,18,33,0.85)';
  ctx.fillRect(0, 0, canvas.width, h);
  ctx.strokeStyle = THEME.stroke; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(canvas.width, h); ctx.stroke();

  const pad = 16 * scale, midY = h / 2;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = FONT.ui(13 * scale, 700); ctx.fillStyle = THEME.accent;
  ctx.fillText(lic ? lic.abbr : '—', pad, midY - 7 * scale);
  ctx.font = FONT.ui(10 * scale, 500); ctx.fillStyle = THEME.textDim;
  ctx.fillText(`${save.data.flightHours.toFixed(1)} hrs`, pad, midY + 8 * scale);

  if (title) {
    ctx.textAlign = 'center'; ctx.font = FONT.ui(15 * scale, 700); ctx.fillStyle = THEME.text;
    ctx.fillText(title, canvas.width / 2, midY);
  }

  ctx.textAlign = 'right';
  ctx.font = FONT.mono(16 * scale, 700); ctx.fillStyle = THEME.gold;
  ctx.fillText('$' + Math.round(save.data.cash).toLocaleString('en-US'), canvas.width - pad, midY);
  ctx.restore();
  return h;
}
