// A class opens into its weaknesses; each weakness opens into its reports.
export default function PanelClass({ data, cls, onWeakness, onAll }) {
  const total = data.reports.length;
  const max = cls.weaknesses[0]?.count || 1;

  return (
    <>
      <p className="tag">CLASS / {cls.short}</p>
      <h2>{cls.name}</h2>
      <p className="dim lede">
        {cls.count.toLocaleString('en-US')} reports, {((cls.count / total) * 100).toFixed(1)}% of the index,
        across {cls.weaknesses.length} weaknesses.
      </p>
      <button type="button" className="key" onClick={onAll}>Read all {cls.count.toLocaleString('en-US')}</button>
      <hr className="rule" />
      <ul className="rows">
        {cls.weaknesses.map((w) => (
          <li key={w.index}>
            <button type="button" className="row" onClick={() => onWeakness(w.index)}>
              <span className="row-title">{w.name}</span>
              <span className="meter" aria-hidden="true"><i style={{ width: `${(w.count / max) * 100}%`, background: 'var(--ink)' }} /></span>
              <span className="row-meta"><span>{w.count.toLocaleString('en-US')} reports</span></span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
