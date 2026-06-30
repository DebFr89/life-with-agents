// Device-orientation (gyro) steering. iOS 13+ needs requestPermission() from a
// user gesture AND a secure context (HTTPS/localhost). Falls back gracefully.
const RANGE = 38;        // degrees of tilt for full deflection (higher = less sensitive)
const DEADZONE = 4;      // degrees ignored around the calibrated zero (kills jitter)
const SMOOTH = 0.14;     // low-pass factor (lower = more stable)

export class TiltSource {
  constructor(manager) {
    this.m = manager;
    this.steer = 0;
    this.pitch = 0;
    this.zeroBeta = 0;
    this.zeroGamma = 0;
    this._beta = 0;
    this._gamma = 0;
    this._calibrated = false;
    this.attached = false;
    this._handler = this._onOrient.bind(this);
  }

  get available() { return typeof window.DeviceOrientationEvent !== 'undefined'; }
  get needsPermission() {
    return this.available && typeof window.DeviceOrientationEvent.requestPermission === 'function';
  }

  async request() {
    if (!this.available) return false;
    try {
      if (this.needsPermission) {
        const res = await window.DeviceOrientationEvent.requestPermission();
        if (res !== 'granted') return false;
      }
    } catch { return false; }
    this._attach();
    this._calibrated = false;     // recalibrate on next reading
    return true;
  }

  _attach() {
    if (this.attached) return;
    window.addEventListener('deviceorientation', this._handler, true);
    this.attached = true;
  }
  detach() {
    if (!this.attached) return;
    window.removeEventListener('deviceorientation', this._handler, true);
    this.attached = false;
  }
  calibrate() { this._calibrated = false; }

  _orientationAngle() {
    if (screen.orientation && typeof screen.orientation.angle === 'number') return screen.orientation.angle;
    if (typeof window.orientation === 'number') return window.orientation;
    return 0;
  }

  _onOrient(e) {
    if (e.beta == null || e.gamma == null) return;
    const angle = this._orientationAngle();
    // In landscape the device's beta/gamma swap roles vs portrait.
    let steerRaw, pitchRaw;
    if (angle === 90) { steerRaw = -e.beta; pitchRaw = -e.gamma; }
    else if (angle === -90 || angle === 270) { steerRaw = e.beta; pitchRaw = e.gamma; }
    else { steerRaw = e.gamma; pitchRaw = e.beta - 45; } // portrait fallback
    if (!this._calibrated) { this.zeroBeta = steerRaw; this.zeroGamma = pitchRaw; this._calibrated = true; }
    this._beta = steerRaw - this.zeroBeta;
    this._gamma = pitchRaw - this.zeroGamma;
  }

  update() {
    const invert = this.m.game.save.data.settings.invertPitch ? -1 : 1;
    const s = applyAxis(this._beta);
    const p = applyAxis(this._gamma) * invert;
    this.steer += (s - this.steer) * SMOOTH;
    this.pitch += (p - this.pitch) * SMOOTH;
  }
}

function applyAxis(deg) {
  const sign = Math.sign(deg);
  const mag = Math.max(0, Math.abs(deg) - DEADZONE);
  return clamp((sign * mag) / RANGE, -1, 1);
}
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
