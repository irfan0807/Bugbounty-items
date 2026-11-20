import { exportCsv, exportPng, exportSvg, investigationSummary } from '../graph/exporters.js';

// Zoom, view, full screen, reset and export controls for the graph workspace.
export default function GraphToolbar({ g, sel, full, onFull, controlRef, copied, onCopy }) {
  const svg = () => controlRef.current?.svg();
  const has = g.nodes.length > 0;

  return (
    <div className="sg-tools" role="toolbar" aria-label="Graph tools">
      <button type="button" className="btn small ghost" onClick={() => controlRef.current?.zoom(1.25)} aria-label="Zoom in">+</button>
      <button type="button" className="btn small ghost" onClick={() => controlRef.current?.zoom(0.8)} aria-label="Zoom out">&minus;</button>
      <button type="button" className="btn small ghost" onClick={() => controlRef.current?.resetView()}>Fit view</button>
      <button type="button" className="btn small ghost" onClick={onFull}>{full ? 'Exit full screen' : 'Full screen'}</button>
      <button type="button" className="btn small ghost" onClick={g.reset}>Reset graph</button>
      <button type="button" className="btn small ghost" disabled={!has} onClick={() => exportPng(svg())}>PNG</button>
      <button type="button" className="btn small ghost" disabled={!has} onClick={() => exportSvg(svg())}>SVG</button>
      <button type="button" className="btn small ghost" disabled={!g.edges.length} onClick={() => exportCsv(g.nodes, g.edges)}>CSV</button>
      <button type="button" className="btn small ghost" disabled={!has} onClick={() => onCopy(investigationSummary(g.nodes, g.edges), 'Summary copied')}>Copy summary</button>
      {sel && <button type="button" className="btn small ghost" onClick={() => onCopy(sel.key, 'Reference copied')}>Copy reference</button>}
      <span className="sg-copied" role="status">{copied}</span>
    </div>
  );
}
