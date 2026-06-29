// Arcade flight physics — readable, "basic controls" friendly, tuned per aircraft.
// All magnitudes come from the aircraft definition + CONFIG.
import { CONFIG } from '../data/config.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export class FlightModel {
  constructor(aircraft) {
    this.ac = aircraft;
    this.reset();
  }

  reset() {
    this.x = 0;                       // lateral world position
    this.altitude = 0;                // 0 = ground
    this.speed = this.ac.stallSpeed * 0.4;
    this.vSpeed = 0;
    this.bank = 0;
    this.fuel = this.ac.fuelCapacity;
    this.airborne = false;
    this.outOfFuel = false;
  }

  get rotateSpeed() { return this.ac.maxSpeed * CONFIG.rotateSpeedFrac; }
  get fuelFrac() { return clamp(this.fuel / this.ac.fuelCapacity, 0, 1); }
  get speedFrac() { return clamp(this.speed / this.ac.maxSpeed, 0, 1); }
  get fuelUsed() { return this.ac.fuelCapacity - this.fuel; }
  get pitchNorm() { return clamp(this.vSpeed / (this.ac.climbRate || 1), -1, 1); }

  update(dt, input) {
    const ac = this.ac;
    this.outOfFuel = this.fuel <= 0;
    const throttle = this.outOfFuel ? 0 : input.throttle;

    // Bank toward steering input.
    const targetBank = input.steerX * ac.maxBank;
    this.bank += (targetBank - this.bank) * Math.min(1, ac.handling * dt);

    // Speed eases toward throttle setting (decays when engine-out).
    const targetSpeed = this.outOfFuel ? 0 : (ac.stallSpeed + throttle * (ac.maxSpeed - ac.stallSpeed));
    this.speed += (targetSpeed - this.speed) * Math.min(1, ac.accel * dt);
    if (this.speed < 0) this.speed = 0;

    // Lateral drift from bank (a coordinated-turn fake).
    this.x += Math.sin(this.bank) * this.speed * CONFIG.bankToTurn * dt;
    this.x = clamp(this.x, -CONFIG.lateralMax, CONFIG.lateralMax);

    // Vertical: climb/descend from pitch; gravity if stalled/out of fuel.
    const canClimb = this.speed >= this.rotateSpeed;
    let targetVS;
    if (this.outOfFuel || !canClimb) {
      targetVS = (this.altitude > 0 || this.outOfFuel) ? -CONFIG.gravityWhenStalled * 0.6 : 0;
      if (!this.outOfFuel && canClimb === false && this.altitude <= 0) targetVS = 0;
    } else {
      targetVS = input.pitchY * ac.climbRate;
      this.airborne = true;
    }
    this.vSpeed += (targetVS - this.vSpeed) * Math.min(1, CONFIG.pitchResponse * dt);
    this.altitude += this.vSpeed * dt;

    if (this.altitude <= 0) {
      this.altitude = 0;
      if (this.vSpeed < 0) this.airborne = false;   // touchdown handled by caller
    }
    if (this.altitude > CONFIG.altMax) { this.altitude = CONFIG.altMax; if (this.vSpeed > 0) this.vSpeed = 0; }

    // Fuel burn.
    if (!this.outOfFuel) {
      this.fuel -= (ac.idleBurn + throttle * ac.burnRate) * dt;
      if (this.fuel < 0) this.fuel = 0;
    }

    // expose normalized throttle for HUD
    this.throttle = throttle;
  }
}
