import { useState } from 'react';
import { DESIGNS } from '../designs.js';
import DesignPreview from './DesignPreview.jsx';

export default function DesignGallery({ data, settings, update }) {
  const [design, setDesign] = useState(settings.design);
  const [theme, setTheme] = useState(settings.theme);
  const [asking, setAsking] = useState(false);

  const changed = design !== settings.design || theme !== settings.theme;
  const name = DESIGNS.find((d) => d.id === design)?.name;

  const apply = () => {
    update({ design, theme });
    setAsking(false);
  };
  const reset = () => {
    update({ design: 'grid', theme: 'dark' });
    setDesign('grid');
    setTheme('dark');
    setAsking(false);
  };

  return (
    <section className="section" id="designs" aria-labelledby="dg-title">
      <header className="section-head">
        <p className="eyebrow">SECTOR 06 // INTERFACE LAB</p>
        <h2 id="dg-title">Design gallery</h2>
        <p className="lead">Five TRON concepts, each in light and dark. Preview freely. Nothing changes until you confirm. Design never changes your data.</p>
      </header>

      <ul className="dg-grid" aria-label="Design concepts" style={{ listStyle: 'none', padding: 0 }}>
        {DESIGNS.map((d) => (
          <li key={d.id}>
            <button
              type="button"
              className="glass dg-card"
              aria-pressed={design === d.id}
              onClick={() => { setDesign(d.id); setAsking(false); }}
            >
              <span className="dg-badges">
                <span className="chip">DESIGN {d.code}</span>
                {settings.design === d.id && <span className="chip">ACTIVE</span>}
              </span>
              <h3>{d.name}</h3>
              <span className="muted small-text">{d.text}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="dg-toolbar">
        <div className="segmented" role="group" aria-label="Preview appearance">
          {['dark', 'light'].map((t) => (
            <button
              key={t}
              type="button"
              className={theme === t ? 'active' : ''}
              aria-pressed={theme === t}
              onClick={() => { setTheme(t); setAsking(false); }}
            >
              {t === 'dark' ? 'Dark' : 'Light'}
            </button>
          ))}
        </div>
        <span className="grow" />
        <button type="button" className="btn primary" disabled={!changed} onClick={() => setAsking(true)}>Apply design</button>
        <button type="button" className="btn ghost" onClick={reset}>Reset design</button>
      </div>

      {asking && (
        <div className="glass dg-confirm" role="alertdialog" aria-label="Confirm design change">
          <span>Apply <b>{name}</b> ({theme}) to the whole app?</span>
          <button type="button" className="btn primary small" onClick={apply}>Yes, apply</button>
          <button type="button" className="btn ghost small" onClick={() => setAsking(false)}>Cancel</button>
        </div>
      )}

      <p className="result-count" role="status">
        Previewing: {name} / {theme}{changed ? ' (not applied)' : ' (current)'}
      </p>
      <DesignPreview design={design} theme={theme} data={data} />
    </section>
  );
}
