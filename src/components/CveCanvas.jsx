import { useMemo } from 'react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const xy = (i, count, radius) => {
  const a = -Math.PI / 2 + (i / Math.max(count, 1)) * Math.PI * 2;
  return [360 + Math.cos(a) * radius, 360 + Math.sin(a) * radius];
};

export default function CveCanvas({ entries = [], error = '', year, month, onYear, onMonth, onCve }) {
  const years = useMemo(() => {
    const groups = new Map();
    for (const c of entries) {
      const y = Number(c.dateAdded?.slice(0, 4));
      if (!Number.isFinite(y)) continue;
      groups.set(y, (groups.get(y) || 0) + 1);
    }
    return [...groups].map(([value, count]) => ({ value, count })).sort((a, b) => a.value - b.value);
  }, [entries]);
  const months = useMemo(() => MONTHS.map((name, index) => ({
    name,
    index: index + 1,
    entries: entries.filter((c) => c.dateAdded?.startsWith(`${year}-${String(index + 1).padStart(2, '0')}-`)),
  })), [entries, year]);
  const monthEntries = useMemo(() => entries.filter((c) => c.dateAdded?.startsWith(`${year}-${String(month).padStart(2, '0')}-`)), [entries, year, month]);
  const cvYear = years.find((y) => y.value === Number(year));

  return (
    <div className="orbital-stage cve-stage" aria-label="Interactive exploited CVE timeline">
      <svg className="orbital-graphic" viewBox="0 0 720 720" role="group" aria-labelledby="cve-graphic-title">
        <title id="cve-graphic-title">Known exploited CVEs by {month ? 'month' : year ? 'year' : 'year'}</title>
        <defs>
          <radialGradient id="cve-glow"><stop stopColor="var(--red)" stopOpacity=".2" /><stop offset="1" stopColor="var(--red)" stopOpacity="0" /></radialGradient>
          <filter id="cve-grain"><feTurbulence type="fractalNoise" baseFrequency=".68" numOctaves="2" stitchTiles="stitch" /><feColorMatrix values=".25 0 0 0 .16 .25 0 0 0 .04 .25 0 0 0 .04 0 0 0 .1 0" /></filter>
        </defs>
        <circle cx="360" cy="360" r="340" fill="url(#cve-glow)" opacity=".65" />
        <circle cx="360" cy="360" r="338" fill="transparent" filter="url(#cve-grain)" opacity=".18" />
        {[92, 154, 218, 288, 326].map((r) => <circle key={r} className="orbit-ring cve-ring" cx="360" cy="360" r={r} />)}
        {Array.from({ length: 48 }, (_, i) => {
          const [x1, y1] = xy(i, 48, 92);
          const [x2, y2] = xy(i, 48, 326);
          return <line key={i} className="orbit-spoke cve-spoke" x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
        {!year && years.map((item, i) => {
          const [x, y] = xy(i, years.length, 285);
          const r = 5 + Math.sqrt(item.count) * 1.6;
          return <g key={item.value} className="cve-hub" role="button" tabIndex="0" aria-label={`${item.value}, ${item.count} exploited CVEs`} onClick={() => onYear(item.value)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onYear(item.value)}>
            <circle className="cve-halo" cx={x} cy={y} r={r * 2.5} /><circle className="cve-node" cx={x} cy={y} r={r} />
            <text className="hub-label" x={x} y={y - 15}>{item.value}</text><text className="hub-count" x={x} y={y + 27}>{item.count}</text>
          </g>;
        })}
        {year && !month && months.map((item, i) => {
          const [x, y] = xy(i, 12, 245);
          const r = 5 + Math.sqrt(item.entries.length) * 1.7;
          return <g key={item.index} className="cve-hub" role="button" tabIndex="0" aria-label={`${item.name}, ${item.entries.length} exploited CVEs`} onClick={() => onMonth(item.index)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onMonth(item.index)}>
            <line className="program-link cve-link" x1="360" y1="360" x2={x} y2={y} /><circle className="cve-halo" cx={x} cy={y} r={r * 2.8} /><circle className="cve-node" cx={x} cy={y} r={r} />
            <text className="hub-label" x={x} y={y - 15}>{item.name}</text><text className="hub-count" x={x} y={y + 27}>{item.entries.length}</text>
          </g>;
        })}
        {year && month && monthEntries.slice(0, 180).map((item, i) => {
          const [x, y] = xy(i, Math.min(monthEntries.length, 180), 184 + (i % 3) * 32);
          return <g key={item.cveID} className="cve-dot" role="button" tabIndex="0" aria-label={`${item.cveID}: ${item.vulnerabilityName}`} onClick={() => onCve(item.cveID)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onCve(item.cveID)}>
            <circle className="cve-point-halo" cx={x} cy={y} r="8" /><circle className="cve-point" cx={x} cy={y} r="2.4" />
          </g>;
        })}
        {(year || entries.length) && <g className="letter-core" onClick={() => month ? onMonth(null) : onYear(null)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (month ? onMonth(null) : onYear(null))} role="button" tabIndex="0" aria-label="Back one level"><circle cx="360" cy="360" r="66" />
          <text x="360" y="356">{month ? MONTHS[Number(month) - 1] : year || 'CVE'}</text><text className="core-sub" x="360" y="382">{month ? `${monthEntries.length} KEV` : cvYear ? `${cvYear.count} KEV` : `${entries.length} KEV`}</text></g>}
      </svg>
      <div className="orbital-caption"><span className="tag">CVE INDEX / {month ? `${MONTHS[month - 1]} ${year}` : year || 'EXPLOITED'}</span><p>{error ? `CISA catalog unavailable: ${error}` : !entries.length ? 'Loading the CISA Known Exploited Vulnerabilities catalog…' : month ? 'Each red point is a CISA Known Exploited Vulnerability. Select a point to inspect it.' : 'Browse known exploited CVEs by year and month.'}</p></div>
      {year && <button className="orbit-back" type="button" onClick={() => month ? onMonth(null) : onYear(null)}>← {month ? year : 'All years'}</button>}
    </div>
  );
}
