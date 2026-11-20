import { ENTITY_TYPES, cweUrl, nvdUrl } from '../graph/model.js';

const Row = ({ k, children }) => (
  <div className="sg-row"><dt>{k}</dt><dd>{children}</dd></div>
);

// Details for the selected node. Only fields that really exist are shown; the rest say "unknown".
export default function EntityDetailsPanel({ node, connected, busy, onExpand, onCollapse, onSelect, onGuide, onOpenReport }) {
  if (!node) {
    return (
      <div className="sg-block">
        <h3 className="sg-h">Entity</h3>
        <p className="muted small-text">Select a node to see its details. Double-click a node, or use Expand, to reveal one more level of connections.</p>
      </div>
    );
  }
  const t = ENTITY_TYPES[node.type];
  const d = node.detail;

  return (
    <div className="sg-block" aria-live="polite">
      <p className="eyebrow" style={{ color: t.color }}>{t.label}</p>
      <h3 className="sg-h">{node.label}</h3>
      {node.sub && <p className="muted small-text">{node.sub}</p>}

      <div className="sg-actions">
        <button type="button" className="btn small primary" disabled={busy} onClick={() => onExpand(node)}>
          {node.expanded ? (node.canMore ? 'Show more' : 'Refresh') : 'Expand'}
        </button>
        {node.expanded && <button type="button" className="btn small ghost" onClick={() => onCollapse(node)}>Collapse</button>}
        {(node.type === 'vuln' || node.type === 'cve' || node.type === 'cwe') && (
          <button type="button" className="btn small ghost" onClick={() => onGuide(node)}>Open learning guide</button>
        )}
        {node.type === 'report' && <button type="button" className="btn small ghost" onClick={() => onOpenReport(node.report)}>Read report</button>}
      </div>

      <dl className="sg-dl">
        {node.type === 'cve' && (
          <>
            <Row k="Description">{d ? d.description : 'Expand to load from NVD.'}</Row>
            <Row k="CVSS">{d ? (d.cvss ? `${d.cvss.score} ${d.cvss.severity || ''} (v${d.cvss.version})` : 'unknown') : 'unknown'}</Row>
            {d?.cvss?.vector && <Row k="Vector"><code>{d.cvss.vector}</code></Row>}
            <Row k="Published">{d ? new Date(d.published).toLocaleDateString() : 'unknown'}</Row>
            <Row k="CISA KEV">{d ? (d.kev ? `Listed since ${d.kev.added}` : 'Not listed') : 'unknown'}</Row>
            <Row k="Source"><a href={nvdUrl(node.id)} target="_blank" rel="noopener noreferrer">NVD record</a></Row>
          </>
        )}
        {node.type === 'cwe' && <Row k="Source"><a href={cweUrl(node.id)} target="_blank" rel="noopener noreferrer">MITRE definition</a></Row>}
        {node.type === 'vuln' && <Row k="Class">{node.className}</Row>}
        {node.type === 'report' && node.report && (
          <>
            <Row k="Program">{node.report.program}</Row>
            <Row k="Weakness">{node.report.weakness}</Row>
            <Row k="Upvotes">{node.report.upvotes.toLocaleString()}</Row>
            <Row k="Bounty">{node.report.bounty ? `$${node.report.bounty.toLocaleString()}` : 'none listed'}</Row>
            <Row k="CVE ids">{d ? (d.cves.length ? d.cves.join(', ') : 'none cited') : 'Expand to check'}</Row>
          </>
        )}
        {node.url && <Row k="Link"><a href={node.url} target="_blank" rel="noopener noreferrer">{node.url.slice(0, 60)}</a></Row>}
        {node.type === 'product' && node.product && (
          <>
            <Row k="Vendor">{node.product.vendor}</Row>
            <Row k="Versions">{node.product.versions.join(', ') || 'unspecified'}</Row>
            {node.product.ranges.length > 0 && <Row k="Ranges">{node.product.ranges.join(' | ')}</Row>}
          </>
        )}
      </dl>

      {connected.length > 0 && (
        <>
          <h4 className="sg-h2">Connected ({connected.length})</h4>
          <ul className="sg-conn">
            {connected.slice(0, 40).map((c) => (
              <li key={c.key}>
                <button type="button" className="sg-pick" onClick={() => onSelect(c.key)}>
                  <span className="chip" style={{ color: ENTITY_TYPES[c.type].color }}>{ENTITY_TYPES[c.type].short}</span>
                  <span className="sg-pick-t">{c.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
