import { useEffect, useMemo, useState } from 'react';

const PAGE = 40;

// Sorted, paged list of reports. Used by weakness, program and search views.
export default function ReportList({ reports, onOpen, sort = 'upvotes' }) {
  const [n, setN] = useState(PAGE);
  useEffect(() => setN(PAGE), [reports, sort]);

  const sorted = useMemo(() => {
    const by = {
      upvotes: (a, b) => b.upvotes - a.upvotes,
      bounty: (a, b) => b.bounty - a.bounty,
      newest: (a, b) => b.id - a.id,
    };
    return [...reports].sort(by[sort]);
  }, [reports, sort]);

  if (!sorted.length) return <p className="dim note">No reports match.</p>;

  return (
    <>
      <p className="tag" role="status">{sorted.length.toLocaleString('en-US')} {sorted.length === 1 ? 'report' : 'reports'}</p>
      <ul className="rows">
        {sorted.slice(0, n).map((r) => (
          <li key={r.id}>
            <button type="button" className="row" onClick={() => onOpen(r.id)}>
              <span className="row-title">{r.title}</span>
              <span className="row-meta">
                <span>{r.program}</span>
                <span>{r.weakness}</span>
                <span>&#9650; {r.upvotes.toLocaleString('en-US')}</span>
                {r.bounty > 0 && <span className="hot">${r.bounty.toLocaleString('en-US')}</span>}
                {r.guessed && <span title="Class guessed from the title">class guessed</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {sorted.length > n && (
        <button type="button" className="key more" onClick={() => setN((x) => x + PAGE)}>
          Show {Math.min(PAGE, sorted.length - n)} more
        </button>
      )}
    </>
  );
}
