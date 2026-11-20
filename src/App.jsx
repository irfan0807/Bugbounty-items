import { useCallback, useEffect, useMemo, useState } from 'react';
import MapCanvas from './components/MapCanvas.jsx';
import TopBar from './components/TopBar.jsx';
import Landing from './components/Landing.jsx';
import SidePanel from './components/SidePanel.jsx';
import { useSettings } from './hooks.js';
import { loadData } from './data.js';

const NONE = { classIdx: null, weaknessIdx: null, programIdx: null, reportId: null };

export default function App() {
  const [settings, update] = useSettings();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [lens, setLens] = useState('vulnerabilities');
  const [sel, setSel] = useState(NONE);
  const [resetKey, setResetKey] = useState(0);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadData().then(setData).catch((e) => setError(e.message));
  }, []);

  const open = sel.classIdx != null || sel.programIdx != null || sel.reportId != null || searching || lens !== 'vulnerabilities';
  const focus = useMemo(() => (sel.classIdx == null ? null : { classIdx: sel.classIdx, weaknessIdx: sel.weaknessIdx }), [sel]);

  const clear = useCallback(() => {
    setSel(NONE);
    setSearching(false);
    setLens('vulnerabilities');
    setResetKey((k) => k + 1);
  }, []);

  const pickOnMap = useCallback((hit) => {
    if (!hit) return;
    setLens('vulnerabilities');
    setSearching(false);
    setSel({ ...NONE, classIdx: hit.cls.index, weaknessIdx: hit.type === 'weakness' ? hit.weakness.index : null });
  }, []);

  // "F" opens search, Escape closes whatever is open.
  useEffect(() => {
    const onKey = (e) => {
      const typing = /input|textarea|select/i.test(e.target.tagName);
      if (e.key === 'Escape') clear();
      else if (!typing && !e.metaKey && !e.ctrlKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setSearching(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [clear]);

  const changeLens = (l) => {
    setLens(l);
    setSearching(false);
    setSel(NONE);
  };

  return (
    <div className="shell">
      <a className="skip" href="#panel">Skip to details</a>
      {data && <MapCanvas data={data} focus={focus} onPick={pickOnMap} resetKey={resetKey} />}
      {['tl', 'tr', 'bl', 'br'].map((c) => <span key={c} className={`corner ${c}`} aria-hidden="true" />)}

      <TopBar
        data={data} sel={sel} lens={lens} setLens={changeLens}
        onHome={clear} onFind={() => setSearching(true)} settings={settings} update={update}
        onCrumb={(patch) => setSel((s) => ({ ...s, ...patch }))}
      />

      {error && <div className="loading" role="alert">Data failed to load: {error}. Run node scripts/build-data.mjs first.</div>}
      {!data && !error && <div className="loading" role="status">Loading reports...</div>}
      {data && (
        <Landing
          data={data} away={open}
          onExplore={() => setSel({ ...NONE, classIdx: data.classes[0].index })}
          onSearch={() => setSearching(true)}
          onStat={(k) => (k === 'programs' ? changeLens('programs') : setSel({ ...NONE, classIdx: data.classes[0].index }))}
        />
      )}
      {data && <SidePanel data={data} open={open} lens={lens} sel={sel} setSel={setSel} searching={searching} setSearching={setSearching} onClose={clear} />}
    </div>
  );
}
