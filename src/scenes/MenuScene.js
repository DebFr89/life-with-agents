import { Scene } from './Scene.js';
import { Button } from '../ui/widgets.js';
import { THEME, FONT, text, uiScale, hasTouch } from '../ui/theme.js';
import { drawPlane } from '../render/Sprite.js';
import { getAircraft } from '../data/aircraft.js';

export class MenuScene extends Scene {
  enter() { this.t = 0; this.build(); }
  resize() { this.build(); }

  build() {
    const { canvas, input } = this.game;
    const s = uiScale(canvas);
    const w = Math.min(canvas.width * 0.62, 300 * s);
    const h = 52 * s;
    const cx = canvas.width / 2 - w / 2;
    let y = canvas.height * 0.52;
    const gap = 14 * s;
    this.buttons = [];

    this.buttons.push(new Button({
      x: cx, y, w, h, label: 'Start Career', kind: 'primary',
      onClick: () => this.game.go('Hub'),
    }));
    y += h + gap;

    if (input.tiltSupported && hasTouch() && !input.tiltActive) {
      this.buttons.push(new Button({
        x: cx, y, w, h: h * 0.82, label: 'Enable Tilt Controls', kind: 'panel',
        onClick: () => this.game.input.requestTilt().then(() => this.build()),
      }));
      y += h * 0.82 + gap;
    }

    this.buttons.push(new Button({
      x: cx, y, w, h: h * 0.82, label: 'Settings', kind: 'ghost',
      onClick: () => this.game.go('Settings', { return: 'Menu' }),
    }));
  }

  update(dt) { this.t += dt; }

  render(ctx) {
    const { canvas, input } = this.game;
    const s = uiScale(canvas);
    const W = canvas.width, H = canvas.height;

    // Decorative drifting aircraft.
    const px = W * 0.5 + Math.sin(this.t * 0.5) * W * 0.18;
    const py = H * 0.26 + Math.cos(this.t * 0.7) * 8 * s;
    drawPlane(ctx, px, py, 46 * s, Math.sin(this.t * 0.5) * 0.25, getAircraft('c172'));

    text(ctx, 'SKY CAREER', W / 2, H * 0.4, { font: FONT.ui(40 * s, 800), color: THEME.text, align: 'center', baseline: 'middle' });
    text(ctx, 'From student pilot to airline captain', W / 2, H * 0.4 + 28 * s,
      { font: FONT.ui(14 * s, 500), color: THEME.textDim, align: 'center', baseline: 'middle' });

    for (const b of this.buttons) b.render(ctx, s);

    // Control hint
    let hint;
    if (input.tiltActive) hint = 'Tilt to steer · hold screen for throttle';
    else if (hasTouch()) hint = 'Touch: left stick steers · right side = throttle';
    else hint = 'Keyboard: arrows steer · Space = throttle';
    text(ctx, hint, W / 2, H - 22 * s, { font: FONT.ui(11 * s, 500), color: THEME.textDim, align: 'center', baseline: 'middle' });
  }
}
