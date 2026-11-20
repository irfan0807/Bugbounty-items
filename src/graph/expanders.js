// Expanders for nodes that need an external lookup (CVE via NVD, report via the scraper).
import { cweUrl, nodeKey } from './model.js';
import { node, edge, getJson } from './helpers.js';

export async function expandCve(n) {
  const nodes = [];
  const edges = [];
  const c = await getJson(`/api/cve/${n.id}`);
  n.detail = c;

  for (const w of c.cwes) {
    nodes.push(node('cwe', w.id, w.id, 'Weakness'));
    edges.push(edge(n.key, nodeKey('cwe', w.id), 'classified', 'verified',
      `NIST NVD (${[...new Set(w.sources.map((s) => s.source))].join(', ')})`,
      [{ label: `NVD ${c.id}`, url: c.evidenceUrl }, { label: `MITRE ${w.id}`, url: cweUrl(w.id) }],
      { updated: c.modified }));
  }

  for (const p of c.products) {
    const id = `${p.vendor}:${p.product}`;
    const sub = [...p.versions.slice(0, 2), ...p.ranges.slice(0, 1)].join(', ') || 'versions unspecified';
    nodes.push(node('product', id, `${p.vendor} ${p.product}`, sub, { product: p }));
    edges.push(edge(n.key, nodeKey('product', id), 'affects', 'verified', 'NIST NVD CPE configuration',
      [{ label: `NVD ${c.id}`, url: c.evidenceUrl }], { updated: c.modified }));
  }

  const mitUrls = new Set(c.mitigations.map((m) => m.url));
  const kinds = [
    ['exploit', 'exploit', c.exploits],
    ['advisory', 'advisory', c.advisories.filter((a) => !mitUrls.has(a.url))],
    ['mitigation', 'mitigation', c.mitigations],
  ];
  const seen = new Set();
  for (const [type, rel, list] of kinds) {
    for (const r of list.slice(0, 6)) {
      const key = `${type}:${r.url}`;
      if (seen.has(key)) continue;
      seen.add(key);
      let host = r.url;
      try { host = new URL(r.url).hostname.replace(/^www\./, ''); } catch { /* keep raw url */ }
      nodes.push(node(type, r.url, host, r.tags.join(' / ') || 'reference', { url: r.url }));
      edges.push(edge(n.key, nodeKey(type, r.url), rel, 'reported', `NVD reference (added by ${r.source})`,
        [{ label: host, url: r.url }], { updated: c.modified }));
    }
  }
  return { nodes, edges, more: false };
}

// Only links a report to a CVE when HackerOne itself lists that CVE id on the report.
export async function expandReport(n) {
  const nodes = [];
  const edges = [];
  const j = await getJson(`/api/report/${n.id}`);
  n.detail = j;
  for (const id of j.cves) {
    nodes.push(node('cve', id, id, 'Cited by report'));
    edges.push(edge(n.key, nodeKey('cve', id), 'reportCve', 'reported', 'HackerOne report metadata (cve_ids)',
      [{ label: `HackerOne #${n.id}`, url: `https://hackerone.com/reports/${n.id}` }]));
  }
  return { nodes, edges, more: false };
}
