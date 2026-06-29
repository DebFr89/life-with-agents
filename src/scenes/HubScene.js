import { Scene } from './Scene.js';
import { Button, careerBar, panel } from '../ui/widgets.js';
import { THEME, FONT, text, uiScale, roundRect, money } from '../ui/theme.js';
import { availableContracts, aircraftMeetsRoute, licenseProgress } from '../career/Progression.js';
import { getAircraft } from '../data/aircraft.js';

const WEATHER_ICON = { clear: '☀', wind: '🌬', storm: '⛈' };

export class HubScene extends Scene {
  enter() { this.scroll = 0; this.build(); }
  resize() { this.build(); }

  build() {
    const { canvas } = this.game;
    const s = uiScale(canvas);
    this.s = s;
    this.barH = 44 * s;
    this.navH = 56 * s;
    const navY = canvas.height - this.navH + 8 * s;
    const bw = (canvas.width - 16 * s * 5) / 4;
    const mk = (i, label, kind, onClick) => new Button({
      x: 16 * s + i * (bw + 16 * s), y: navY, w: bw, h: 40 * s, label, kind, onClick,
    });
    this.buttons = [
      mk(0, 'Hangar', 'panel', () => this.game.go('Hangar')),
      mk(1, 'Licenses', 'panel', () => this.game.go('License')),
      mk(2, 'Settings', 'ghost', () => this.game.go('Settings', { return: 'Hub' })),
      mk(3, 'Menu', 'ghost', () => this.game.go('Menu')),
    ];
    this.layoutRows();
  }

  layoutRows() {
    const { canvas } = this.game;
    const s = this.s;
    const listTop = this.barH + 64 * s;
    const x = 16 * s, w = canvas.width - 32 * s, h = 58 * s, gap = 10 * s;
    this.rows = availableContracts(this.game.save.data).map((route, i) => ({
      route,
      x, y: listTop + i * (h + gap), w, h,
      enabled: aircraftMeetsRoute(this.game.save.data, route),
    }));
    this.listTop = listTop;
    this.listBottom = canvas.height - this.navH - 8 * s;
    this.contentH = this.rows.length * (h + gap);
    this.viewH = this.listBottom - listTop;
  }

  maxScroll() { return Math.max(0, this.contentH - this.viewH); }

  onPointerDown(x, y) {
    if (super.onPointerDown(x, y)) return true;
    if (y > this.listTop && y < this.listBottom) {
      this._drag = { y, startScroll: this.scroll, moved: 0 };
    }
    return false;
  }
  onPointerMove(x, y) {
    if (this._drag) {
      const dy = y - this._drag.y;
      this._drag.moved += Math.abs(dy);
      this.scroll = clamp(this._drag.startScroll - dy, 0, this.maxScroll());
    }
  }
  onPointerUp(x, y) {
    super.onPointerUp(x, y);
    if (this._drag) {
      if (this._drag.moved < 8) this._tapRow(x, y);
      this._drag = null;
    }
  }
  _tapRow(x, y) {
    for (const r of this.rows) {
      const ry = r.y - this.scroll;
      if (x >= r.x && x <= r.x + r.w && y >= ry && y <= ry + r.h) {
        if (r.enabled) { this.game.audio.blip('ui'); this.game.go('Briefing', { routeId: r.route.id, mode: 'contract' }); }
        return;
      }
    }
  }

  render(ctx) {
    const { canvas, save } = this.game;
    const s = this.s;
    careerBar(ctx, this.game, s, 'Contracts');

    // Active aircraft + next-license hint
    const ac = getAircraft(save.data.activeAircraft);
    text(ctx, `Aircraft: ${ac.name}`, 16 * s, this.barH + 22 * s, { font: FONT.ui(13 * s, 700), color: THEME.text, baseline: 'middle' });
    const prog = licenseProgress(save.data);
    if (prog.next) {
      const msg = prog.canAttempt ? `${prog.next.abbr} check-ride available!` :
        `Next: ${prog.next.abbr} — ${save.data.flightHours.toFixed(1)}/${prog.req.hours} hrs · ${money(save.data.cash)}/${money(prog.req.cash)}`;
      text(ctx, msg, canvas.width - 16 * s, this.barH + 22 * s,
        { font: FONT.ui(11 * s, 600), color: prog.canAttempt ? THEME.good : THEME.textDim, align: 'right', baseline: 'middle' });
    }

    // Clip the scrolling list region
    ctx.save();
    ctx.beginPath(); ctx.rect(0, this.listTop, canvas.width, this.viewH); ctx.clip();
    for (const r of this.rows) {
      const ry = r.y - this.scroll;
      if (ry + r.h < this.listTop || ry > this.listBottom) continue;
      this._row(ctx, r, ry, s);
    }
    ctx.restore();

    // scroll hint
    if (this.maxScroll() > 0) {
      text(ctx, '↕ scroll', canvas.width / 2, this.listBottom - 4 * s,
        { font: FONT.ui(9 * s, 500), color: THEME.textDim, align: 'center', baseline: 'bottom' });
    }

    for (const b of this.buttons) b.render(ctx, s);
  }

  _row(ctx, r, ry, s) {
    const route = r.route;
    ctx.save();
    if (!r.enabled) ctx.globalAlpha = 0.45;
    panel(ctx, r.x, ry, r.w, r.h, s, { fill: route.checkRide ? THEME.panelHi : THEME.panel });
    const pad = 14 * s;
    text(ctx, route.name, r.x + pad, ry + 18 * s, { font: FONT.ui(15 * s, 700), color: THEME.text, baseline: 'middle' });
    text(ctx, `${route.from} → ${route.to}   ${(route.distance / 50).toFixed(0)} nm   ${WEATHER_ICON[route.weather] || ''}`,
      r.x + pad, ry + 40 * s, { font: FONT.ui(11 * s, 500), color: THEME.textDim, baseline: 'middle' });
    text(ctx, money(route.baseReward), r.x + r.w - pad, ry + 18 * s,
      { font: FONT.mono(15 * s, 700), color: THEME.gold, align: 'right', baseline: 'middle' });
    text(ctx, r.enabled ? 'Tap to brief' : `Needs Tier ${route.requiredTier} aircraft`,
      r.x + r.w - pad, ry + 40 * s, { font: FONT.ui(10 * s, 600), color: r.enabled ? THEME.accent : THEME.bad, align: 'right', baseline: 'middle' });
    ctx.restore();
  }
}

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
