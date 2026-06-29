// Pseudo-3D camera + projection (Canvas 2D, no WebGL).
// World point (worldX lateral, worldY vertical, z ahead) → screen.
//   scale   = focalLength / (focalLength + z)
//   screenX = cx + (worldX - camX) * scale
//   screenY = horizonY - (worldY - camAlt) * scale
// Banking rolls the whole world about the horizon; climbing shifts the horizon down.
import { CONFIG } from '../data/config.js';

export class Pseudo3D {
  constructor() {
    this.f = CONFIG.focalLength;
    this.cx = 0;
    this.horizonY = 0;
    this.cam = { x: 0, alt: 0, pitch: 0, bank: 0 };
  }

  // cam: { x, alt, pitch(-1..1), bank(radians) }
  update(canvas, cam) {
    this.cx = canvas.width / 2;
    this.horizonY = canvas.height * CONFIG.horizonFrac + cam.pitch * CONFIG.pitchPixels;
    this.cam = cam;
  }

  project(worldX, worldY, z) {
    const scale = this.f / (this.f + z);
    return {
      sx: this.cx + (worldX - this.cam.x) * scale,
      sy: this.horizonY - (worldY - this.cam.alt) * scale,
      scale,
      z,
    };
  }

  visible(z) { return z > -CONFIG.despawnMargin && z < CONFIG.viewDistance; }

  // Apply world roll (call before drawing the ground & entities, restore after).
  beginWorld(ctx) {
    ctx.save();
    ctx.translate(this.cx, this.horizonY);
    ctx.rotate(-this.cam.bank);
    ctx.translate(-this.cx, -this.horizonY);
  }
  endWorld(ctx) { ctx.restore(); }
}
