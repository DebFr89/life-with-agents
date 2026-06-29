// DPR-aware canvas. Gameplay code draws in CSS pixels (this.width/height);
// the backing store is scaled for crisp rendering on Retina. DPR capped at 2.
export class Canvas {
  constructor(el) {
    this.el = el;
    this.ctx = el.getContext('2d');
    this.width = 0;
    this.height = 0;
    this.cx = 0;
    this.cy = 0;
    this.dpr = 1;
    this.resize();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;
    this.el.style.width = cssW + 'px';
    this.el.style.height = cssH + 'px';
    this.el.width = Math.round(cssW * dpr);
    this.el.height = Math.round(cssH * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = cssW;
    this.height = cssH;
    this.cx = cssW / 2;
    this.cy = cssH / 2;
    this.dpr = dpr;
  }

  clear(color) {
    const { ctx } = this;
    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (color) { ctx.fillStyle = color; ctx.fillRect(0, 0, this.width, this.height); }
    else ctx.clearRect(0, 0, this.width, this.height);
    ctx.restore();
  }
}
