import { Scene } from './Scene.js';
import { Button, panel } from '../ui/widgets.js';
import { THEME, FONT, text, uiScale, money } from '../ui/theme.js';
import { GRADE } from '../data/config.js';
import { getRoute } from '../data/routes.js';
import { getAircraft } from '../data/aircraft.js';
import { getLicense } from '../data/licenses.js';
import { settleFlight } from '../career/Economy.js';
import { promote, bestGrade } from '../career/Progression.js';

export class ResultsScene extends Scene {
  enter() {
    const o = this.params;
    this.route = getRoute(o.routeId);
    this.ac = getAircraft(o.aircraftId);
    this.result = settleFlight(this.route, this.ac, o);
    this.promoted = false;
    this._apply(o);
    this.build();
  }

  _apply(o) {
    const save = this.game.save;
    const p = save.data;
    const r = this.result;

    p.cash += r.net;
    p.flightHours = +(p.flightHours + o.hours).toFixed(3);
    p.xp += r.xp;
    p.stats.flights++;
    if (o.gradeKey === 'PERFECT') p.stats.perfects++;
    if (r.crashed) p.stats.crashes++;
    if (!this.route.checkRide) p.completedRoutes[o.routeId] = bestGrade(p.completedRoutes[o.routeId], o.gradeKey);

    // Check-ride promotion
    if (o.mode === 'checkride' && o.licenseId) {
      const lic = getLicense(o.licenseId);
      const landedWell = o.gradeKey === 'PERFECT' || o.gradeKey === 'GOOD';
      const enoughGates = o.gatesHit >= Math.ceil(o.gatesTotal * 0.5);
      this.passed = landedWell && enoughGates;
      if (this.passed && p.currentLicense !== lic.id && p.cash >= lic.requires.cash) {
        promote(p, lic);
        this.promoted = true;
        this.game.audio.blip('buy');
      }
    }
    save.save();
  }

  build() {
    const { canvas } = this.game;
    const s = uiScale(canvas); this.s = s;
    const next = (this.route.checkRide) ? 'License' : 'Hub';
    this.buttons = [new Button({
      x: 16 * s, y: canvas.height - 56 * s, w: canvas.width - 32 * s, h: 42 * s,
      label: 'Continue', kind: 'primary', onClick: () => this.game.go(next),
    })];
  }

  render(ctx) {
    const { canvas } = this.game;
    const s = this.s;
    const r = this.result;
    const grade = r.grade;
    const W = canvas.width;

    text(ctx, grade.label, W / 2, canvas.height * 0.13, { font: FONT.ui(30 * s, 800), color: grade.color, align: 'center', baseline: 'middle' });
    text(ctx, `${this.route.name}  ·  ${this.ac.name}`, W / 2, canvas.height * 0.13 + 26 * s,
      { font: FONT.ui(12 * s, 600), color: THEME.textDim, align: 'center', baseline: 'middle' });

    // breakdown panel
    const pw = Math.min(W - 32 * s, 420 * s), px = (W - pw) / 2;
    let y = canvas.height * 0.26;
    const ph = 168 * s;
    panel(ctx, px, y, pw, ph, s);
    const lx = px + 18 * s, rx = px + pw - 18 * s;
    let ly = y + 26 * s;
    const line = (label, val, color = THEME.text) => {
      text(ctx, label, lx, ly, { font: FONT.ui(13 * s, 600), color: THEME.textDim, baseline: 'middle' });
      text(ctx, val, rx, ly, { font: FONT.mono(13 * s, 700), color, align: 'right', baseline: 'middle' });
      ly += 24 * s;
    };
    line(`Landing (${(grade.mult * 100).toFixed(0)}%)`, money(r.landingPay));
    line(`Gates ${this.params.gatesHit}/${this.params.gatesTotal}`, '+' + money(r.gatePay), THEME.good);
    line('Fuel', '-' + money(r.fuelCost), THEME.warn);
    if (r.repairCost > 0) line('Repairs', '-' + money(r.repairCost), THEME.bad);
    // divider
    ctx.strokeStyle = THEME.stroke; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(lx, ly - 8 * s); ctx.lineTo(rx, ly - 8 * s); ctx.stroke();
    ly += 6 * s;
    line('Net earnings', money(r.net), THEME.gold);
    line('Experience', '+' + r.xp + ' XP  ·  +' + this.params.hours.toFixed(2) + ' hrs', THEME.accent);

    // promotion / checkride status
    y += ph + 16 * s;
    if (this.route.checkRide) {
      if (this.promoted) {
        const lic = getLicense(this.params.licenseId);
        text(ctx, `🎉 LICENSE EARNED: ${lic.name}`, W / 2, y + 6 * s, { font: FONT.ui(15 * s, 800), color: THEME.gold, align: 'center', baseline: 'middle' });
        text(ctx, `Tier ${lic.unlocksTier} aircraft unlocked in the Hangar.`, W / 2, y + 26 * s, { font: FONT.ui(11 * s, 600), color: THEME.textDim, align: 'center', baseline: 'middle' });
      } else {
        text(ctx, 'Check-ride not passed — fly it again when ready.', W / 2, y + 10 * s,
          { font: FONT.ui(13 * s, 700), color: THEME.bad, align: 'center', baseline: 'middle' });
        text(ctx, 'Land GOOD or better and clear at least half the gates.', W / 2, y + 30 * s,
          { font: FONT.ui(11 * s, 500), color: THEME.textDim, align: 'center', baseline: 'middle' });
      }
    } else {
      text(ctx, `Balance: ${money(this.game.save.data.cash)}`, W / 2, y + 10 * s,
        { font: FONT.ui(13 * s, 700), color: THEME.text, align: 'center', baseline: 'middle' });
    }

    for (const b of this.buttons) b.render(ctx, s);
  }
}
