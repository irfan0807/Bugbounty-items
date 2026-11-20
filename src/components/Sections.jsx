import { MODULES } from '../data.js';

export function Modules() {
  return (
    <section className="section" id="modules" aria-labelledby="mod-title">
      <header className="section-head">
        <p className="eyebrow">SECTOR 04 // TOOL BAY</p>
        <h2 id="mod-title">Modules</h2>
        <p className="lead">Four ways into the data. Pick the one that fits what you are doing.</p>
      </header>
      <ul className="modules">
        {MODULES.map((m) => (
          <li key={m.id} className="panel module">
            <span className="chip">{m.code}</span>
            <h3>{m.title}</h3>
            <p>{m.text}</p>
            <a className="link" href={m.href}>{m.cta} &rarr;</a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function About({ data }) {
  return (
    <section className="section" id="about" aria-labelledby="about-title">
      <div className="panel about">
        <p className="eyebrow">SECTOR 05 // BRIEFING</p>
        <h2 id="about-title">About this map</h2>
        <p>
          This console lists {data.reports.length.toLocaleString()} publicly disclosed bug bounty reports from {data.programs.length} programs,
          grouped into {data.classes.length - 1} vulnerability classes. Open a class, pick a weakness, and follow the link to read the
          original write-up.
        </p>
        <h3>Where the data comes from</h3>
        <p>
          The report list comes from the open <a href="https://github.com/reddelexc/hackerone-reports" target="_blank" rel="noopener noreferrer">hackerone-reports</a> dataset.
          Every report links back to its own public page on HackerOne. Weaknesses are taken from that dataset; the broader classes are
          grouped by this project&apos;s own rules. Where a report has no weakness, its class is guessed from the title and marked as such.
        </p>
        <p className="muted">
          Reports belong to their authors and the programs that disclosed them. This is an independent redesign concept. It is not the
          official HexBrain site and is not affiliated with HackerOne or any program shown. Use the information only to learn and to test
          systems you are authorised to test.
        </p>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <span>HEXBRAIN NEXUS // redesign concept</span>
      <a href="#top">Back to top &uarr;</a>
    </footer>
  );
}
