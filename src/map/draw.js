import { R_NODE, R0, R_RING, R_LABEL, toXY } from './geometry.js';

const TAU = Math.PI * 2;

// Draws the whole map on a 2D canvas. `view` = { x, y, k }. `focus` = { classIdx, weaknessIdx } | null.
// Warm grey lines on near-black, with the accent colour only for hover and selection.
export function drawMap(ctx, w, h, dpr, layout, view, focus, hover, colors) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w / 2 + view.x, h / 2 + view.y - 8);
  ctx.scale(view.k, view.k);
  const px = 1 / view.k;

  const dimmed = (c) => focus && focus.classIdx !== c.index;

  // outer thin ring
  ctx.strokeStyle = colors.line;
  ctx.lineWidth = px;
  ctx.beginPath();
  ctx.arc(0, 0, R_RING, 0, TAU);
  ctx.stroke();

  // curves through the middle: classes that share programs; thicker = more shared
  ctx.lineCap = 'round';
  for (const l of layout.links) {
    const focusHit = focus && (focus.classIdx === l.a.index || focus.classIdx === l.b.index);
    const [x1, y1] = toXY(l.a.mid, R_NODE);
    const [x2, y2] = toXY(l.b.mid, R_NODE);
    ctx.globalAlpha = focus ? (focusHit ? 0.8 : 0.04) : 0.05 + 0.16 * (l.count / layout.maxLink);
    ctx.strokeStyle = focusHit ? colors.hot : colors.ink;
    ctx.lineWidth = (0.35 + 1.0 * (l.count / layout.maxLink)) * px;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo((x1 + x2) * 0.12, (y1 + y2) * 0.12, x2, y2);
    ctx.stroke();
  }

  // weakness strips: fine radial lines; length follows how many reports each line stands for
  for (const c of layout.classes) {
    const dim = dimmed(c);
    for (const wk of c.weaknesses) {
      const picked = focus && focus.classIdx === c.index && focus.weaknessIdx === wk.index;
      const faded = dim || (focus && focus.weaknessIdx != null && focus.weaknessIdx !== -1 && !picked && focus.classIdx === c.index);
      const hot = picked || hover?.weakness === wk;
      ctx.globalAlpha = faded ? 0.1 : hot ? 1 : 0.3;
      ctx.strokeStyle = hot ? colors.hot : colors.ink;
      ctx.lineWidth = 0.8 * px;
      ctx.beginPath();
      const span = wk.a1 - wk.a0;
      for (let i = 0; i < wk.lines; i++) {
        const ang = wk.a0 + ((i + 0.5) / wk.lines) * span;
        const s = Math.sin(ang);
        const co = -Math.cos(ang);
        ctx.moveTo(s * R0, co * R0);
        ctx.lineTo(s * (R0 + wk.len), co * (R0 + wk.len));
      }
      ctx.stroke();
    }
  }

  // class nodes on the inner ring
  for (const c of layout.classes) {
    const hot = hover?.cls === c && hover.type === 'class';
    const on = focus && focus.classIdx === c.index;
    const [nx, ny] = toXY(c.mid, R_NODE);
    ctx.globalAlpha = dimmed(c) ? 0.25 : 1;
    ctx.fillStyle = colors.bg;
    ctx.strokeStyle = hot || on ? colors.hot : colors.ink;
    ctx.lineWidth = 1.2 * px;
    ctx.beginPath();
    ctx.arc(nx, ny, 7, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = hot || on ? colors.hot : colors.ink;
    ctx.beginPath();
    ctx.arc(nx, ny, 2, 0, TAU);
    ctx.fill();
  }

  // labels outside the ring, decluttered the way the reference does it: biggest classes win,
  // and a label is dropped when it would collide with one already placed.
  const small = view.k < 0.6;
  const fam = "'Recursive Variable', system-ui, sans-serif";
  ctx.textBaseline = 'alphabetic';
  const limit = w / 2 / view.k - 10;
  const placed = [];
  const overlaps = (b) => placed.some((p) => b.x0 < p.x1 + 4 && b.x1 > p.x0 - 4 && b.y0 < p.y1 + 3 && b.y1 > p.y0 - 3);

  [...layout.classes].sort((a, b) => b.count - a.count).forEach((c) => {
    const [lx, ly] = toXY(c.mid, R_LABEL);
    ctx.font = `500 ${small ? 12 : 11}px ${fam}`;
    const tw = ctx.measureText(c.name).width;
    const lx2 = Math.max(-limit + tw, Math.min(limit - tw, lx));
    let align = lx2 > 6 ? 'left' : lx2 < -6 ? 'right' : 'center';
    const forced = focus && focus.classIdx === c.index;
    const hot = hover?.cls === c && hover.type === 'class';
    const box = align === 'left'
      ? { x0: lx2, x1: lx2 + tw, y0: ly - 10, y1: ly + 12 }
      : align === 'right'
        ? { x0: lx2 - tw, x1: lx2, y0: ly - 10, y1: ly + 12 }
        : { x0: lx2 - tw / 2, x1: lx2 + tw / 2, y0: ly - 10, y1: ly + 12 };
    if (!forced && !hot && overlaps(box)) return;
    placed.push(box);

    // leader line from the class node out to its label
    const [nx, ny] = toXY(c.mid, R_NODE + 12);
    const [ex, ey] = toXY(c.mid, R_LABEL - 6);
    ctx.globalAlpha = dimmed(c) ? 0.2 : 0.5;
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 0.8 * px;
    ctx.beginPath();
    ctx.moveTo(nx, ny);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    ctx.textAlign = align;
    ctx.globalAlpha = dimmed(c) ? 0.25 : 1;
    ctx.fillStyle = hot || forced ? colors.hot : colors.faint;
    ctx.fillText(c.name, lx2, ly);
    ctx.fillStyle = colors.faint;
    ctx.globalAlpha *= 0.8;
    ctx.font = `400 ${small ? 10 : 9}px ${fam}`;
    ctx.fillText(`${c.count.toLocaleString('en-US')} reports`, lx2, ly + 12);
  });
  ctx.restore();
}
