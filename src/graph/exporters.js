import { REL_TYPES, VERIFY } from './model.js';

function download(name, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

// Relationship CSV keeps provenance: source, verification status, evidence urls, last updated.
export function exportCsv(nodes, edges) {
  const label = new Map(nodes.map((n) => [n.key, n.label]));
  const head = ['source_node', 'relationship', 'target_node', 'verification', 'source', 'evidence_urls', 'last_updated', 'note'];
  const rows = edges.map((e) => [
    label.get(e.source), REL_TYPES[e.rel], label.get(e.target), VERIFY[e.verify].label,
    e.sourceName, e.evidence.map((x) => x.url).join(' '), e.updated || '', e.note || '',
  ]);
  const text = [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
  download('hexbrain-graph-relationships.csv', new Blob([text], { type: 'text/csv' }));
}

function svgMarkup(svg) {
  const clone = svg.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const cs = getComputedStyle(document.documentElement);
  const get = (v) => cs.getPropertyValue(v).trim();
  const bg = get('--bg') || '#05080f';
  const text = get('--text') || '#eaf7ff';
  const panel = get('--panel') || '#0c1524';
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = `text{fill:${text};font:11px sans-serif}.ty{font:700 9px monospace}line{stroke:${get('--cyan') || '#00e5ff'};stroke-opacity:.55;stroke-width:1.4}.hit{display:none}.v-inferred line{stroke-dasharray:5 4}.v-unverified line{stroke-dasharray:2 4}`;
  clone.insertBefore(style, clone.firstChild);
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('width', '1000');
  rect.setAttribute('height', '640');
  rect.setAttribute('fill', bg);
  clone.insertBefore(rect, style.nextSibling);
  let s = new XMLSerializer().serializeToString(clone);
  s = s.replace(/var\(--panel\)/g, panel);
  return s;
}

export function exportSvg(svg) {
  download('hexbrain-graph.svg', new Blob([svgMarkup(svg)], { type: 'image/svg+xml' }));
}

export function exportPng(svg) {
  const url = URL.createObjectURL(new Blob([svgMarkup(svg)], { type: 'image/svg+xml' }));
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = 2000;
    c.height = 1280;
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    c.toBlob((b) => b && download('hexbrain-graph.png', b));
  };
  img.src = url;
}

// Plain-text summary with every claim labelled by its verification status.
export function investigationSummary(nodes, edges) {
  const label = new Map(nodes.map((n) => [n.key, n.label]));
  const root = nodes.find((n) => n.root);
  const lines = [`HexBrain investigation: ${root ? root.label : 'untitled'}`, `${nodes.length} entities, ${edges.length} relationships`, ''];
  for (const e of edges) {
    lines.push(`[${VERIFY[e.verify].label}] ${label.get(e.source)} -> ${REL_TYPES[e.rel]} -> ${label.get(e.target)} (source: ${e.sourceName})`);
  }
  return lines.join('\n');
}
