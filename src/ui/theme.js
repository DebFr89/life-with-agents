// Shared visual language: palette, fonts, and small format helpers.
export const THEME = {
  bg: '#0b1d33',
  panel: '#13294a',
  panelHi: '#1b3a66',
  stroke: '#2c4f80',
  text: '#eaf2ff',
  textDim: '#8fa9cc',
  accent: '#3fa9f5',
  accentText: '#04121f',
  good: '#5ef2a8',
  warn: '#ffd166',
  bad: '#ff6b6b',
  gold: '#ffd166',
};

export const FONT = {
  ui: (px, weight = 600) => `${weight} ${px}px -apple-system, "Segoe UI", system-ui, sans-serif`,
  mono: (px, weight = 600) => `${weight} ${px}px "SF Mono", ui-monospace, Menlo, monospace`,
};

export const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
export const hoursLabel = (h) => `${h.toFixed(1)} hrs`;

// True on phones/tablets (coarse pointer). Used to gate tilt + pick control hints,
// so desktop keyboard users never get trapped behind a dead gyro.
export const hasTouch = () =>
  (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || (navigator.maxTouchPoints || 0) > 0;

// Responsive scale factor so layouts read well on phone and tablet.
export function uiScale(canvas) {
  return Math.max(0.7, Math.min(1.4, canvas.height / 420));
}

export function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function text(ctx, str, x, y, { font, color, align = 'left', baseline = 'alphabetic' } = {}) {
  ctx.font = font || FONT.ui(16);
  ctx.fillStyle = color || THEME.text;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(str, x, y);
}
