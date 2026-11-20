import { useEffect, useMemo, useRef, useState } from 'react';
import { computeLayout, hitTest } from '../map/geometry.js';
import { drawMap } from '../map/draw.js';

const clampK = (k) => Math.min(6, Math.max(0.35, k));

// Full-screen canvas map. Pan = drag, zoom = wheel / pinch buttons, click = select.
// It redraws only when something changes (no continuous animation loop).
export default function MapCanvas({ data, focus, onPick, resetKey }) {
  const ref = useRef(null);
  const layout = useMemo(() => computeLayout(data), [data]);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [hover, setHover] = useState(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const drag = useRef(null);

  useEffect(() => setView({ x: 0, y: 0, k: 1 }), [resetKey]);

  useEffect(() => {
    const el = ref.current;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fit the map to the window the first time we know the size.
  useEffect(() => {
    if (size.w) setView((v) => (v.k === 1 && v.x === 0 && v.y === 0 ? { x: 0, y: 0, k: clampK(Math.min(size.w, size.h) / 1250) } : v));
  }, [size.w > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = ref.current;
    if (!el || !size.w) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    el.width = size.w * dpr;
    el.height = size.h * dpr;
    const cs = getComputedStyle(document.documentElement);
    const colors = { line: cs.getPropertyValue('--line').trim(), ink: cs.getPropertyValue('--ink').trim(), hot: cs.getPropertyValue('--hot').trim() };
    drawMap(el.getContext('2d'), size.w, size.h, dpr, layout, view, focus, hover, colors);
  }, [size, layout, view, focus, hover]);

  const world = (e) => {
    const r = ref.current.getBoundingClientRect();
    const v = viewRef.current;
    return [(e.clientX - r.left - r.width / 2 - v.x) / v.k, (e.clientY - r.top - r.height / 2 - v.y) / v.k];
  };

  useEffect(() => {
    const el = ref.current;
    const onWheel = (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const px = e.clientX - r.left - r.width / 2;
      const py = e.clientY - r.top - r.height / 2;
      setView((v) => {
        const k = clampK(v.k * (e.deltaY < 0 ? 1.12 : 0.89));
        return { k, x: px - ((px - v.x) / v.k) * k, y: py - ((py - v.y) / v.k) * k };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const down = (e) => {
    ref.current.setPointerCapture?.(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, moved: false };
  };
  const move = (e) => {
    const d = drag.current;
    if (d) {
      const dx = e.clientX - d.sx;
      const dy = e.clientY - d.sy;
      if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
      if (d.moved) setView((v) => ({ ...v, x: d.vx + dx, y: d.vy + dy }));
      return;
    }
    const [x, y] = world(e);
    const h = hitTest(layout, x, y);
    setHover((cur) => (cur?.weakness === h?.weakness && cur?.cls === h?.cls && cur?.type === h?.type ? cur : h));
  };
  const up = (e) => {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved) {
      const [x, y] = world(e);
      onPick(hitTest(layout, x, y));
    }
  };

  return (
    <canvas
      ref={ref}
      className="map"
      style={{ cursor: hover ? 'pointer' : undefined }}
      aria-label="Map of disclosed vulnerability reports grouped by class and weakness. Use the Browse page for a list version."
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerLeave={() => { drag.current = null; setHover(null); }}
    />
  );
}
