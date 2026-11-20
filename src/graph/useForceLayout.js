import { useEffect, useRef, useState } from 'react';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';

export const W = 1000;
export const H = 640;

// Force layout for the graph. Existing positions are kept when the node set changes, and the
// simulation stops by itself once it settles, so nothing renders continuously.
export default function useForceLayout(nodes, links, motion) {
  const simRef = useRef(null);
  const posRef = useRef(new Map());
  const raf = useRef(0);
  const [, setTick] = useState(0);

  useEffect(() => {
    const pos = posRef.current;
    const keys = new Set(nodes.map((n) => n.key));
    for (const k of [...pos.keys()]) if (!keys.has(k)) pos.delete(k);

    const items = nodes.map((n) => {
      let p = pos.get(n.key);
      if (!p) {
        const link = links.find((l) => l.source === n.key || l.target === n.key);
        const otherKey = link ? (link.source === n.key ? link.target : link.source) : null;
        const anchor = otherKey ? pos.get(otherKey) : null;
        p = {
          key: n.key,
          x: (anchor?.x ?? W / 2) + (Math.random() - 0.5) * 60,
          y: (anchor?.y ?? H / 2) + (Math.random() - 0.5) * 60,
        };
        pos.set(n.key, p);
      }
      return p;
    });
    const sl = links.map((l) => ({ source: l.source, target: l.target }));

    simRef.current?.stop();
    const sim = forceSimulation(items)
      .force('link', forceLink(sl).id((d) => d.key).distance(95).strength(0.7))
      .force('charge', forceManyBody().strength(-260))
      .force('center', forceCenter(W / 2, H / 2).strength(0.05))
      .force('collide', forceCollide(34))
      .alpha(motion ? 0.9 : 1)
      .alphaDecay(motion ? 0.04 : 0.3);

    sim.on('tick', () => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => setTick((t) => t + 1));
    });
    simRef.current = sim;

    return () => {
      sim.stop();
      cancelAnimationFrame(raf.current);
    };
  }, [nodes, links, motion]);

  return { posRef, simRef };
}
