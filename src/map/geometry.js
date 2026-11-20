// Map geometry. Pure functions: no React, no canvas. Angles run clockwise from 12 o'clock.
// Inner ring = vulnerability classes. Beyond it, each weakness is a strip; each dot is one report.

export const R_NODE = 150;
export const R0 = 230;
export const STEP = 3.4;
export const MAX_R = 540;
const TAU = Math.PI * 2;
const CLASS_GAP = 0.018;
const WEAK_GAP = 0.003;

export const classColor = (i, n) => `hsl(${Math.round((i / n) * 330 + 14)}, 58%, 64%)`;

export function computeLayout(data) {
  const n = data.classes.length;
  const classW = data.classes.map((c) => c.weaknesses.reduce((s, w) => s + w.count ** 0.6, 0));
  const total = classW.reduce((s, w) => s + w, 0);
  const free = TAU - CLASS_GAP * n;
  const maxRows = Math.floor((MAX_R - R0) / STEP);

  let a = 0;
  const classes = data.classes.map((c, i) => {
    const span = (classW[i] / total) * free;
    const a0 = a;
    const a1 = a + span;
    a = a1 + CLASS_GAP;

    let wa = a0;
    const weaknesses = c.weaknesses.map((w) => {
      const wspan = (w.count ** 0.6 / classW[i]) * span;
      const s0 = wa + WEAK_GAP / 2;
      const s1 = wa + wspan - WEAK_GAP / 2;
      wa += wspan;
      const width = Math.max(s1 - s0, 0.0005);
      let perRow = Math.max(1, Math.min(w.count, Math.floor((width * R0) / 3.2)));
      if (Math.ceil(w.count / perRow) > maxRows) perRow = Math.ceil(w.count / maxRows);
      return { index: w.index, name: w.name, count: w.count, a0: s0, a1: s1, perRow, rows: Math.ceil(w.count / perRow) };
    });
    return { index: c.index, id: c.id, name: c.name, short: c.short, count: c.count, a0, a1, color: classColor(i, n), weaknesses };
  });
  return { classes };
}

export const toXY = (angle, r) => [Math.sin(angle) * r, -Math.cos(angle) * r];

// World point -> what is under it.
export function hitTest(layout, x, y) {
  const r = Math.hypot(x, y);
  let ang = Math.atan2(x, -y);
  if (ang < 0) ang += TAU;

  if (r >= R_NODE - 20 && r <= R_NODE + 20) {
    const c = layout.classes.find((k) => ang >= k.a0 && ang <= k.a1);
    return c ? { type: 'class', cls: c } : null;
  }
  if (r >= R0 - 4 && r <= MAX_R + 8) {
    for (const c of layout.classes) {
      if (ang < c.a0 || ang > c.a1) continue;
      const w = c.weaknesses.find((k) => ang >= k.a0 && ang <= k.a1);
      if (w && r <= R0 + w.rows * STEP + 6) return { type: 'weakness', cls: c, weakness: w };
    }
  }
  return null;
}
