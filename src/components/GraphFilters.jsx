import { ENTITY_TYPES, REL_TYPES, VERIFY, UNSUPPORTED_TYPES } from '../graph/model.js';

// Legend doubles as the filter set: entity types, relationship types and verification level.
export default function GraphFilters({ filters, setFilters, present }) {
  const toggle = (group, key) =>
    setFilters((f) => {
      const next = new Set(f[group]);
      if (next.has(key)) next.delete(key); else next.add(key);
      return { ...f, [group]: next };
    });

  const Group = ({ title, group, items, color }) => (
    <fieldset className="sg-fs">
      <legend>{title}</legend>
      {items.map(([key, label]) => (
        <label key={key} className={`sg-check${present.has(`${group}:${key}`) ? '' : ' dim'}`}>
          <input type="checkbox" checked={!filters[group].has(key)} onChange={() => toggle(group, key)} />
          {color && <i className="sg-dot" style={{ background: color(key) }} aria-hidden="true" />}
          <span>{label}</span>
        </label>
      ))}
    </fieldset>
  );

  return (
    <div className="sg-block">
      <Group title="Entity types" group="types" items={Object.entries(ENTITY_TYPES).map(([k, v]) => [k, v.label])} color={(k) => ENTITY_TYPES[k].color} />
      <Group title="Relationships" group="rels" items={Object.entries(REL_TYPES)} />
      <Group title="Verification" group="verify" items={Object.entries(VERIFY).map(([k, v]) => [k, v.label])} />
      <details className="sg-fs">
        <summary>Not available yet ({UNSUPPORTED_TYPES.length})</summary>
        <p className="muted small-text">
          No reliable data source is connected for: {UNSUPPORTED_TYPES.join(', ')}. They are not shown rather than invented.
        </p>
      </details>
    </div>
  );
}
