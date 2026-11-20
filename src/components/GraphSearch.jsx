import { useState } from 'react';
import { ENTITY_TYPES } from '../graph/model.js';

// Searches CVE ids, CWE ids, weakness names and report ids/titles through the graph adapter.
export default function GraphSearch({ adapter, onPick }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);

  const run = (e) => {
    e.preventDefault();
    setResults(adapter.search(q));
  };

  return (
    <div className="sg-block">
      <form role="search" onSubmit={run} className="sg-search">
        <label className="field">
          <span>Search the graph</span>
          <input type="search" value={q} placeholder="CVE-2021-44228, CWE-79, SSRF, 2000000" onChange={(e) => setQ(e.target.value)} />
        </label>
        <button type="submit" className="btn small primary">Search</button>
      </form>

      {results && (
        <ul className="sg-results" aria-label="Search results" role="status">
          {results.length === 0 && <li className="muted small-text">No match. Try a CVE id, CWE id, weakness name or report id.</li>}
          {results.map((n) => (
            <li key={n.key}>
              <button type="button" className="sg-pick" onClick={() => onPick(n)}>
                <span className="chip" style={{ color: ENTITY_TYPES[n.type].color }}>{ENTITY_TYPES[n.type].short}</span>
                <span className="sg-pick-t">{n.label}</span>
                <span className="muted small-text">{n.sub}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
