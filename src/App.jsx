import { useCallback, useEffect, useMemo, useState } from 'react';
import MapCanvas from './components/MapCanvas.jsx';
import TopBar from './components/TopBar.jsx';
import Landing from './components/Landing.jsx';
import SidePanel from './components/SidePanel.jsx';
import { useSettings } from './hooks.js';
import { loadData } from './data.js';
import LibraryPages from './components/LibraryPages.jsx';
import ProgramCanvas from './components/ProgramCanvas.jsx';
import CveCanvas from './components/CveCanvas.jsx';
import PracticeTerminal from './components/PracticeTerminal.jsx';

const NONE = { classIdx: null, weaknessIdx: null, programIdx: null, programClassIdx: null, programWeaknessIdx: null, reportId: null };

export default function App() {
  const page = window.location.pathname.replace(/\/+$/, '').split('/').pop() || 'map';
  const isMap = page === 'map' || page === '' || page === 'programs';
  const [settings, update] = useSettings();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [lens, setLens] = useState('vulnerabilities');
  const [sel, setSel] = useState(NONE);
  const [resetKey, setResetKey] = useState(0);
  const [searching, setSearching] = useState(false);
  const [programLetter, setProgramLetter] = useState('');
  const [cveIndex, setCveIndex] = useState(null);
  const [cveIndexError, setCveIndexError] = useState('');
  const [cveYear, setCveYear] = useState(null);
  const [cveMonth, setCveMonth] = useState(null);
  const [selectedCve, setSelectedCve] = useState('');
  const [practiceTerminalOpen, setPracticeTerminalOpen] = useState(false);

  useEffect(() => {
    if (page === 'programs') setLens('programs');
    loadData().then((d) => {
      setData(d);
      // deep link: ?c=<class index>&w=<weakness index>
      const p = new URLSearchParams(window.location.search);
      if (p.has('search')) setSearching(true);
      const c = Number(p.get('c'));
      if (!Number.isNaN(c) && p.has('c') && d.classes.some((k) => k.index === c)) {
        const w = p.has('w') ? Number(p.get('w')) : null;
        setSel({ ...NONE, classIdx: c, weaknessIdx: w });
      }
    }).catch((e) => setError(e.message));
  }, [page]);

  useEffect(() => {
    if (lens !== 'cves' || cveIndex) return;
    let live = true;
    setCveIndexError('');
    fetch('/api/kev')
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
        return j;
      })
      .then((j) => live && setCveIndex(j.vulnerabilities || []))
      .catch((e) => live && setCveIndexError(e.message));
    return () => { live = false; };
  }, [lens, cveIndex]);

  const open = sel.classIdx != null || sel.programIdx != null || sel.reportId != null || searching || lens !== 'vulnerabilities';
  const focus = useMemo(() => (sel.classIdx == null ? null : { classIdx: sel.classIdx, weaknessIdx: sel.weaknessIdx }), [sel]);

  const clear = useCallback(() => {
    setSel(NONE);
    setSearching(false);
    setLens('vulnerabilities');
    setSelectedCve('');
    setProgramLetter('');
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
        if (isMap) setSearching(true);
        else window.location.assign('/?search=1');
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [clear, isMap]);

  const changeLens = (l) => {
    setLens(l);
    setSearching(false);
    setSel(NONE);
    setSelectedCve('');
    if (l === 'programs') setProgramLetter('');
    if (l === 'cves') { setCveYear(null); setCveMonth(null); }
  };

  return (
    <div className="shell">
      <a className="skip" href={isMap ? '#panel' : '#main'}>Skip to details</a>
      {isMap && data && lens === 'vulnerabilities' && <MapCanvas data={data} focus={focus} onPick={pickOnMap} resetKey={resetKey} onOpenTerminal={() => { if (!open) setPracticeTerminalOpen(true); }} />}
      {isMap && data && lens === 'programs' && <ProgramCanvas data={data} letter={programLetter} selectedProgramIdx={sel.programIdx} onLetter={setProgramLetter} onProgram={(i) => setSel({ classIdx: null, weaknessIdx: null, programIdx: i, reportId: null })} />}
      {isMap && lens === 'cves' && <CveCanvas entries={cveIndex || []} error={cveIndexError} year={cveYear} month={cveMonth} onYear={setCveYear} onMonth={setCveMonth} onCve={setSelectedCve} />}
      {['tl', 'tr', 'bl', 'br'].map((c) => <span key={c} className={`corner ${c}`} aria-hidden="true" />)}

      <TopBar
        data={data} sel={sel} lens={lens} setLens={changeLens} page={isMap ? 'map' : page}
        onHome={clear} onFind={() => isMap ? setSearching(true) : window.location.assign('/?search=1')} settings={settings} update={update}
        onCrumb={(patch) => setSel((s) => ({ ...s, ...patch }))}
      />

      {error && <div className="loading" role="alert">Data failed to load: {error}. Run node scripts/build-data.mjs first.</div>}
      {!data && !error && <div className="loading" role="status">Loading reports...</div>}
      {isMap && data && (
        <Landing
          data={data} away={open}
          onExplore={() => setSel({ ...NONE, classIdx: data.classes[0].index })}
          onSearch={() => setSearching(true)}
          onStat={(k) => (k === 'programs' ? changeLens('programs') : setSel({ ...NONE, classIdx: data.classes[0].index }))}
          onOpenTerminal={() => setPracticeTerminalOpen(true)}
        />
      )}
      {isMap && data && <SidePanel data={data} open={open} lens={lens} sel={sel} setSel={setSel} searching={searching} setSearching={setSearching} onClose={clear} kev={cveIndex || []} selectedCve={selectedCve} onSelectCve={setSelectedCve} programLetter={programLetter} onProgramLetterChange={setProgramLetter} />}
      {!isMap && data && <LibraryPages page={page} data={data} />}
      {practiceTerminalOpen && <PracticeTerminal onClose={() => setPracticeTerminalOpen(false)} />}
    </div>
  );
}
