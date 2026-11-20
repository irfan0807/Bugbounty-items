// Relationship adapter. Turns existing HexBrain data (+ NVD via /api/cve) into graph nodes and edges.
// It never touches the data layer's shape.
import { cweForWeakness, cweUrl, nvdUrl, nodeKey } from './model.js';
import { node, edge, getJson } from './helpers.js';
import { expandCve, expandReport } from './expanders.js';

const HACKERONE = 'HackerOne disclosed reports dataset';
const PER_PAGE = 8;
const NAME_MAP_NOTE = 'Matched by weakness name, not by a record that links them.';

export function createAdapter(data) {
  const weaknesses = new Map();
  for (const c of data.classes) for (const w of c.weaknesses) weaknesses.set(w.index, { ...w, className: c.name });

  const byWeakness = new Map();
  for (const r of data.reports) {
    if (!byWeakness.has(r.weaknessIdx)) byWeakness.set(r.weaknessIdx, []);
    byWeakness.get(r.weaknessIdx).push(r);
  }
  for (const list of byWeakness.values()) list.sort((a, b) => b.upvotes - a.upvotes);
  const reportById = new Map(data.reports.map((r) => [r.id, r]));

  const vulnNode = (idx) => {
    const w = weaknesses.get(idx);
    return node('vuln', idx, w.name, `${w.count.toLocaleString()} reports`, { weaknessIdx: idx, className: w.className });
  };
  const reportNode = (r) => node('report', r.id, r.title, r.program, { report: r });
  const mapEdge = (vulnKey, cwe) =>
    edge(vulnKey, nodeKey('cwe', cwe), 'weakness', 'inferred', 'HexBrain name mapping', [{ label: `MITRE ${cwe}`, url: cweUrl(cwe) }], { note: NAME_MAP_NOTE });

  // Search only what exists: CVE ids, CWE ids, weakness names, report ids and titles.
  function search(q) {
    const s = q.trim();
    if (!s) return [];
    const out = [];
    const cve = /^cve-\d{4}-\d{4,7}$/i.exec(s);
    const cwe = /^cwe-?(\d{1,5})$/i.exec(s);
    if (cve) out.push(node('cve', s.toUpperCase(), s.toUpperCase(), 'Look up in NVD'));
    if (cwe) out.push(node('cwe', `CWE-${cwe[1]}`, `CWE-${cwe[1]}`, 'Weakness'));
    if (/^\d{3,9}$/.test(s) && reportById.has(Number(s))) out.push(reportNode(reportById.get(Number(s))));
    if (!cve && !cwe) {
      const low = s.toLowerCase();
      for (const idx of weaknesses.keys()) {
        if (weaknesses.get(idx).name.toLowerCase().includes(low)) out.push(vulnNode(idx));
        if (out.length >= 8) break;
      }
      let n = 0;
      for (const r of data.reports) {
        if (r.search.includes(low)) { out.push(reportNode(r)); if (++n >= 6) break; }
      }
    }
    return out.slice(0, 14);
  }

  // One relationship level around a node. `page` lets a vulnerability reveal more reports.
  async function expand(n, page = 0) {
    if (n.type === 'cve') return expandCve(n);
    if (n.type === 'report') return expandReport(n);

    const nodes = [];
    const edges = [];
    let more = false;

    if (n.type === 'vuln') {
      const cwe = cweForWeakness(n.label);
      if (cwe && page === 0) {
        nodes.push(node('cwe', cwe, cwe, 'Weakness'));
        edges.push(mapEdge(n.key, cwe));
      }
      const list = byWeakness.get(n.weaknessIdx) || [];
      for (const r of list.slice(page * PER_PAGE, (page + 1) * PER_PAGE)) {
        nodes.push(reportNode(r));
        edges.push(edge(nodeKey('report', r.id), n.key, 'demonstrates', 'verified', HACKERONE,
          [{ label: `HackerOne #${r.id}`, url: `https://hackerone.com/reports/${r.id}` }]));
      }
      more = list.length > (page + 1) * PER_PAGE;
    } else if (n.type === 'cwe') {
      for (const idx of weaknesses.keys()) {
        if (cweForWeakness(weaknesses.get(idx).name) === n.id) {
          nodes.push(vulnNode(idx));
          edges.push(mapEdge(nodeKey('vuln', idx), n.id));
        }
      }
      try {
        const res = await getJson(`/api/cwe/${n.id}/cves`);
        for (const c of res.cves) {
          nodes.push(node('cve', c.id, c.id, c.cvss ? `CVSS ${c.cvss.score}` : 'CVSS n/a', { severity: c.cvss?.severity }));
          edges.push(edge(nodeKey('cve', c.id), n.key, 'classified', 'verified', 'NIST NVD',
            [{ label: `NVD ${c.id}`, url: nvdUrl(c.id) }]));
        }
      } catch (e) {
        if (!nodes.length) throw e; // keep local results if NVD is unreachable
      }
    }
    return { nodes, edges, more };
  }

  return { search, expand, vulnNode, reportNode, weaknesses, reportById };
}
