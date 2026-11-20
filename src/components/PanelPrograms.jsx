import { useMemo, useState } from 'react';

// Program index: an A-Z key, then a strip per program with its report count and total bounty.
export default function PanelPrograms({ data, onPick }) {
  const [letter, setLetter] = useState('');
  const [q, setQ] = useState('');

  const letters = useMemo(() => [...new Set(data.programs.map((p) => p.name[0].toUpperCase()))].sort(), [data]);
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data.programs
      .filter((p) => (!letter || p.name[0].toUpperCase() === letter) && (!needle || p.name.toLowerCase().includes(needle)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data, letter, q]);
  const max = data.programs[0].count;

  return (
    <>
      <p className="tag">INDEX / PROGRAMS</p>
      <h2>{data.programs.length} programs</h2>
      <p className="dim lede">Choose a program to read everything reported to it.</p>
      <input className="field" type="search" placeholder="Find a program" aria-label="Find a program" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="alpha" role="group" aria-label="Filter by first letter">
        <button type="button" aria-pressed={!letter} onClick={() => setLetter('')}>All</button>
        {letters.map((l) => (
          <button key={l} type="button" aria-pressed={letter === l} onClick={() => setLetter(l)}>{l}</button>
        ))}
      </div>
      <ul className="rows">
        {list.slice(0, 120).map((p) => (
          <li key={p.index}>
            <button type="button" className="row" onClick={() => onPick(p.index)}>
              <span className="row-title">{p.name}</span>
              <span className="meter" aria-hidden="true"><i style={{ width: `${(p.count / max) * 100}%`, background: 'var(--ink)' }} /></span>
              <span className="row-meta">
                <span>{p.count.toLocaleString('en-US')} reports</span>
                {p.bounty > 0 && <span className="hot">${p.bounty.toLocaleString('en-US')}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {list.length > 120 && <p className="dim note">Showing 120 of {list.length}. Type to narrow the list.</p>}
      {list.length === 0 && <p className="dim note">No program matches.</p>}
    </>
  );
}
