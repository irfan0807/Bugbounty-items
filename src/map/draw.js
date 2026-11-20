import { R_NODE, R0, STEP, toXY } from './geometry.js';

// Draws the whole map onto a 2D canvas. `view` = { x, y, k } (pan + zoom), `focus` = { classIdx, weaknessIdx } or null.
export function drawMap(ctx, w, h, dpr, layout, view, focus, hover, colors) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w / 2 + view.x, h / 2 + view.y);
  ctx.scale(view.k, view.k);

  // faint guide rings
  ctx.lineWidth = 1 / view.k;
  ctx.strokeStyle = colors.line;
  for (const r of [R_NODE, R0 - 8]) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (const c of layout.classes) {
    const dimClass = focus && focus.classIdx !== c.index;
    ctx.globalAlpha = dimClass ? 0.18 : 1;

    // class node on the inner ring
    const mid = (c.a0 + c.a1) / 2;
    const [nx, ny] = toXY(mid, R_NODE);
    ctx.strokeStyle = c.color;
    ctx.lineWidth = 3 / view.k;
    ctx.beginPath();
    ctx.arc(0, 0, R_NODE, c.a0 - Math.PI / 2, c.a1 - Math.PI / 2);
    ctx.stroke();
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.arc(nx, ny, hover?.cls === c && hover.type === 'class' ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();

    // weakness strips: one dot per report, laid out in rows moving outward
    for (const w2 of c.weaknesses) {
      const dimWeak = focus && focus.weaknessIdx != null && focus.weaknessIdx !== w2.index;
      ctx.globalAlpha = dimClass ? 0.14 : dimWeak ? 0.22 : 1;
      const isHover = hover?.weakness === w2;
      ctx.fillStyle = isHover ? colors.hot : c.color;
      const span = w2.a1 - w2.a0;
      const dot = Math.max(0.9, Math.min(1.6, 1.3 / Math.sqrt(view.k) + 0.2));
      let placed = 0;
      for (let row = 0; row < w2.rows && placed < w2.count; row++) {
        const r = R0 + row * STEP;
        for (let i = 0; i < w2.perRow && placed < w2.count; i++, placed++) {
          const ang = w2.a0 + ((i + 0.5) / w2.perRow) * span;
          ctx.fillRect(Math.sin(ang) * r - dot / 2, -Math.cos(ang) * r - dot / 2, dot, dot);
        }
      }
    }
  }
  ctx.globalAlpha = 1;

  // class labels outside the node ring
  if (view.k > 0.55) {
    ctx.font = `${11 / Math.min(view.k, 1.4)}px 'Recursive Variable', system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const c of layout.classes) {
      if (focus && focus.classIdx !== c.index) continue;
      const [lx, ly] = toXY((c.a0 + c.a1) / 2, R_NODE - 22);
      ctx.fillStyle = colors.ink;
      ctx.fillText(c.short, lx, ly);
    }
  }
  ctx.restore();
}
