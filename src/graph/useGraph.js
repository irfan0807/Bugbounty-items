import { useCallback, useMemo, useRef, useState } from 'react';
import { createAdapter } from './adapter.js';

// Graph state: nodes, edges, selection, one-level expand / collapse. No rendering here.
export const MAX_NODES = 220;

export default function useGraph(data) {
  const adapter = useMemo(() => createAdapter(data), [data]);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const pages = useRef(new Map()); // node key -> next page for paged expansion
  const owners = useRef(new Map()); // node key -> Set of node keys that revealed it

  const merge = useCallback((fromKey, add) => {
    setNodes((cur) => {
      const known = new Set(cur.map((n) => n.key));
      const fresh = add.nodes.filter((n) => !known.has(n.key));
      const room = Math.max(0, MAX_NODES - cur.length);
      if (fresh.length > room) setNotice(`Graph limit of ${MAX_NODES} nodes reached. Collapse something to add more.`);
      const keep = fresh.slice(0, room);
      for (const n of [...keep, ...add.nodes.filter((x) => known.has(x.key))]) {
        if (!owners.current.has(n.key)) owners.current.set(n.key, new Set());
        owners.current.get(n.key).add(fromKey);
      }
      return [...cur, ...keep];
    });
    setEdges((cur) => {
      const ids = new Set(cur.map((e) => e.id));
      return [...cur, ...add.edges.filter((e) => !ids.has(e.id))];
    });
  }, []);

  const start = useCallback((n) => {
    pages.current.clear();
    owners.current.clear();
    setNodes([{ ...n, root: true }]);
    setEdges([]);
    setSelected(n.key);
    setSelectedEdge(null);
    setError('');
    setNotice('');
  }, []);

  const expand = useCallback(async (n) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const page = pages.current.get(n.key) || 0;
      const res = await adapter.expand(n, page);
      pages.current.set(n.key, res.more ? page + 1 : -1);
      merge(n.key, res);
      if (!res.nodes.length) setNotice('No documented connections were found for this node.');
      setNodes((cur) => cur.map((x) => (x.key === n.key ? { ...x, detail: n.detail, canMore: res.more, expanded: true } : x)));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }, [adapter, merge]);

  // Removes nodes that only this node revealed; shared nodes stay.
  const collapse = useCallback((n) => {
    const drop = new Set();
    for (const [key, set] of owners.current) {
      set.delete(n.key);
      if (set.size === 0 && key !== n.key) drop.add(key);
    }
    for (const key of drop) owners.current.delete(key);
    pages.current.delete(n.key);
    setNodes((cur) => cur.filter((x) => !drop.has(x.key)).map((x) => (x.key === n.key ? { ...x, expanded: false, canMore: false } : x)));
    setEdges((cur) => cur.filter((e) => !drop.has(e.source) && !drop.has(e.target)));
  }, []);

  const reset = useCallback(() => {
    setNodes([]); setEdges([]); setSelected(null); setSelectedEdge(null); setError(''); setNotice('');
    pages.current.clear(); owners.current.clear();
  }, []);

  return { adapter, nodes, edges, selected, setSelected, selectedEdge, setSelectedEdge, busy, error, notice, start, expand, collapse, reset };
}
