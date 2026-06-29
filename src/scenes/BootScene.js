import { Scene } from './Scene.js';
import { THEME, FONT, text } from '../ui/theme.js';

// Brief splash; immediately ready since all assets are procedural.
export class BootScene extends Scene {
  enter() { this.t = 0; }
  update(dt) {
    this.t += dt;
    if (this.t > 0.7) this.game.go('Menu');
  }
  render(ctx) {
    const { canvas } = this.game;
    const s = Math.min(1.4, canvas.height / 420);
    text(ctx, '✈', canvas.width / 2, canvas.height / 2 - 10 * s,
      { font: FONT.ui(48 * s, 700), color: THEME.accent, align: 'center', baseline: 'middle' });
    const dots = '.'.repeat(1 + Math.floor((this.t * 3) % 3));
    text(ctx, 'LOADING' + dots, canvas.width / 2, canvas.height / 2 + 40 * s,
      { font: FONT.ui(13 * s, 600), color: THEME.textDim, align: 'center', baseline: 'middle' });
  }
}
