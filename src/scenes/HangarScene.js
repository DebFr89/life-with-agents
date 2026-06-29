import { Scene } from './Scene.js';
import { Button, careerBar, panel } from '../ui/widgets.js';
import { THEME, FONT, text, uiScale, roundRect, money } from '../ui/theme.js';
import { AIRCRAFT } from '../data/aircraft.js';
import { unlockedTier, isOwned, isBuyable } from '../career/Progression.js';
import { canAfford } from '../career/Economy.js';
import { drawPlane } from '../render/Sprite.js';

export class HangarScene extends Scene {
  enter() { this.scroll = 0; this.build(); }
  resize() { this.build(); }

  build() {
    const { canvas } = this.game;
    const s = uiScale(canvas); this.s = s;
    this.barH = 44 * s; this.navH = 56 * s;
    this.buttons = [new Button({
      x: 16 * s, y: canvas.height - this.navH + 8 * s, w: canvas.width - 32 * s, h: 40 * s,
      label: 'Back to Hub', kind: 'ghost', onClick: () => this.game.go('Hub'),
    })];

    const x = 16 * s, w = canvas.width - 32 * s, h = 92 * s, gap = 12 * s;
    this.listTop = this.barH + 14 * s;
    this.listBottom = canvas.height - this.navH - 8 * s;
    this.viewH = this.listBottom - this.listTop;
    this.cards = AIRCRAFT.map((ac, i) => ({ ac, x, y: this.listTop + i * (h + gap), w, h }));
    this.contentH = AIRCRAFT.length * (h + gap);
  }

  maxScroll() { return Math.max(0, this.contentH - this.viewH); }

  onPointerDown(x, y) {
    if (super.onPointerDown(x, y)) return true;
    if (y > this.listTop && y < this.listBottom) this._drag = { y, startScroll: this.scroll, moved: 0 };
    return false;
  }
  onPointerMove(x, y) {
    if (this._drag) {
      const dy = y - this._drag.y; this._drag.moved += Math.abs(dy);
      this.scroll = clamp(this._drag.startScroll - dy, 0, this.maxScroll());
    }
  }
  onPointerUp(x, y) {
    super.onPointerUp(x, y);
    if (this._drag) { if (this._drag.moved < 8) this._tap(x, y); this._drag = null; }
  }

  _tap(x, y) {
    const s = this.s;
    for (const c of this.cards) {
      const ry = c.y - this.scroll;
      // action pill rect (bottom-right of card)
      const aw = 120 * s, ah = 30 * s, ax = c.x + c.w - aw - 12 * s, ay = ry + c.h - ah - 12 * s;
      if (x >= ax && x <= ax + aw && y >= ay && y <= ay + ah) { this._action(c.ac); return; }
    }
  }

  _action(ac) {
    const save = this.game.save;
    const p = save.data;
    if (isOwned(p, ac.id)) {
      if (p.activeAircraft !== ac.id) { p.activeAircraft = ac.id; save.save(); this.game.audio.blip('ui'); }
    } else if (isBuyable(p, ac) && canAfford(p, ac.price)) {
      p.cash -= ac.price; p.ownedAircraft.push(ac.id); p.activeAircraft = ac.id;
      save.save(); this.game.audio.blip('buy');
    } else {
      this.game.audio.blip('bad');
    }
  }

  render(ctx) {
    const { canvas, save } = this.game;
    const s = this.s;
    careerBar(ctx, this.game, s, 'Hangar');

    ctx.save();
    ctx.beginPath(); ctx.rect(0, this.listTop, canvas.width, this.viewH); ctx.clip();
    for (const c of this.cards) {
      const ry = c.y - this.scroll;
      if (ry + c.h < this.listTop || ry > this.listBottom) continue;
      this._card(ctx, c, ry, s);
    }
    ctx.restore();

    for (const b of this.buttons) b.render(ctx, s);
  }

  _card(ctx, c, ry, s) {
    const { save } = this.game; const p = save.data; const ac = c.ac;
    const owned = isOwned(p, ac.id);
    const active = p.activeAircraft === ac.id;
    const locked = ac.tier > unlockedTier(p);
    const buyable = isBuyable(p, ac);
    const affordable = canAfford(p, ac.price);

    ctx.save();
    if (locked) ctx.globalAlpha = 0.5;
    panel(ctx, c.x, ry, c.w, c.h, s, { fill: active ? THEME.panelHi : THEME.panel, strokeColor: active ? THEME.accent : THEME.stroke });

    drawPlane(ctx, c.x + 46 * s, ry + c.h / 2, 26 * s, 0, ac, { shadow: false });

    const tx = c.x + 92 * s;
    text(ctx, ac.name, tx, ry + 20 * s, { font: FONT.ui(15 * s, 700), color: THEME.text, baseline: 'middle' });
    text(ctx, `${ac.role} · Tier ${ac.tier}`, tx, ry + 38 * s, { font: FONT.ui(10 * s, 500), color: THEME.textDim, baseline: 'middle' });
    text(ctx, `SPD ${Math.round(ac.maxSpeed * 1.6)}   AGI ${ac.handling.toFixed(1)}   PAX ${ac.paxCapacity}`,
      tx, ry + 60 * s, { font: FONT.mono(11 * s, 600), color: THEME.textDim, baseline: 'middle' });

    // Action pill
    const aw = 120 * s, ah = 30 * s, ax = c.x + c.w - aw - 12 * s, ay = ry + c.h - ah - 12 * s;
    let label, fill, fg = THEME.accentText;
    if (active) { label = 'Active'; fill = THEME.good; }
    else if (owned) { label = 'Select'; fill = THEME.accent; }
    else if (locked) { label = 'Locked'; fill = THEME.stroke; fg = THEME.textDim; }
    else if (!affordable) { label = money(ac.price); fill = THEME.bad; fg = '#2a0a0a'; }
    else { label = 'Buy ' + money(ac.price); fill = THEME.accent; }
    roundRect(ctx, ax, ay, aw, ah, ah / 2); ctx.fillStyle = fill; ctx.fill();
    text(ctx, label, ax + aw / 2, ay + ah / 2, { font: FONT.ui(12 * s, 700), color: fg, align: 'center', baseline: 'middle' });

    // top-right price/owned tag
    if (locked) text(ctx, `Requires higher license`, c.x + c.w - 14 * s, ry + 20 * s, { font: FONT.ui(10 * s, 600), color: THEME.bad, align: 'right', baseline: 'middle' });
    ctx.restore();
  }
}

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
