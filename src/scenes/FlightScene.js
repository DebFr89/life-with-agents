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
    this.cam = { x: 0, alt: 0, pitch: 0, bank: 0 };   // smoothed view, eases behind physics

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
      this._updateCamera(dt);
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
    this._updateCamera(dt);
    this.fx.update(dt);
  }

  // Ease the rendered camera behind the raw physics so the horizon, roll and
  // altitude never snap — the core of the "stabilized" feel.
  _updateCamera(dt) {
    const C = CONFIG;
    const ease = (cur, tgt, tau) => cur + (tgt - cur) * (1 - Math.exp(-dt / Math.max(0.001, tau)));
    this.cam.x = ease(this.cam.x, this.model.x, C.camSmoothPos);
    this.cam.alt = ease(this.cam.alt, this.model.altitude, C.camSmoothAlt);
    this.cam.pitch = ease(this.cam.pitch, this.model.pitchNorm, C.camSmoothPitch);
    this.cam.bank = ease(this.cam.bank, this.model.bank, C.camSmoothBank);
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

    // smoothed camera (eases behind physics — see _updateCamera)
    this.p3d.update(canvas, {
      x: this.cam.x,
      alt: this.cam.alt,
      pitch: this.cam.pitch,
      bank: this.cam.bank,
    });

    // screen shake
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);

    this.bg.draw(ctx, this.p3d, canvas, this.route.weather, this.odometer, this.lastDt);

    // refresh entity z then draw
    for (const e of this.world.entities) e.z = e.dist - this.planeDistance;
    this._drawPath(ctx);
    this._drawRunway(ctx);
    drawEntities(ctx, this.p3d, this.world.entities);

    // player aircraft (hidden once a crash fireball starts)
    if (!(this.ending && this.ending.gradeKey === 'CRASH')) {
      const px = canvas.width / 2;
      const py = canvas.height * 0.72 + Math.sin(this.bob * 3) * 3 * s;
      drawPlane(ctx, px, py, 40 * s, this.cam.bank, this.ac);
    }

    this.fx.draw(ctx);
    ctx.restore();

    // HUD (no shake)
    drawHUD(ctx, this.game, this._hudInfo());
    for (const b of this.buttons) b.render(ctx, s);
  }

  // Flight-path indicator: flowing chevrons on the ground leading from beneath
  // the aircraft toward the next gate (cruise) or the runway centreline (approach).
  _drawPath(ctx) {
    if (this.ending) return;
    let targetX = 0;
    if (this.phase === 'takeoff' || this.phase === 'cruise') {
      const g = this.world.gates.find(x => !x.scored);
      targetX = g ? g.x : 0;
    }
    const N = 9, near = 55, far = 440, step = (far - near) / N;
    const flow = this.odometer % step;               // chevrons stream toward the camera
    this.p3d.beginWorld(ctx);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (let i = 0; i < N; i++) {
      const z = near + i * step - flow;
      if (z < 10) continue;
      const t = clamp((z - near) / (far - near), 0, 1);
      const x = lerp(this.cam.x, targetX, t);
      const p = this.p3d.project(x, 1, z);
      const w = 20 * p.scale, h = 13 * p.scale;
      ctx.strokeStyle = `rgba(120,220,255,${clamp(1 - t, 0.12, 0.85)})`;
      ctx.lineWidth = Math.max(1.5, 3.2 * p.scale);
      ctx.beginPath();
      ctx.moveTo(p.sx - w, p.sy + h);
      ctx.lineTo(p.sx, p.sy - h * 0.4);
      ctx.lineTo(p.sx + w, p.sy + h);
      ctx.stroke();
    }
    this.p3d.endWorld(ctx);
  }

  _drawRunway(ctx) {
    const zThr = this.D - this.planeDistance;
    if (this._leftGround && zThr < CONFIG.viewDistance * 0.98) {
      this._runway(ctx, zThr, 760, true);            // destination runway + approach lights
    } else if (!this._leftGround && this.planeDistance < 440) {
      this._runway(ctx, -this.planeDistance, 600, false);   // departure strip
    }
  }

  _runway(ctx, zThreshold, len, withApproach) {
    const p3d = this.p3d;
    const hw = CONFIG.gateHalfWidth * 1.5;
    const zN = Math.max(0.1, zThreshold);
    const zF = zThreshold + len;
    if (zF <= 0.2) return;

    p3d.beginWorld(ctx);
    // asphalt
    const nL = p3d.project(-hw, 0, zN), nR = p3d.project(hw, 0, zN);
    const fL = p3d.project(-hw, 0, zF), fR = p3d.project(hw, 0, zF);
    ctx.fillStyle = '#33373d';
    ctx.beginPath();
    ctx.moveTo(nL.sx, nL.sy); ctx.lineTo(nR.sx, nR.sy);
    ctx.lineTo(fR.sx, fR.sy); ctx.lineTo(fL.sx, fL.sy); ctx.closePath(); ctx.fill();
    // centreline dashes
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(1, 3 * nL.scale);
    ctx.setLineDash([14 * nL.scale, 16 * nL.scale]);
    const c0 = p3d.project(0, 0, zN), c1 = p3d.project(0, 0, zF);
    ctx.beginPath(); ctx.moveTo(c0.sx, c0.sy); ctx.lineTo(c1.sx, c1.sy); ctx.stroke();
    ctx.setLineDash([]);
    // threshold "piano key" markings
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let k = -3; k <= 3; k++) {
      const b = p3d.project(k * hw / 4, 0, zN + 10);
      const w = Math.max(1, 3 * b.scale), h = Math.max(2, 16 * b.scale);
      ctx.fillRect(b.sx - w / 2, b.sy - h, w, h);
    }
    p3d.endWorld(ctx);

    // lights
    p3d.beginWorld(ctx);
    for (let z = zN; z <= zF; z += 46) { this._light(ctx, -hw, z, '#ffffff'); this._light(ctx, hw, z, '#ffffff'); }
    for (let k = -2; k <= 2; k++) { this._light(ctx, k * hw / 2, zN, '#39ff88'); this._light(ctx, k * hw / 2, zF, '#ff5a5a'); }
    if (withApproach) {
      const n = 7, gap = 34, seq = Math.floor(this.bob * 8) % n;
      for (let i = 0; i < n; i++) {
        const z = zN - (i + 1) * gap;
        if (z <= 0.5) continue;
        const on = i === (n - 1 - seq);              // "rabbit" runs toward the runway
        this._light(ctx, 0, z, on ? '#ffffff' : '#6f86a0', on ? 1.5 : 0.8);
      }
    }
    p3d.endWorld(ctx);
  }

  _light(ctx, x, z, color, r = 1) {
    if (z <= 0.2) return;
    const p = this.p3d.project(x, 1, z);
    const rr = Math.max(1.2, r * 3.2 * p.scale);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.arc(p.sx, p.sy, rr, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.22;                          // soft glow halo
    ctx.beginPath(); ctx.arc(p.sx, p.sy, rr * 2.3, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
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
