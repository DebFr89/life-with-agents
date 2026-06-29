import { Scene } from './Scene.js';
import { Button } from '../ui/widgets.js';
import { CONFIG } from '../data/config.js';
import { getRoute } from '../data/routes.js';
import { getAircraft } from '../data/aircraft.js';
import { Pseudo3D } from '../render/Pseudo3D.js';
import { Background } from '../render/Background.js';
import { drawEntities } from '../render/EntityRenderer.js';
import { drawPlane } from '../render/Sprite.js';
import { Particles } from '../render/effects.js';
import { FlightModel } from '../world/FlightModel.js';
import { buildWorld } from '../world/Spawner.js';
import { processCrossings, advanceNextGate } from '../world/collisions.js';
import { judgeLanding } from '../world/LandingJudge.js';
import { drawHUD } from '../ui/HUD.js';
import { uiScale } from '../ui/theme.js';

export class FlightScene extends Scene {
  enter() {
    const { canvas } = this.game;
    const s = uiScale(canvas);
    this.route = getRoute(this.params.routeId);
    this.ac = getAircraft(this.game.save.data.activeAircraft);
    this.D = this.route.distance;

    this.model = new FlightModel(this.ac);
    this.world = buildWorld(this.route);
    this.p3d = new Pseudo3D();
    this.bg = new Background();
    this.fx = new Particles(220);

    this.planeDistance = 0;        // route progress — only advances once airborne
    this.odometer = 0;             // visual ground-scroll — always advances with speed
    this.acc = 0;
    this.phase = 'takeoff';
    this.gatesHit = 0;
    this.hull = 1;
    this.lastDt = 0;
    this.bob = 0;
    this.shake = 0;
    this.message = null;
    this.ending = null;          // { gradeKey, t } once the flight is over
    this.approachStart = this.D * CONFIG.approachFrac;

    this.buttons = [new Button({
      x: canvas.width - 86 * s, y: 50 * s, w: 70 * s, h: 28 * s, label: 'Abort', kind: 'ghost',
      onClick: () => this.game.go('Hub'),
    })];

    this.setMsg('HOLD THROTTLE TO TAKE OFF', '#ffffff', 2.2);
    this.game.audio.startEngine();
  }

  leave() { this.game.audio.stopEngine(); }

  setMsg(text, color, dur = 1.4) { this.message = { text, color, t: dur }; }

  update(dt) {
    this.lastDt = dt;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 24);
    if (this.message) { this.message.t -= dt; if (this.message.t <= 0) this.message = null; }
    this.bob += dt;

    if (this.ending) {
      this.ending.t -= dt;
      this.fx.update(dt);
      if (this.ending.t <= 0) this._goResults();
      return;
    }

    const input = this.game.input.state;
    const prev = this.planeDistance;
    const step = CONFIG.physicsStep;
    this.acc += dt;
    let guard = 0;
    while (this.acc >= step && guard < 240) {
      this.model.update(step, input);
      const ds = this.model.speed * step;
      this.odometer += ds;
      if (this.model.airborne) this.planeDistance += ds;   // taxiing/idling doesn't burn the route
      this.acc -= step; guard++;
    }

