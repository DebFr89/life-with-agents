import { Scene } from './Scene.js';
import { Button, careerBar, panel } from '../ui/widgets.js';
import { THEME, FONT, text, uiScale } from '../ui/theme.js';

export class SettingsScene extends Scene {
  enter() { this.build(); }
  resize() { this.build(); }

  build() {
    const { canvas, input, save } = this.game;
    const s = uiScale(canvas); this.s = s;
    const x = 16 * s, w = canvas.width - 32 * s, h = 46 * s, gap = 10 * s;
    let y = 44 * s + 16 * s;
    this.buttons = [];

    const settings = save.data.settings;

    // Tilt toggle (only meaningful if supported)
    if (input.tiltSupported) {
      this.buttons.push(new Button({
        x, y, w, h, kind: input.tiltActive ? 'primary' : 'panel',
        label: input.tiltActive ? 'Tilt Controls: ON' : 'Tilt Controls: OFF',
        sub: input.tiltActive ? 'Tap to disable' : 'Tap to enable & calibrate',
        onClick: () => {
          if (input.tiltActive) input.disableTilt(); else input.requestTilt();
          this.build();
        },
      }));
      y += h + gap;
      if (input.tiltActive) {
        this.buttons.push(new Button({ x, y, w, h, label: 'Recalibrate Tilt (hold level & tap)', kind: 'ghost',
          onClick: () => { input.calibrateTilt(); this.game.audio.blip('ui'); } }));
        y += h + gap;
      }
    }

    // Invert pitch
    this.buttons.push(new Button({
      x, y, w, h, kind: 'panel',
      label: `Invert Pitch: ${settings.invertPitch ? 'ON' : 'OFF'}`,
      onClick: () => { settings.invertPitch = !settings.invertPitch; save.save(); this.build(); },
    }));
    y += h + gap;

    // SFX volume cycle
    this.buttons.push(new Button({
      x, y, w, h, kind: 'panel',
      label: `Sound Volume: ${Math.round(settings.sfxVolume * 100)}%`,
      onClick: () => {
        settings.sfxVolume = Math.round(((settings.sfxVolume + 0.25) % 1.25) * 100) / 100;
        this.game.audio.sfxVolume = settings.sfxVolume; save.save(); this.game.audio.blip('ui'); this.build();
      },
    }));
    y += h + gap;

    // Reset save
    this.buttons.push(new Button({
      x, y, w, h, kind: 'danger',
      label: this._confirmReset ? 'Tap again to ERASE career' : 'Reset Career',
      onClick: () => {
        if (this._confirmReset) { save.reset(); this._confirmReset = false; this.game.audio.blip('bad'); this.game.go('Menu'); }
        else { this._confirmReset = true; this.build(); }
      },
    }));
    y += h + gap;

    this.buttons.push(new Button({
      x, y: canvas.height - 56 * s, w, h: 40 * s, label: 'Done', kind: 'primary',
      onClick: () => this.game.go(this.params.return || 'Menu'),
    }));
  }

  render(ctx) {
    const s = this.s;
    careerBar(ctx, this.game, s, 'Settings');
    for (const b of this.buttons) b.render(ctx, s);
  }
}
