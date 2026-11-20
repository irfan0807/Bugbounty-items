// Map geometry. Pure functions: no React, no canvas. Angles run clockwise from 12 o'clock.
// Class nodes sit on an inner ring. Each weakness is a strip of fine radial lines beyond it.
// Curves through the middle join classes that share programs (computed from the real reports).

export const R_NODE = 105;
export const R0 = 150;
export const MAX_LEN = 92;
export const R_RING = 292;
export const R_LABEL = 322;
const TAU = Math.PI * 2;
const CLASS_GAP = 0.05;
const WEAK_GAP = 0.004;

export function computeLayout(data) {
  const n = data.classes.length;
  const weights = data.classes.map((c) => c.count ** 0.55);
  const total = weights.reduce((s, w) => s + w, 0);
  const free = TAU - CLASS_GAP * n;

  let a = CLASS_GAP / 2;
  const byIndex = new Map();
  const classes = data.classes.map((c, i) => {
    const span = (weights[i] / total) * free;
    const a0 = a;
    const a1 = a + span;
    a = a1 + CLASS_GAP;

    const wTotal = c.weaknesses.reduce((s, w) => s + w.count ** 0.6, 0);
    let wa = a0;
    const weaknesses = c.weaknesses.map((w) => {
      const wspan = ((w.count ** 0.6) / wTotal) * span;
      const s0 = wa + WEAK_GAP / 2;
      const s1 = Math.max(s0 + 0.0008, wa + wspan - WEAK_GAP / 2);
      wa += wspan;
      const lines = Math.max(1, Math.min(90, Math.floor(((s1 - s0) * R0) / 1.5)));
      const len = Math.min(MAX_LEN, 5 + (w.count / lines) * 1.5);
      return { index: w.index, name: w.name, count: w.count, a0: s0, a1: s1, lines, len };
    });
    const k = { index: c.index, id: c.id, name: c.name, short: c.short, count: c.count, a0, a1, mid: (a0 + a1) / 2, weaknesses };
    byIndex.set(c.index, k);
    return k;
  });

  // Shared programs between class pairs (real data). Used only to draw the middle curves.
  const perProgram = new Map();
  for (const r of data.reports) {
    if (!perProgram.has(r.programIdx)) perProgram.set(r.programIdx, new Set());
    perProgram.get(r.programIdx).add(r.classIdx);
  }
  const pairs = new Map();
  for (const set of perProgram.values()) {
    const list = [...set];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const key = list[i] < list[j] ? `${list[i]}|${list[j]}` : `${list[j]}|${list[i]}`;
        pairs.set(key, (pairs.get(key) || 0) + 1);
      }
    }
  }
  const links = [...pairs.entries()]
    .map(([key, count]) => { const [x, y] = key.split('|').map(Number); return { a: byIndex.get(x), b: byIndex.get(y), count }; })
    .filter((l) => l.a && l.b)
    .sort((p, q) => q.count - p.count)
    .slice(0, 60);

  return { classes, links, maxLink: links[0]?.count || 1 };

  // Deterministic scatter used for the small report dots inside the ring.
}


export const toXY = (angle, r) => [Math.sin(angle) * r, -Math.cos(angle) * r];

// World point -> what is under it.
export function hitTest(layout, x, y) {
  const r = Math.hypot(x, y);
  let ang = Math.atan2(x, -y);
  if (ang < 0) ang += TAU;
  const cls = layout.classes.find((k) => ang >= k.a0 - CLASS_GAP / 2 && ang <= k.a1 + CLASS_GAP / 2);
  if (!cls) return null;

  if (r >= R0 - 6 && r <= R0 + MAX_LEN + 6) {
    const w = cls.weaknesses.find((k) => ang >= k.a0 && ang <= k.a1);
    if (w && r <= R0 + w.len + 6) return { type: 'weakness', cls, weakness: w };
  }
  if (r < R0 - 6 && r > R_NODE - 30) return { type: 'class', cls };
  if (r >= R_RING - 10 && r <= R_LABEL + 80) return { type: 'class', cls };
  return null;
}
