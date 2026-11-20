import { useEffect, useMemo, useRef, useState } from 'react';
import { ENTITY_TYPES } from '../graph/model.js';
import useForceLayout, { W, H } from '../graph/useForceLayout.js';

const short = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}...` : s);

// SVG graph: zoom (wheel), pan (drag background), drag nodes, click to select, double-click to expand.
export default function SecurityGraph({ nodes, edges, selected, selectedEdge, onSelect, onSelectEdge, onExpand, controlRef, motion }) {
  const svgRef = useRef(null);
  const drag = useRef(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const viewRef = useRef(view);
  viewRef.current = view;

  const links = useMemo(() => {
    const keys = new Set(nodes.map((n) => n.key));
    return edges.filter((e) => keys.has(e.source) && keys.has(e.target));
  }, [nodes, edges]);

  const { posRef, simRef } = useForceLayout(nodes, links, motion);

  useEffect(() => {
    if (controlRef) {
      controlRef.current = {
        resetView: () => setView({ x: 0, y: 0, k: 1 }),
        zoom: (f) => setView((v) => ({ ...v, k: Math.min(3, Math.max(0.3, v.k * f)) })),
        svg: () => svgRef.current,
      };
    }
  }, [controlRef]);

  const local = (clientX, clientY) => {
    const r = svgRef.current.getBoundingClientRect();
    return [((clientX - r.left) / r.width) * W, ((clientY - r.top) / r.height) * H];
  };

  // Wheel must be a non-passive listener so the page does not scroll while zooming.
  useEffect(() => {
    const el = svgRef.current;
    const onWheel = (e) => {
      e.preventDefault();
      const [sx, sy] = local(e.clientX, e.clientY);
      const v = viewRef.current;
      const k = Math.min(3, Math.max(0.3, v.k * (e.deltaY < 0 ? 1.12 : 0.89)));
      setView({ k, x: sx - ((sx - v.x) / v.k) * k, y: sy - ((sy - v.y) / v.k) * k });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const down = (e, key) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const [sx, sy] = local(e.clientX, e.clientY);
    drag.current = key
      ? { type: 'node', key, moved: false }
      : { type: 'pan', sx, sy, vx: viewRef.current.x, vy: viewRef.current.y };
  };

  const move = (e) => {
    const d = drag.current;
    if (!d) return;
    const [sx, sy] = local(e.clientX, e.clientY);
    if (d.type === 'node') {
      const v = viewRef.current;
      const p = posRef.current.get(d.key);
      p.fx = (sx - v.x) / v.k;
      p.fy = (sy - v.y) / v.k;
      d.moved = true;
      simRef.current?.alphaTarget(0.25).restart();
    } else {
      setView((v) => ({ ...v, x: d.vx + (sx - d.sx), y: d.vy + (sy - d.sy) }));
    }
  };

  const up = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.type !== 'node') return;
    const p = posRef.current.get(d.key);
    if (p) { p.fx = null; p.fy = null; }
    simRef.current?.alphaTarget(0);
    if (!d.moved) onSelect(d.key);
  };

  const pos = posRef.current;
  return (
    <svg
      ref={svgRef}
      className="sg-svg"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Security graph canvas. The entity list below gives a keyboard-accessible view of the same nodes."
      onPointerDown={(e) => down(e, null)}
      onPointerMove={move}
      onPointerUp={up}
      onPointerLeave={up}
    >
      <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
        {links.map((l) => {
          const a = pos.get(l.source);
          const b = pos.get(l.target);
          if (!a || !b) return null;
          return (
            <g key={l.id} className={`sg-edge v-${l.verify}${selectedEdge === l.id ? ' on' : ''}`}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
              <line className="hit" x1={a.x} y1={a.y} x2={b.x} y2={b.y} onPointerDown={(e) => e.stopPropagation()} onClick={() => onSelectEdge(l.id)} />
            </g>
          );
        })}
        {nodes.map((n) => {
          const p = pos.get(n.key);
          if (!p) return null;
          const t = ENTITY_TYPES[n.type];
          return (
            <g
              key={n.key}
              className={`sg-node${selected === n.key ? ' on' : ''}${n.root ? ' root' : ''}`}
              transform={`translate(${p.x} ${p.y})`}
              onPointerDown={(e) => { e.stopPropagation(); down(e, n.key); }}
              onDoubleClick={() => onExpand(n)}
            >
              <circle r={n.root ? 20 : 14} fill="var(--panel)" stroke={t.color} />
              <circle r={n.root ? 8 : 5} fill={t.color} />
              <text y={n.root ? 36 : 28} textAnchor="middle">{short(n.label, 22)}</text>
              <text y={n.root ? -26 : -20} textAnchor="middle" className="ty" fill={t.color}>{t.short}</text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
