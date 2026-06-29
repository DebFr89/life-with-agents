// Merges keyboard, touch and tilt into one normalized control state:
//   state.steerX, state.pitchY  ∈ [-1, 1]
//   state.throttle              ∈ [0, 1]
// Source priority for steering: tilt → touch stick → keyboard.
import { KeyboardSource } from './KeyboardSource.js';
import { TouchSource } from './TouchSource.js';
import { TiltSource } from './TiltSource.js';

export class InputManager {
  constructor(game) {
    this.game = game;
    this.keyboard = new KeyboardSource();
    this.touch = new TouchSource(this);
    this.tilt = new TiltSource(this);
    this.tiltActive = false;
    this.state = { steerX: 0, pitchY: 0, throttle: 0 };
  }

  attach() {
    this.keyboard.attach();
  }

  get tiltSupported() { return this.tilt.available; }

  // Must be called from inside a user-gesture handler (pointerup/click).
  async requestTilt() {
    const ok = await this.tilt.request();
    this.tiltActive = ok;
    this.game.save.data.settings.tiltEnabled = ok;
    this.game.save.save();
    return ok;
  }

  disableTilt() {
    this.tilt.detach();
    this.tiltActive = false;
    this.game.save.data.settings.tiltEnabled = false;
    this.game.save.save();
  }

  calibrateTilt() { this.tilt.calibrate(); }

  update(dt) {
    this.keyboard.update();
    this.touch.update();
    if (this.tiltActive) this.tilt.update();

    let steer, pitch;
    if (this.tiltActive) { steer = this.tilt.steer; pitch = this.tilt.pitch; }
    else if (this.touch.joyActive) { steer = this.touch.steer; pitch = this.touch.pitch; }
    else { steer = this.keyboard.steer; pitch = this.keyboard.pitch; }

    const throttle = Math.max(this.keyboard.throttle, this.touch.throttle);

    this.state.steerX = clamp(steer, -1, 1);
    this.state.pitchY = clamp(pitch, -1, 1);
    this.state.throttle = clamp(throttle, 0, 1);
  }
}

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
