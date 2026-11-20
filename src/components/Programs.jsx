import { useMemo, useState } from 'react';

export default function Programs({ data, onPick }) {
  const [q, setQ] = useState('');
  const [showAll, setShowAll] = useState(false);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data.programs.filter((p) => !needle || p.name.toLowerCase().includes(needle));
  }, [data, q]);

  const visible = showAll || q ? list : list.slice(0, 12);
  const max = data.programs[0].count;

  return (
    <section className="section" id="programs" aria-labelledby="prog-title">
      <header className="section-head">
        <p className="eyebrow">SECTOR 02 // PROGRAM INDEX</p>
        <h2 id="prog-title">Programs</h2>
        <p className="lead">{data.programs.length} bounty programs. Choose one to list everything reported to it.</p>
      </header>

      <label className="field prog-search">
        <span>Find a program</span>
        <input type="search" placeholder="e.g. Shopify, GitLab, Uber" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>

      <ul className="programs">
        {visible.map((p) => (
          <li key={p.index}>
            <button type="button" className="panel program" onClick={() => onPick(p.index)}>
              <span className="prog-name">{p.name}</span>
              <span className="bar" aria-hidden="true"><i style={{ width: `${(p.count / max) * 100}%` }} /></span>
              <span className="prog-meta">
                <span>{p.count.toLocaleString()} reports</span>
                <span className="bounty">${p.bounty.toLocaleString()}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {list.length === 0 && <div className="panel empty">No program matches that name.</div>}

      {!q && list.length > 12 && (
        <div className="center">
          <button type="button" className="btn ghost" onClick={() => setShowAll((s) => !s)}>
            {showAll ? 'Show top 12' : `Show all ${list.length} programs`}
          </button>
        </div>
      )}
    </section>
  );
}
