// Top-level orchestrator: builds services, wires input/resize, owns the loop and
// the scene registry. Scenes navigate via game.go('SceneName', params).
import { Canvas } from './Canvas.js';
import { Loop } from './Loop.js';
import { Audio } from './Audio.js';
import { SceneManager } from './SceneManager.js';
import { Emitter } from './Events.js';
import { InputManager } from '../input/InputManager.js';
import { SaveStore } from '../career/SaveStore.js';
import { CONFIG } from '../data/config.js';
import { AIRCRAFT } from '../data/aircraft.js';
import { LICENSES } from '../data/licenses.js';
import { ROUTES } from '../data/routes.js';

export class Game {
  constructor(canvasEl, sceneRegistry) {
    this.registry = sceneRegistry;
    this.events = new Emitter();
    this.canvas = new Canvas(canvasEl);
    this.audio = new Audio();
    this.save = new SaveStore();
    this.input = new InputManager(this);
    this.scenes = new SceneManager(this);
    this.data = { CONFIG, AIRCRAFT, LICENSES, ROUTES };
    this.loop = new Loop((dt) => this._frame(dt));

    this._bindEvents(canvasEl);
  }

  go(name, params) {
    const C = this.registry[name];
    if (!C) { console.error('Unknown scene:', name); return; }
    this.scenes.switch(new C(this, params));
  }

  start(firstScene = 'Boot') {
    this.input.attach();
    this.go(firstScene);
    this.loop.start();
  }

  _frame(dt) {
    this.input.update(dt);
    this.canvas.clear('#0b1d33');
    this.scenes.frame(dt, this.canvas.ctx);
  }

  _toLocal(e) {
    const r = this.canvas.el.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }

  _bindEvents(el) {
    window.addEventListener('resize', () => { this.canvas.resize(); this.scenes.resize(); });
    window.addEventListener('orientationchange', () => {
      // give the browser a frame to settle the new viewport
      requestAnimationFrame(() => { this.canvas.resize(); this.scenes.resize(); });
    });

    const down = (e) => {
      if (!this.audio.unlocked) this.audio.unlock(); else this.audio.resume();
      const [x, y] = this._toLocal(e);
      this.scenes.onPointerDown(x, y);
      this.input.touch.onPointerDown(e.pointerId, x, y);
    };
    const move = (e) => {
      const [x, y] = this._toLocal(e);
      this.scenes.onPointerMove(x, y);
      this.input.touch.onPointerMove(e.pointerId, x, y);
    };
    const up = (e) => {
      const [x, y] = this._toLocal(e);
      this.scenes.onPointerUp(x, y);
      this.input.touch.onPointerUp(e.pointerId);
    };

    el.addEventListener('pointerdown', (e) => { el.setPointerCapture?.(e.pointerId); down(e); });
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }
}
