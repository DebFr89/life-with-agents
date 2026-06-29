import { Scene } from './Scene.js';
import { Button, careerBar, panel } from '../ui/widgets.js';
import { THEME, FONT, text, uiScale, money, hasTouch } from '../ui/theme.js';
import { getRoute } from '../data/routes.js';
import { getAircraft } from '../data/aircraft.js';
import { drawPlane } from '../render/Sprite.js';

const WEATHER = { clear: 'Clear skies', wind: 'Gusty winds', storm: 'Storm cells' };

export class BriefingScene extends Scene {
  enter() { this.build(); }
  resize() { this.build(); }

  build() {
    const { canvas, save } = this.game;
    const s = uiScale(canvas); this.s = s;
    this.route = getRoute(this.params.routeId);
    this.ac = getAircraft(save.data.activeAircraft);
    this.checkRide = this.params.mode === 'checkride';
    this.canFly = this.ac.tier >= this.route.requiredTier;

    const navH = 56 * s, navY = canvas.height - navH + 8 * s;
    const half = (canvas.width - 32 * s - 12 * s) / 2;
    this.buttons = [
      new Button({ x: 16 * s, y: navY, w: half, h: 40 * s, label: 'Back', kind: 'ghost',
        onClick: () => this.game.go(this.checkRide ? 'License' : 'Hub') }),
      new Button({ x: 16 * s + half + 12 * s, y: navY, w: half, h: 40 * s,
        label: this.canFly ? (this.checkRide ? 'Begin Check-Ride' : 'Start Flight') : `Needs Tier ${this.route.requiredTier}`,
        kind: this.canFly ? 'primary' : 'panel', enabled: this.canFly,
        onClick: () => this.game.go('Flight', { routeId: this.route.id, mode: this.params.mode, licenseId: this.params.licenseId }) }),
    ];
  }

  render(ctx) {
    const { canvas } = this.game;
    const s = this.s;
    const r = this.route;
    careerBar(ctx, this.game, s, this.checkRide ? 'Check-Ride Briefing' : 'Flight Briefing');

    const x = 16 * s, w = canvas.width - 32 * s;
    let y = this.barH = 44 * s;
    y += 14 * s;

    // Route card
    const cardH = canvas.height * 0.28;
    panel(ctx, x, y, w, cardH, s);
    text(ctx, r.name, x + 16 * s, y + 26 * s, { font: FONT.ui(20 * s, 800), color: THEME.text, baseline: 'middle' });
    text(ctx, `${r.from}  →  ${r.to}`, x + 16 * s, y + 52 * s, { font: FONT.ui(14 * s, 600), color: THEME.accent, baseline: 'middle' });
    const stats = [
      `Distance   ${(r.distance / 50).toFixed(0)} nm`,
      `Weather    ${WEATHER[r.weather]}`,
      `Gates      ${r.gates}`,
      `Reward     ${money(r.baseReward)}${this.checkRide ? '  (qualifying flight)' : ''}`,
    ];
    stats.forEach((line, i) => text(ctx, line, x + 16 * s, y + 78 * s + i * 18 * s,
      { font: FONT.mono(12 * s, 600), color: THEME.textDim, baseline: 'middle' }));

    drawPlane(ctx, x + w - 70 * s, y + cardH / 2, 34 * s, 0, this.ac);

    // Aircraft line
    y += cardH + 14 * s;
    text(ctx, `Your aircraft: ${this.ac.name} (Tier ${this.ac.tier})`, x, y + 10 * s,
      { font: FONT.ui(13 * s, 700), color: this.canFly ? THEME.text : THEME.bad, baseline: 'middle' });
    if (!this.canFly) text(ctx, `This route needs a Tier ${r.requiredTier} aircraft — buy one in the Hangar.`, x, y + 30 * s,
      { font: FONT.ui(11 * s, 600), color: THEME.bad, baseline: 'middle' });

    // Controls reminder
    const input = this.game.input;
    const hint = input.tiltActive ? 'Tilt to steer · hold screen for throttle · pass the rings · land gently'
      : (hasTouch() ? 'Left stick steers · hold right side for throttle · land gently'
        : 'Arrows steer · hold Space for throttle · land gently');
    text(ctx, hint, canvas.width / 2, canvas.height - 64 * s,
      { font: FONT.ui(11 * s, 500), color: THEME.textDim, align: 'center', baseline: 'middle' });

    for (const b of this.buttons) b.render(ctx, s);
  }
}
