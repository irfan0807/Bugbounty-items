import { useEffect, useRef, useState } from 'react';

const NAV = [
  ['Map', '#map'],
  ['Search', '#search'],
  ['Modules', '#modules'],
  ['About', '#about'],
];

function AccessPanel({ settings, update, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.querySelector('button, input')?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="panel access-panel" role="dialog" aria-label="Accessibility settings" ref={ref}>
      <h2 className="panel-title">Accessibility</h2>

      <label className="switch">
        <input type="checkbox" checked={settings.motion} onChange={(e) => update({ motion: e.target.checked })} />
        <span>Animations &amp; motion</span>
      </label>

      <label className="switch">
        <input type="checkbox" checked={settings.contrast} onChange={(e) => update({ contrast: e.target.checked })} />
        <span>High contrast</span>
      </label>

      <fieldset className="segmented">
        <legend>Text size</legend>
        {[['sm', 'A-'], ['md', 'A'], ['lg', 'A+']].map(([v, label]) => (
          <button
            key={v}
            type="button"
            className={settings.text === v ? 'active' : ''}
            aria-pressed={settings.text === v}
            aria-label={`Text size ${v === 'sm' ? 'small' : v === 'md' ? 'medium' : 'large'}`}
            onClick={() => update({ text: v })}
          >
            {label}
          </button>
        ))}
      </fieldset>

      <button type="button" className="btn ghost small" onClick={onClose}>Close</button>
    </div>
  );
}

export default function Header({ settings, update }) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  return (
    <header className="header">
      <a className="brand" href="#top" aria-label="HexBrain Nexus home">
        <svg viewBox="0 0 100 100" width="34" height="34" aria-hidden="true">
          <polygon points="50,5 93,28 93,72 50,95 7,72 7,28" fill="none" stroke="currentColor" strokeWidth="6" />
          <polygon points="50,28 72,40 72,62 50,74 28,62 28,40" fill="currentColor" opacity=".35" />
        </svg>
        <span>HEX<b>BRAIN</b></span>
      </a>

      <button
        type="button"
        className="menu-btn"
        aria-expanded={menu}
        aria-controls="main-nav"
        onClick={() => setMenu((m) => !m)}
      >
        {menu ? 'Close' : 'Menu'}
      </button>

      <nav id="main-nav" className={menu ? 'nav open' : 'nav'} aria-label="Main">
        {NAV.map(([label, href]) => (
          <a key={href} href={href} onClick={() => setMenu(false)}>{label}</a>
        ))}
      </nav>

      <div className="header-tools">
        <button
          type="button"
          className="btn ghost small"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          Access
        </button>
        {open && <AccessPanel settings={settings} update={update} onClose={() => setOpen(false)} />}
      </div>
    </header>
  );
}
