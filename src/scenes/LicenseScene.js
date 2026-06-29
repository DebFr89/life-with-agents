import { Scene } from './Scene.js';
import { Button, careerBar, panel } from '../ui/widgets.js';
import { THEME, FONT, text, uiScale, money } from '../ui/theme.js';
import { LICENSES, licenseOrder } from '../data/licenses.js';
import { licenseProgress } from '../career/Progression.js';

export class LicenseScene extends Scene {
  enter() { this.build(); }
  resize() { this.build(); }

  build() {
    const { canvas, save } = this.game;
    const s = uiScale(canvas); this.s = s;
    this.barH = 44 * s;
    const prog = licenseProgress(save.data);
    this.prog = prog;

    const navH = 56 * s, navY = canvas.height - navH + 8 * s;
    this.buttons = [];
    const backW = prog.canAttempt ? canvas.width * 0.42 : canvas.width - 32 * s;
    this.buttons.push(new Button({
      x: 16 * s, y: navY, w: backW, h: 40 * s, label: 'Back to Hub', kind: 'ghost',
      onClick: () => this.game.go('Hub'),
    }));
    if (prog.next && prog.canAttempt) {
      this.buttons.push(new Button({
        x: 16 * s + backW + 12 * s, y: navY, w: canvas.width - 32 * s - backW - 12 * s, h: 40 * s,
        label: `Start ${prog.next.abbr} Check-Ride`, kind: 'primary',
        onClick: () => this.game.go('Briefing', { routeId: prog.next.checkRide.routeId, mode: 'checkride', licenseId: prog.next.id }),
      }));
    }
  }

  render(ctx) {
    const { canvas, save } = this.game;
    const s = this.s;
    careerBar(ctx, this.game, s, 'Licenses');
    const curOrder = licenseOrder(save.data.currentLicense);

    let y = this.barH + 14 * s;
    const x = 16 * s, w = canvas.width - 32 * s, h = 48 * s, gap = 8 * s;
    for (const lic of LICENSES) {
      const earned = lic.order <= curOrder;
      const isCurrent = lic.order === curOrder;
      const isNext = lic.order === curOrder + 1;
      ctx.save();
      if (!earned && !isNext) ctx.globalAlpha = 0.5;
      panel(ctx, x, y, w, h, s, { fill: isCurrent ? THEME.panelHi : THEME.panel, strokeColor: isCurrent ? THEME.accent : THEME.stroke });
      const pad = 14 * s;
      const status = earned ? '✓ Earned' : (isNext ? 'Next' : 'Locked');
      const col = earned ? THEME.good : (isNext ? THEME.accent : THEME.textDim);
      text(ctx, `${lic.abbr} — ${lic.name}`, x + pad, y + 17 * s, { font: FONT.ui(14 * s, 700), color: THEME.text, baseline: 'middle' });
      text(ctx, lic.blurb, x + pad, y + 34 * s, { font: FONT.ui(10 * s, 500), color: THEME.textDim, baseline: 'middle' });
      text(ctx, status, x + w - pad, y + 17 * s, { font: FONT.ui(12 * s, 700), color: col, align: 'right', baseline: 'middle' });
      if (isNext && lic.requires) {
        text(ctx, `${lic.requires.hours} hrs · ${money(lic.requires.cash)} fee`, x + w - pad, y + 34 * s,
          { font: FONT.ui(10 * s, 600), color: THEME.textDim, align: 'right', baseline: 'middle' });
      }
      ctx.restore();
      y += h + gap;
    }

    // Progress note for the next license
    const prog = this.prog;
    if (prog.next) {
      const note = prog.canAttempt
        ? `You qualify for the ${prog.next.abbr} check-ride. Pass it to unlock Tier ${prog.next.unlocksTier} aircraft.`
        : `Need ${prog.req.hours} hrs (have ${save.data.flightHours.toFixed(1)}) and ${money(prog.req.cash)} to attempt the ${prog.next.abbr} check-ride.`;
      text(ctx, note, canvas.width / 2, y + 16 * s, { font: FONT.ui(11 * s, 600), color: prog.canAttempt ? THEME.good : THEME.textDim, align: 'center', baseline: 'middle' });
    } else {
      text(ctx, 'You hold the highest license. The skies are yours, Captain.', canvas.width / 2, y + 16 * s,
        { font: FONT.ui(12 * s, 700), color: THEME.gold, align: 'center', baseline: 'middle' });
    }

    for (const b of this.buttons) b.render(ctx, s);
  }
}
