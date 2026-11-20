import { useEffect, useRef, useState } from 'react';

const LENSES = [['vulnerabilities', 'Vulnerabilities'], ['programs', 'Programs'], ['cves', 'CVEs']];

function Settings({ settings, update, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.querySelector('button')?.focus();
    const onKey = (e) => e.key === 'Escape' && (e.stopPropagation(), onClose());
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const Row = ({ label, on, onClick }) => (
    <button type="button" className="set-row" aria-pressed={on} onClick={onClick}>
      <span>{label}</span><span className="dim">{on ? 'on' : 'off'}</span>
    </button>
  );

  return (
    <div className="set" role="dialog" aria-label="Accessibility settings" ref={ref}>
      <Row label="Motion" on={settings.motion} onClick={() => update({ motion: !settings.motion })} />
      <Row label="High contrast" on={settings.contrast} onClick={() => update({ contrast: !settings.contrast })} />
      <div className="set-row" role="group" aria-label="Text size">
        <span>Text size</span>
        <span className="lens">
          {[['sm', 'A-'], ['md', 'A'], ['lg', 'A+']].map(([v, l]) => (
            <button key={v} type="button" aria-pressed={settings.text === v} onClick={() => update({ text: v })}>{l}</button>
          ))}
        </span>
      </div>
    </div>
  );
}

export default function TopBar({ data, sel, lens, setLens, onHome, onFind, settings, update, onCrumb }) {
  const [menu, setMenu] = useState(false);
  const cls = data && sel.classIdx != null ? data.classes.find((c) => c.index === sel.classIdx) : null;
  const weak = cls && sel.weaknessIdx != null ? cls.weaknesses.find((w) => w.index === sel.weaknessIdx) : null;

  return (
    <header className="top">
      <nav className="crumbs" aria-label="Position in the map">
        <span className="lens" role="group" aria-label="What the map is organised by">
          {LENSES.map(([id, label]) => (
            <button key={id} type="button" aria-pressed={lens === id} onClick={() => setLens(id)}>{label}</button>
          ))}
        </span>
        {cls && (
          <>
            <i>/</i>
            {weak ? <button type="button" className="crumb" onClick={() => onCrumb({ weaknessIdx: null, reportId: null })}>{cls.name}</button> : <b>{cls.name}</b>}
          </>
        )}
        {weak && <><i>/</i><b>{weak.name}</b></>}
      </nav>

      <a className="brand" href="#top" aria-label="HexBrain home" onClick={(e) => { e.preventDefault(); onHome(); }} style={{ pointerEvents: 'auto' }}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="12" cy="12" r="2.2" fill="var(--hot)" />
        </svg>
        HexBrain
      </a>

      <div className="keys">
        <button type="button" className="key" onClick={onFind}>Find <kbd>F</kbd></button>
        <span className="set-wrap">
          <button type="button" className="key" aria-haspopup="dialog" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>Access</button>
          {menu && <Settings settings={settings} update={update} onClose={() => setMenu(false)} />}
        </span>
      </div>
    </header>
  );
}
