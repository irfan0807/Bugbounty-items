import { useMemo, useState } from 'react';
import ReportList from './ReportList.jsx';

// Find: keyword over title, program, weakness and id, with a sort control.
export default function PanelSearch({ data, onOpen }) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('upvotes');

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return data.reports.filter((r) => r.search.includes(needle));
  }, [data, q]);

  return (
    <>
      <p className="tag">FIND</p>
      <h2>Search the reports</h2>
      <input
        className="field" type="search" autoFocus value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="SSRF, Shopify, 4077800" aria-label="Search reports"
      />
      <div className="lens sorts" role="group" aria-label="Sort by">
        {[['upvotes', 'Upvotes'], ['bounty', 'Bounty'], ['newest', 'Newest']].map(([id, l]) => (
          <button key={id} type="button" aria-pressed={sort === id} onClick={() => setSort(id)}>{l}</button>
        ))}
      </div>
      {q.trim() ? <ReportList reports={results} onOpen={onOpen} sort={sort} /> : <p className="dim note">Type a keyword, program, weakness or report id.</p>}
    </>
  );
}
