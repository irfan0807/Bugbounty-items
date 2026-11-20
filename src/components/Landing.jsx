const fmt = (n) => n.toLocaleString('en-US');

// Hero text (bottom-left) and headline numbers (bottom-right). Both fade out when a panel is open.
export default function Landing({ data, away, onExplore, onSearch, onStat, onOpenTerminal }) {
  const byKey = Object.fromEntries(data.stats.map((s) => [s.label.toLowerCase(), s]));
  const items = [
    ['reports', byKey.reports, false],
    ['classes', byKey.classes, false],
    ['weaknesses', byKey.weaknesses, true],
    ['programs', byKey.programs, true],
    ['bounties', byKey.bounties, false],
  ];

  return (
    <>
      <section className={away ? 'hero away' : 'hero'} aria-label="About this map" aria-hidden={away}>
        <h1>SkyNet / public security research</h1>
        <p>
          {fmt(data.reports.length)} disclosed reports across {fmt(data.programs.length)} programs, connected to classes and weakness types.
        </p>
        <p>
          <button type="button" className="link" tabIndex={away ? -1 : 0} onClick={onExplore}>Explore the map</button> or{' '}
          <button type="button" className="link" tabIndex={away ? -1 : 0} onClick={onSearch}>search the reports.</button>
        </p>
        <p><button type="button" className="link terminal-launch-link" tabIndex={away ? -1 : 0} onClick={onOpenTerminal}>Open practice terminal</button> <span className="terminal-shortcut-hint">· or right-click the right side of the map</span></p>
        <p className="links">
          {['Browse', 'Bypasses', 'Payloads', 'CVEs', 'Learn', 'About'].map((l) => (
            <a key={l} href={`/${l.toLowerCase()}`} tabIndex={away ? -1 : 0}>{l}</a>
          ))}
        </p>
      </section>

      <div className={away ? 'stats away' : 'stats'} style={{ '--n': items.length }} aria-hidden={away}>
        {items.map(([key, s, click]) => {
          const label = key === 'bounties' ? 'in bounties' : key;
          const inner = (<><b>{s.prefix}{fmt(s.value)}</b><span>{label}</span></>);
          return click
            ? <button key={key} type="button" className="stat" tabIndex={away ? -1 : 0} onClick={() => onStat(key)}>{inner}</button>
            : <div key={key} className="stat">{inner}</div>;
        })}
        <p>Each strip is a weakness and each line in it a row of reports. Lines through the middle join classes that turn up in the same programs.</p>
      </div>
    </>
  );
}
