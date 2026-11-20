Change import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useGraph from '../graph/useGraph.js';
import SecurityGraph from './SecurityGraph.jsx';
import GraphSearch from './GraphSearch.jsx';
import GraphFilters from './GraphFilters.jsx';
import GraphToolbar from './GraphToolbar.jsx';
import EntityDetailsPanel from './EntityDetailsPanel.jsx';
import RelationshipInspector from './RelationshipInspector.jsx';
import ReportModal from './ReportModal.jsx';

const NO_FILTERS = () => ({ types: new Set(), rels: new Set(), verify: new Set() });

// Investigation workspace. Entry points: the search box, or a link like #/security-graph?q=CVE-2021-44228
export default function SecurityGraphPage({ data, motion, query, onGuide }) {
  const g = useGraph(data);
  const [filters, setFilters] = useState(NO_FILTERS);
  const [full, setFull] = useState(false);
  const [report, setReport] = useState(null);
  const [copied, setCopied] = useState('');
  const controlRef = useRef(null);
  const wrapRef = useRef(null);
  const { adapter, start, expand } = g;

  // Picking a result makes it the central node and loads its first level of connections.
  const begin = useCallback((n) => {
    start(n);
    expand({ ...n });
  }, [start, expand]);

  useEffect(() => {
    if (!query) return;
    const first = adapter.search(query)[0];
    if (first) begin(first);
  }, [query, adapter]); // eslint-disable-line react-hooks/exhaustive-deps

  const nodes = useMemo(() => g.nodes.filter((n) => n.root || !filters.types.has(n.type)), [g.nodes, filters.types]);
  const edges = useMemo(
    () => g.edges.filter((e) => !filters.rels.has(e.rel) && !filters.verify.has(e.verify)),
    [g.edges, filters.rels, filters.verify]
  );
  const present = useMemo(() => {
    const s = new Set();
    g.nodes.forEach((n) => s.add(`types:${n.type}`));
    g.edges.forEach((e) => { s.add(`rels:${e.rel}`); s.add(`verify:${e.verify}`); });
    return s;
  }, [g.nodes, g.edges]);

  const sel = g.nodes.find((n) => n.key === g.selected) || null;
  const selEdge = g.edges.find((e) => e.id === g.selectedEdge) || null;
  const connected = useMemo(() => {
    if (!sel) return [];
    const keys = new Set();
    for (const e of g.edges) {
      if (e.source === sel.key) keys.add(e.target);
      if (e.target === sel.key) keys.add(e.source);
    }
    return g.nodes.filter((n) => keys.has(n.key));
  }, [sel, g.nodes, g.edges]);

  useEffect(() => {
    const onFs = () => setFull(document.fullscreenElement === wrapRef.current);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else wrapRef.current?.requestFullscreen?.();
  };
  const copy = async (text, label) => {
    try { await navigator.clipboard.writeText(text); setCopied(label); } catch { setCopied('Copy failed'); }
    setTimeout(() => setCopied(''), 1800);
  };

  return (
    <section className="sg" id="security-graph" aria-labelledby="sg-title" ref={wrapRef}>
      <header className="sg-head">
        <div>
          <p className="eyebrow">SECURITY GRAPH</p>
          <h1 id="sg-title" className="sg-title">Investigation workspace</h1>
        </div>
        <GraphToolbar g={g} sel={sel} full={full} onFull={toggleFull} controlRef={controlRef} copied={copied} onCopy={copy} />
      </header>

      <div className="sg-grid">
        <aside className="glass sg-left" aria-label="Search and filters">
          <GraphSearch adapter={adapter} onPick={begin} />
          <GraphFilters filters={filters} setFilters={setFilters} present={present} />
        </aside>

        <div className="glass sg-center">
          {!g.nodes.length && (
            <div className="sg-empty">
              <p>Start with a CVE (CVE-2021-44228), a CWE (CWE-89), a weakness (SSRF) or a report id.</p>
              <p className="muted small-text">Double-click a node to reveal one more level of documented connections.</p>
            </div>
          )}
          {g.busy && <div className="sg-busy" role="status">Loading connections...</div>}
          {g.error && <div className="rm-error sg-msg" role="alert">{g.error}</div>}
          {g.notice && <div className="sg-msg muted small-text" role="status">{g.notice}</div>}
          <SecurityGraph
            nodes={nodes} edges={edges} selected={g.selected} selectedEdge={g.selectedEdge}
            onSelect={(k) => { g.setSelected(k); g.setSelectedEdge(null); }}
            onSelectEdge={g.setSelectedEdge}
            onExpand={g.expand} controlRef={controlRef} motion={motion}
          />
        </div>

        <aside className="glass sg-right" aria-label="Entity details">
          <EntityDetailsPanel
            node={sel} connected={connected} busy={g.busy}
            onExpand={g.expand} onCollapse={g.collapse} onSelect={g.setSelected}
            onGuide={onGuide} onOpenReport={setReport}
          />
        </aside>
      </div>

      <div className="glass sg-bottom"><RelationshipInspector edge={selEdge} nodes={g.nodes} /></div>

      <details className="glass sg-list">
        <summary>Entity list (keyboard accessible, {nodes.length})</summary>
        <ul>
          {nodes.map((n) => (
            <li key={n.key}>
              <button type="button" className="sg-pick" onClick={() => g.setSelected(n.key)}>{n.type.toUpperCase()} - {n.label}</button>
            </li>
          ))}
        </ul>
      </details>

      {report && <ReportModal report={report} onClose={() => setReport(null)} />}
    </section>
  );
}
