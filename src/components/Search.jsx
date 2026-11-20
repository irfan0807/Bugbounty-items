import { useEffect, useMemo, useState } from 'react';
import ReportModal from './ReportModal.jsx';

const PAGE = 30;

export default function Search({ data, filters, setFilters }) {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const { query, classIdx, weaknessIdx, programIdx, sort } = filters;
  const set = (patch) => setFilters({ ...filters, ...patch });

  useEffect(() => setPage(1), [filters]);

  const activeClass = classIdx === 'all' ? null : data.classes.find((c) => c.index === classIdx);
  const programsAlpha = useMemo(() => [...data.programs].sort((a, b) => a.name.localeCompare(b.name)), [data]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = data.reports.filter((r) => {
      if (classIdx !== 'all' && r.classIdx !== classIdx) return false;
      if (weaknessIdx !== 'all' && r.weaknessIdx !== weaknessIdx) return false;
      if (programIdx !== 'all' && r.programIdx !== programIdx) return false;
      return !q || r.search.includes(q);
    });
    const by = { upvotes: (a, b) => b.upvotes - a.upvotes, bounty: (a, b) => b.bounty - a.bounty, newest: (a, b) => b.id - a.id };
    return out.sort(by[sort]);
  }, [data, query, classIdx, weaknessIdx, programIdx, sort]);

  const shown = results.slice(0, page * PAGE);

  return (
    <section className="section" id="search" aria-labelledby="search-title">
      <header className="section-head">
        <p className="eyebrow">SECTOR 03 // REPORT SCANNER</p>
        <h2 id="search-title">Search the reports</h2>
        <p className="lead">Type a keyword, program, weakness or report ID. Each result opens the original report on HackerOne.</p>
      </header>

      <form className="panel filters" role="search" onSubmit={(e) => e.preventDefault()}>
        <label className="field grow">
          <span>Keyword</span>
          <input type="search" placeholder="e.g. SSRF, Shopify, 4077800" value={query} onChange={(e) => set({ query: e.target.value })} />
        </label>

        <label className="field">
          <span>Class</span>
          <select value={classIdx} onChange={(e) => set({ classIdx: e.target.value === 'all' ? 'all' : Number(e.target.value), weaknessIdx: 'all' })}>
            <option value="all">All classes</option>
            {data.classes.map((c) => (
              <option key={c.id} value={c.index}>{c.name} ({c.count})</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Weakness</span>
          <select
            value={weaknessIdx}
            disabled={!activeClass}
            onChange={(e) => set({ weaknessIdx: e.target.value === 'all' ? 'all' : Number(e.target.value) })}
          >
            <option value="all">{activeClass ? 'All weaknesses' : 'Pick a class first'}</option>
            {activeClass?.weaknesses.map((w) => (
              <option key={w.index} value={w.index}>{w.name} ({w.count})</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Program</span>
          <select value={programIdx} onChange={(e) => set({ programIdx: e.target.value === 'all' ? 'all' : Number(e.target.value) })}>
            <option value="all">All programs</option>
            {programsAlpha.map((p) => (
              <option key={p.index} value={p.index}>{p.name} ({p.count})</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Sort by</span>
          <select value={sort} onChange={(e) => set({ sort: e.target.value })}>
            <option value="upvotes">Most upvoted</option>
            <option value="bounty">Highest bounty</option>
            <option value="newest">Newest first</option>
          </select>
        </label>

        <button type="button" className="btn ghost" onClick={() => setFilters({ query: '', classIdx: 'all', weaknessIdx: 'all', programIdx: 'all', sort: 'upvotes' })}>
          Reset
        </button>
      </form>

      <p className="result-count" role="status">
        {results.length.toLocaleString()} {results.length === 1 ? 'report' : 'reports'} found
        {results.length > shown.length && ` - showing ${shown.length}`}
      </p>

      {results.length === 0 ? (
        <div className="panel empty">No signal. Try a different keyword or reset the filters.</div>
      ) : (
        <ul className="results">
          {shown.map((r) => (
            <li key={r.id}>
              <button type="button" className="glass result" onClick={() => setOpen(r)}>
                <span className="result-top">
                  <span className="chip">#{r.id}</span>
                  <span className="upvotes" title="Upvotes">&#9650; {r.upvotes.toLocaleString()}</span>
                </span>
                <span className="result-title">{r.title}</span>
                <span className="muted">
                  {r.program} &middot; {r.weakness}
                  {r.guessed && <span className="guess"> (class guessed from title)</span>}
                </span>
                <span className="result-foot">
                  <span className="bounty">{r.bounty ? `$${r.bounty.toLocaleString()}` : 'No bounty listed'}</span>
                  <span className="link">Read report &rarr;</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {results.length > shown.length && (
        <div className="center">
          <button type="button" className="btn" onClick={() => setPage((p) => p + 1)}>
            Load {Math.min(PAGE, results.length - shown.length)} more
          </button>
        </div>
      )}

      {open && <ReportModal report={open} onClose={() => setOpen(null)} />}
    </section>
  );
}
