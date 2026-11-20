const fmt = (n) => n.toLocaleString();
const NODES = [[40, 40], [120, 25], [200, 50], [80, 110], [170, 115], [250, 90]];
const EDGES = [[0, 1], [0, 3], [1, 2], [2, 5], [2, 4], [3, 4]];

// One full preview of a design. It only sets data-design / data-theme on its own wrapper,
// so nothing outside it changes until the user confirms. Stats, classes and reports are real.
export default function DesignPreview({ design, theme, data }) {
  const top = data.classes.slice(0, 3);
  const rows = [...data.reports].sort((a, b) => b.upvotes - a.upvotes).slice(0, 4);
  const stats = data.stats.slice(0, 3);

  return (
    <div className="dp" data-design={design} data-theme={theme} aria-label={`Preview of ${design} design, ${theme} theme`}>
      <div className="dp-box dp-nav">
        <b>HEXBRAIN</b>
        <span className="on">Dashboard</span><span>Graph</span><span>Academy</span><span>Search</span>
      </div>

      <div className="dp-box dp-scan">
        <h4>Dashboard</h4>
        <div className="dp-stats">
          {stats.map((s) => (
            <div key={s.label}><strong>{s.prefix}{fmt(s.value)}</strong><small>{s.label}</small></div>
          ))}
        </div>
      </div>

      <div className="dp-cols">
        <div className="dp-box">
          <h4>Vulnerability cards</h4>
          {top.map((c) => (
            <div key={c.id} className="dp-vuln">
              <span>{c.name} <span className="muted">{fmt(c.count)}</span></span>
              <span className="bar"><i style={{ width: `${(c.count / top[0].count) * 100}%` }} /></span>
            </div>
          ))}
        </div>

        <div className="dp-box">
          <h4>Security graph</h4>
          <svg className="dp-graph" viewBox="0 0 290 140" role="img" aria-label="Illustrative graph layout">
            {EDGES.map(([a, b]) => <line key={`${a}-${b}`} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} />)}
            {NODES.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === 0 ? 11 : 7} className={i === 0 ? 'hub' : ''} />)}
          </svg>
          <p className="dp-note">Layout illustration only.</p>
        </div>
      </div>

      <div className="dp-box">
        <h4>Data table</h4>
        <table className="dp-table">
          <thead><tr><th>ID</th><th>Title</th><th>Program</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}><td>#{r.id}</td><td>{r.title.slice(0, 44)}{r.title.length > 44 ? '...' : ''}</td><td>{r.program}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dp-cols">
        <div className="dp-box">
          <h4>Bug Academy</h4>
          <p>SQL Injection</p>
          <span className="bar"><i style={{ width: '40%' }} /></span>
          <p className="dp-note">Sample progress bar</p>
        </div>
        <div className="dp-box">
          <h4>Search</h4>
          <input className="dp-search" readOnly aria-label="Preview search box" value="CWE-79" />
        </div>
      </div>

      <div className="dp-box dp-dialog">
        <h4>Dialog</h4>
        <p>Open report details?</p>
        <p className="dp-note">The scraper fetches the public write-up when you confirm.</p>
      </div>
    </div>
  );
}