    this._crossings(prev, this.planeDistance);
    this._phases();
    this._engineAndTrail(input);
    this.fx.update(dt);
  }

  _crossings(prev, now) {
    const ev = processCrossings(this.world, this.model, prev, now);
    for (const g of ev.gates) {
      if (g.passed) { this.gatesHit++; this.setMsg('GATE +$' + CONFIG.gateBonus, '#5ef2a8', 0.8); this.game.audio.blip('gate'); }
      else { this.setMsg('GATE MISSED', '#ffd166', 0.8); }
    }
    if (ev.gates.length) advanceNextGate(this.world.gates);
    for (const h of ev.hazards) {
      this.hull = Math.max(0, this.hull - CONFIG.hazardDamage);
      this.shake = 10; this.game.audio.blip('bad');
      this.setMsg('IMPACT!', '#ff6b6b', 0.7);
      const px = this.game.canvas.width / 2, py = this.game.canvas.height * 0.72;
      this.fx.burst(px, py, 14, '#ffb15e', { speed: 220, spread: 200 });
      if (this.hull <= 0) return this._end('CRASH', 'HULL FAILURE');
    }
  }

  _phases() {
    const D = this.D;
    if (!this._leftGround && this.model.airborne && this.model.altitude > CONFIG.takeoffAlt) {
      this._leftGround = true; this.phase = 'cruise'; this.setMsg('AIRBORNE — FLY THE GATES', '#9fe0ff', 1.4);
    } else if (this.phase === 'takeoff' && this.model.airborne) {
      this.phase = 'takeoff'; // climbing out
    }
    if (this.phase === 'cruise' && this.planeDistance >= this.approachStart) {
      this.phase = 'approach'; this.setMsg('APPROACH — LINE UP & DESCEND', '#9fe0ff', 1.8);
    }

    // Touchdown / overshoot detection once we've actually flown.
    if (this._leftGround && this.model.altitude <= 0) {
      if (this.planeDistance >= D * 0.8) {
        const res = judgeLanding(this.model, this.route, this.ac);
        this._end(res.gradeKey, res.gradeKey === 'CRASH' ? 'HARD IMPACT' : null, res);
      } else {
        this._end('CRASH', 'LANDED OFF-AIRPORT');
      }
    } else if (this.planeDistance > D * 1.12 && this._leftGround) {
      this._end('CRASH', 'OVERSHOT THE RUNWAY');
    }
  }

  _engineAndTrail(input) {
    this.game.audio.setEngine(this.model.throttle ?? 0, this.model.speedFrac);
    if ((this.model.throttle ?? 0) > 0.25) {
      const px = this.game.canvas.width / 2, py = this.game.canvas.height * 0.72 + 12;
      const jitter = (Math.random() - 0.5) * 8;
      this.fx.emit(px + jitter, py, jitter * 2, 80 + Math.random() * 60, 0.35, Math.random() < 0.5 ? '#ffd08a' : '#9fe0ff', 2.5);
    }
  }

  _end(gradeKey, banner, judgeResult = null) {
    if (this.ending) return;
    this.judgeResult = judgeResult;
    this.ending = { gradeKey, t: gradeKey === 'CRASH' ? 1.6 : 1.1 };
    const W = this.game.canvas.width, H = this.game.canvas.height;
    if (gradeKey === 'CRASH') {
      this.shake = 16; this.game.audio.blip('crash');
      this.fx.burst(W / 2, H * 0.72, 40, '#ff7a3c', { speed: 320, spread: 300, size: 4 });
      this.fx.burst(W / 2, H * 0.72, 24, '#ffd166', { speed: 200, spread: 300, size: 3 });
    } else {
      this.game.audio.blip('good');
      this.fx.burst(W / 2, H * 0.74, 18, '#5ef2a8', { speed: 140, spread: 220 });
    }
    this.setMsg(banner || (gradeKey === 'PERFECT' ? 'PERFECT TOUCHDOWN!' : gradeKey === 'GOOD' ? 'NICE LANDING' : 'ROUGH LANDING'),
      gradeKey === 'CRASH' ? '#ff6b6b' : '#5ef2a8', 2);
    this.game.audio.stopEngine();
  }

  _goResults() {
    const outcome = {
      routeId: this.route.id,
      aircraftId: this.ac.id,
      gradeKey: this.ending.gradeKey,
      gatesHit: this.gatesHit,
      gatesTotal: this.world.gates.length,
      fuelUsed: this.model.fuelUsed,
      hullDamage: 1 - this.hull,
      hours: this.D / 5000,
      mode: this.params.mode,
      licenseId: this.params.licenseId,
    };
    this.game.go('Results', outcome);
  }

  // --- pointer (abort button only) ---
  onPointerDown(x, y) { return super.onPointerDown(x, y); }

  render(ctx) {
    const { canvas } = this.game;
    const s = uiScale(canvas);

    // camera from flight state
    this.p3d.update(canvas, {
      x: this.model.x,
      alt: this.model.altitude,
      pitch: this.model.pitchNorm,
      bank: this.model.bank,
    });

    // screen shake
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);

    this.bg.draw(ctx, this.p3d, canvas, this.route.weather, this.odometer, this.lastDt);

    // refresh entity z then draw
    for (const e of this.world.entities) e.z = e.dist - this.planeDistance;
    this._drawRunway(ctx);
    drawEntities(ctx, this.p3d, this.world.entities);

    // player aircraft (hidden once a crash fireball starts)
    if (!(this.ending && this.ending.gradeKey === 'CRASH')) {
      const px = canvas.width / 2;
      const py = canvas.height * 0.72 + Math.sin(this.bob * 3) * 3 * s;
      drawPlane(ctx, px, py, 40 * s, this.model.bank, this.ac);
    }

    this.fx.draw(ctx);
    ctx.restore();

    // HUD (no shake)
    drawHUD(ctx, this.game, this._hudInfo());
    for (const b of this.buttons) b.render(ctx, s);
  }

  _drawRunway(ctx) {
    const zThreshold = this.D - this.planeDistance;
    if (zThreshold > 620 || this.phase === 'takeoff' && !this._leftGround) {
      // also show a departure runway at the start
      if (this.planeDistance < 300) this._runwayQuad(ctx, -this.planeDistance, 600);
      return;
    }
    this._runwayQuad(ctx, zThreshold, 700);
  }

  _runwayQuad(ctx, zNear, len) {
    const hw = CONFIG.gateHalfWidth * 1.4;
    const nearL = this.p3d.project(-hw, 0, Math.max(0.1, zNear));
    const nearR = this.p3d.project(hw, 0, Math.max(0.1, zNear));
    const farL = this.p3d.project(-hw, 0, zNear + len);
    const farR = this.p3d.project(hw, 0, zNear + len);
    this.p3d.beginWorld(ctx);
    ctx.fillStyle = '#3a3f47';
    ctx.beginPath();
    ctx.moveTo(nearL.sx, nearL.sy); ctx.lineTo(nearR.sx, nearR.sy);
    ctx.lineTo(farR.sx, farR.sy); ctx.lineTo(farL.sx, farL.sy); ctx.closePath(); ctx.fill();
    // centreline dashes
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = Math.max(1, 3 * nearL.scale);
    ctx.setLineDash([12 * nearL.scale, 14 * nearL.scale]);
    ctx.beginPath();
    const c0 = this.p3d.project(0, 0, Math.max(0.1, zNear));
    const c1 = this.p3d.project(0, 0, zNear + len);
    ctx.moveTo(c0.sx, c0.sy); ctx.lineTo(c1.sx, c1.sy); ctx.stroke();
    ctx.setLineDash([]);
    this.p3d.endWorld(ctx);
  }

  _hudInfo() {
    const phaseLabel = {
      takeoff: this._leftGround ? 'CLIMB' : 'TAKEOFF',
      cruise: 'CRUISE',
      approach: 'APPROACH',
    }[this.phase] || 'FLIGHT';

    let approach = null;
    if (this.phase === 'approach' && !this.ending) {
      const tAlt = lerp(CONFIG.cruiseAlt, 0, clamp((this.planeDistance - this.approachStart) / (this.D - this.approachStart), 0, 1));
      approach = {
        active: true,
        lateral: clamp(this.model.x / (CONFIG.lateralMax * 0.5), -1, 1),
        glide: clamp((this.model.altitude - tAlt) / 45, -1, 1),
      };
    }
    return {
      state: { speed: this.model.speed, altitude: this.model.altitude, throttle: this.model.throttle ?? 0 },
      route: this.route,
      phaseLabel,
      progress: clamp(this.planeDistance / this.D, 0, 1),
      gatesHit: this.gatesHit,
      gatesTotal: this.world.gates.length,
      fuelFrac: this.model.fuelFrac,
      hull: this.hull,
      approach,
      message: this.message,
    };
  }
}

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
