// Procedural aircraft art (no image assets). `drawPlane` renders a stylized
// rear-3/4 silhouette that banks with `bank` (radians). `span` = wing half-span px.
export function drawPlane(ctx, px, py, span, bank, ac, opts = {}) {
  const body = ac?.color || '#e8eef7';
  const accent = ac?.accent || '#3fa9f5';
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(bank);

  // soft shadow under the craft for depth
  if (opts.shadow !== false) {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(0, span * 0.5, span * 0.9, span * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(8,18,33,0.55)';
  ctx.lineWidth = Math.max(1, span * 0.04);

  // Main wings (swept)
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-span, span * 0.02);
  ctx.lineTo(-span * 0.12, -span * 0.24);
  ctx.lineTo(span * 0.12, -span * 0.24);
  ctx.lineTo(span, span * 0.02);
  ctx.lineTo(span * 0.68, span * 0.18);
  ctx.lineTo(-span * 0.68, span * 0.18);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Horizontal stabilizer (tail)
  ctx.beginPath();
  ctx.moveTo(-span * 0.34, span * 0.34);
  ctx.lineTo(-span * 0.05, span * 0.22);
  ctx.lineTo(span * 0.05, span * 0.22);
  ctx.lineTo(span * 0.34, span * 0.34);
  ctx.lineTo(span * 0.22, span * 0.42);
  ctx.lineTo(-span * 0.22, span * 0.42);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Fuselage
  ctx.beginPath();
  ctx.moveTo(0, -span * 0.52);
  ctx.bezierCurveTo(span * 0.18, -span * 0.4, span * 0.18, span * 0.3, span * 0.08, span * 0.46);
  ctx.lineTo(-span * 0.08, span * 0.46);
  ctx.bezierCurveTo(-span * 0.18, span * 0.3, -span * 0.18, -span * 0.4, 0, -span * 0.52);
  ctx.closePath();
  ctx.fillStyle = body; ctx.fill(); ctx.stroke();

  // Vertical fin
  ctx.beginPath();
  ctx.moveTo(0, span * 0.1);
  ctx.lineTo(span * 0.06, span * 0.44);
  ctx.lineTo(-span * 0.06, span * 0.44);
  ctx.closePath();
  ctx.fillStyle = accent; ctx.fill();

  // Accent stripe + canopy
  ctx.fillStyle = accent;
  ctx.fillRect(-span * 0.05, -span * 0.5, span * 0.1, span * 0.5);
  ctx.fillStyle = 'rgba(10,25,45,0.65)';
  ctx.beginPath();
  ctx.ellipse(0, -span * 0.28, span * 0.07, span * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Small oncoming-traffic glyph.
export function drawTraffic(ctx, px, py, span, color = '#c9d4e0') {
  ctx.save();
  ctx.translate(px, py);
  ctx.fillStyle = color;
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = Math.max(1, span * 0.06);
  ctx.beginPath();
  ctx.moveTo(0, -span * 0.4);
  ctx.lineTo(span, span * 0.1);
  ctx.lineTo(span * 0.2, span * 0.1);
  ctx.lineTo(0, span * 0.4);
  ctx.lineTo(-span * 0.2, span * 0.1);
  ctx.lineTo(-span, span * 0.1);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();
}
