import { useState } from 'react';

export default function ClassMap({ data, onPick }) {
  const [activeIdx, setActiveIdx] = useState(data.classes[0].index);
  const active = data.classes.find((c) => c.index === activeIdx);
  const max = data.classes[0].count;
  const total = data.reports.length;

  return (
    <section className="section" id="map" aria-labelledby="map-title">
      <header className="section-head">
        <p className="eyebrow">SECTOR 01 // THREAT MAP</p>
        <h2 id="map-title">Vulnerability class map</h2>
        <p className="lead">Pick a class on the left. Its weaknesses appear on the right. Bar length shows how many reports it holds.</p>
      </header>

      <div className="map-grid">
        <ul className="panel class-list" aria-label="Vulnerability classes">
          {data.classes.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className={c.index === activeIdx ? 'class-btn active' : 'class-btn'}
                aria-pressed={c.index === activeIdx}
                onClick={() => setActiveIdx(c.index)}
              >
                <span className="class-code">{c.short}</span>
                <span className="class-name">{c.name}</span>
                <span className="bar" aria-hidden="true"><i style={{ width: `${(c.count / max) * 100}%` }} /></span>
                <span className="class-count">{c.count.toLocaleString()}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="panel detail" aria-live="polite">
          <p className="eyebrow">CLASS // {active.short}</p>
          <h3>{active.name}</h3>
          <p className="muted">
            {active.count.toLocaleString()} reports - {((active.count / total) * 100).toFixed(1)}% of the index -{' '}
            {active.weaknesses.length} weaknesses
          </p>

          <ul className="weakness-list">
            {active.weaknesses.slice(0, 8).map((w) => (
              <li key={w.index}>
                <button type="button" className="weak-btn" onClick={() => onPick(active.index, w.index)}>
                  <span className="weak-row">
                    <span>{w.name}</span>
                    <span className="muted">{w.count.toLocaleString()}</span>
                  </span>
                  <span className="bar big" aria-hidden="true"><i style={{ width: `${(w.count / active.weaknesses[0].count) * 100}%` }} /></span>
                </button>
              </li>
            ))}
          </ul>
          {active.weaknesses.length > 8 && (
            <p className="muted small-text">+ {active.weaknesses.length - 8} more weaknesses in this class</p>
          )}

          <button type="button" className="btn primary" onClick={() => onPick(active.index)}>
            View all {active.short} reports
          </button>
        </div>
      </div>
    </section>
  );
}

