// Owns the active scene plus an optional overlay stack (e.g. Settings).
// Only the active scene + overlays update/render each frame.
export class SceneManager {
  constructor(game) {
    this.game = game;
    this.active = null;
    this.overlays = [];
  }

  switch(scene) {
    if (this.active) this.active.leave();
    this.active = scene;
    scene.resize();
    scene.enter();
  }

  pushOverlay(scene) { scene.resize(); scene.enter(); this.overlays.push(scene); }
  popOverlay() { const s = this.overlays.pop(); if (s) s.leave(); }
  get topScene() { return this.overlays[this.overlays.length - 1] || this.active; }

  frame(dt, ctx) {
    if (this.active) { this.active.update(dt); this.active.render(ctx); }
    for (const o of this.overlays) { o.update(dt); o.render(ctx); }
  }

  resize() {
    this.active?.resize();
    for (const o of this.overlays) o.resize();
  }

  // Pointer events go to the top-most interactive scene only.
  onPointerDown(x, y) { this.topScene?.onPointerDown(x, y); }
  onPointerMove(x, y) { this.topScene?.onPointerMove(x, y); }
  onPointerUp(x, y) { this.topScene?.onPointerUp(x, y); }
}
