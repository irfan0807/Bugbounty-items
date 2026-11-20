import { REL_TYPES, VERIFY, ENTITY_TYPES } from '../graph/model.js';

// Bottom panel: relationship type, source, verification, evidence links, last updated.
export default function RelationshipInspector({ edge, nodes }) {
  if (!edge) {
    return (
      <div className="sg-block">
        <h3 className="sg-h">Relationship</h3>
        <p className="muted small-text">Click a line between two nodes to see its type, source and evidence.</p>
      </div>
    );
  }
  const a = nodes.find((n) => n.key === edge.source);
  const b = nodes.find((n) => n.key === edge.target);
  const v = VERIFY[edge.verify];

  return (
    <div className="sg-block" aria-live="polite">
      <h3 className="sg-h">Relationship</h3>
      <p>
        <b style={{ color: a && ENTITY_TYPES[a.type].color }}>{a?.label}</b>
        {' \u2192 '}
        <b style={{ color: b && ENTITY_TYPES[b.type].color }}>{b?.label}</b>
      </p>
      <dl className="sg-dl">
        <div className="sg-row"><dt>Type</dt><dd>{REL_TYPES[edge.rel]}</dd></div>
        <div className="sg-row"><dt>Status</dt><dd><span className={`vtag v-${edge.verify}`}>{v.label}</span> <span className="muted small-text">{v.text}</span></dd></div>
        <div className="sg-row"><dt>Source</dt><dd>{edge.sourceName}</dd></div>
        <div className="sg-row"><dt>Last updated</dt><dd>{edge.updated ? new Date(edge.updated).toLocaleDateString() : 'unknown'}</dd></div>
        {edge.note && <div className="sg-row"><dt>Note</dt><dd>{edge.note}</dd></div>}
        <div className="sg-row">
          <dt>Evidence</dt>
          <dd>
            {edge.evidence.length === 0 && 'none attached'}
            {edge.evidence.map((e) => (
              <a key={e.url} className="sg-ev" href={e.url} target="_blank" rel="noopener noreferrer">{e.label}</a>
            ))}
          </dd>
        </div>
      </dl>
    </div>
  );
}
