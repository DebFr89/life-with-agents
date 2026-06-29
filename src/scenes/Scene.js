// Base scene. Scenes own their own update/render/input. All coordinates passed
// to pointer handlers are in CSS pixels relative to the canvas.
export class Scene {
  constructor(game, params = {}) {
    this.game = game;
    this.params = params;
    this.buttons = [];        // ui/widgets Button[] for menu scenes
  }
  enter() {}
  leave() {}
  update(dt) {}
  render(ctx) {}
  resize() {}

  // Pointer routing for in-canvas UI. Returns true if a button was hit.
  onPointerDown(x, y) {
    for (const b of this.buttons) {
      if (b.enabled !== false && b.hit(x, y)) { this._pressed = b; b.pressed = true; return true; }
    }
    return false;
  }
  onPointerMove(x, y) {}
  onPointerUp(x, y) {
    const b = this._pressed;
    this._pressed = null;
    if (b) {
      b.pressed = false;
      if (b.enabled !== false && b.hit(x, y)) { this.game.audio.blip('ui'); b.onClick?.(); }
    }
  }
}
