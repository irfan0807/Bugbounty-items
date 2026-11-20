import { useMemo } from 'react';
import PanelClass from './PanelClass.jsx';
import PanelPrograms from './PanelPrograms.jsx';
import PanelSearch from './PanelSearch.jsx';
import PanelReport from './PanelReport.jsx';
import PanelCves from './PanelCves.jsx';
import ReportList from './ReportList.jsx';
import ContextualTutor from './ContextualTutor.jsx';

// Slide-in panel on the right. Chooses a view from the current selection.
export default function SidePanel({ data, open, lens, sel, setSel, searching, setSearching, onClose, kev = [], selectedCve = '', onSelectCve = () => {}, programLetter = '', onProgramLetterChange = () => {} }) {
  const cls = sel.classIdx != null ? data.classes.find((c) => c.index === sel.classIdx) : null;
  const weak = cls && sel.weaknessIdx != null ? cls.weaknesses.find((w) => w.index === sel.weaknessIdx) : null;
  const program = sel.programIdx != null ? data.programs.find((p) => p.index === sel.programIdx) : null;
  const report = sel.reportId != null ? data.reports.find((r) => r.id === sel.reportId) : null;

  const reports = useMemo(() => {
    if (weak) return data.reports.filter((r) => r.classIdx === cls.index && r.weaknessIdx === weak.index);
    if (cls) return data.reports.filter((r) => r.classIdx === cls.index);
    if (program) return data.reports.filter((r) => r.programIdx === program.index && (sel.programClassIdx == null || r.classIdx === sel.programClassIdx) && (sel.programWeaknessIdx == null || r.weaknessIdx === sel.programWeaknessIdx));
    return [];
  }, [data, cls, weak, program, sel.programClassIdx, sel.programWeaknessIdx]);
  const programClasses = useMemo(() => {
    if (!program) return [];
    const counts = new Map();
    for (const r of data.reports) if (r.programIdx === program.index) counts.set(r.classIdx, (counts.get(r.classIdx) || 0) + 1);
    return [...counts].map(([index, count]) => ({ cls: data.classes.find((c) => c.index === index), count })).filter((x) => x.cls).sort((a, b) => b.count - a.count);
  }, [data, program]);
  const programWeaknesses = useMemo(() => {
    if (!program || sel.programClassIdx == null) return [];
    const counts = new Map();
    for (const r of data.reports) if (r.programIdx === program.index && r.classIdx === sel.programClassIdx) counts.set(r.weaknessIdx, (counts.get(r.weaknessIdx) || 0) + 1);
    return [...counts].map(([index, count]) => ({ index, name: data.reports.find((r) => r.weaknessIdx === index)?.weakness || 'Unspecified', count })).sort((a, b) => b.count - a.count);
  }, [data, program, sel.programClassIdx]);

  const openReport = (id) => setSel((s) => ({ ...s, reportId: id }));
  const back = () => setSel((s) => ({ ...s, reportId: null }));

  let body = null;
  if (report) {
    body = (
      <>
        <button type="button" className="key back" onClick={back}>&larr; Back</button>
        <PanelReport report={report} />
      </>
    );
  } else if (searching) {
    body = <PanelSearch data={data} onOpen={openReport} />;
  } else if (lens === 'programs' && !program) {
    body = <PanelPrograms data={data} selectedLetter={programLetter} onLetterChange={onProgramLetterChange} onPick={(i) => setSel({ classIdx: null, weaknessIdx: null, programIdx: i, programClassIdx: null, programWeaknessIdx: null, reportId: null })} />;
  } else if (lens === 'cves') {
    const recent = [...kev].sort((a, b) => b.dateAdded.localeCompare(a.dateAdded)).slice(0, 40);
    body = (
      <>
        <p className="tag">INDEX / CVES</p>
        <h2>CVE library</h2>
        <p className="dim lede">{kev.length.toLocaleString('en-US')} known exploited CVEs from the CISA catalog. Select a record or look up any CVE in NVD.</p>
        <PanelCves initialQuery={selectedCve} />
        <hr className="rule" />
        <p className="tag">RECENTLY ADDED TO CISA KEV</p>
        <ul className="rows">{recent.map((c) => <li key={c.cveID}><button type="button" className="row" onClick={() => onSelectCve(c.cveID)}><span className="row-title">{c.vulnerabilityName}</span><span className="row-meta"><span>{c.cveID}</span><span>added {c.dateAdded}</span></span></button></li>)}</ul>
        {!kev.length && <p className="dim note">The CISA catalog is unavailable. CVE lookups still work when NVD is reachable.</p>}
      </>
    );
  } else if (program) {
    body = (
      <>
        {sel.programClassIdx != null && <button type="button" className="key back" onClick={() => setSel((s) => ({ ...s, programClassIdx: null, programWeaknessIdx: null }))}>&larr; {program.name}</button>}
        <p className="tag">{sel.programClassIdx == null ? 'PROGRAM' : 'PROGRAM / CLASS'}</p>
        <h2>{program.name}</h2>
        <p className="dim lede">
          {program.count.toLocaleString('en-US')} reports
          {program.bounty > 0 && <> / <span className="hot">${program.bounty.toLocaleString('en-US')}</span> in bounties</>}
        </p>
        <ContextualTutor subject={`Bug bounty program: ${program.name}`} context={`Publicly indexed report count: ${program.count}\nAggregate bounty shown by the dataset: $${program.bounty.toLocaleString('en-US')}\nCommon vulnerability classes in this program: ${programClasses.slice(0, 12).map(({ cls: c, count }) => `${c.name} (${count} reports)`).join('; ')}\nExplain how to interpret these public report patterns for authorized security learning. Avoid suggesting testing targets without explicit authorization.`} />
        <hr className="rule" />
        {sel.programClassIdx == null ? (
          <>
            <p className="tag">REPORTS BY VULNERABILITY CLASS</p>
            <ul className="rows program-class-list">{programClasses.map(({ cls: c, count }) => <li key={c.index}><button type="button" className="row" onClick={() => setSel((s) => ({ ...s, programClassIdx: c.index, programWeaknessIdx: null }))}><span className="row-title">{c.name}</span><span className="meter" aria-hidden="true"><i style={{ width: `${(count / (programClasses[0]?.count || 1)) * 100}%` }} /></span><span className="row-meta">{count.toLocaleString('en-US')} reports</span></button></li>)}</ul>
          </>
        ) : (
          <>
            <h3 className="panel-subhead">{data.classes.find((c) => c.index === sel.programClassIdx)?.name}</h3>
            <div className="alpha program-weaknesses"><button type="button" aria-pressed={sel.programWeaknessIdx == null} onClick={() => setSel((s) => ({ ...s, programWeaknessIdx: null }))}>All weaknesses</button>{programWeaknesses.slice(0, 18).map((w) => <button type="button" key={w.index} aria-pressed={sel.programWeaknessIdx === w.index} onClick={() => setSel((s) => ({ ...s, programWeaknessIdx: w.index }))}>{w.name} · {w.count}</button>)}</div>
            <ReportList reports={reports} onOpen={openReport} />
          </>
        )}
      </>
    );
  } else if (weak) {
    body = (
      <>
        <button type="button" className="key back" onClick={() => setSel((s) => ({ ...s, weaknessIdx: null }))}>&larr; {cls.name}</button>
        <p className="tag">WEAKNESS</p>
        <h2 className="small">{weak.name}</h2>
        <hr className="rule" />
        <ReportList reports={reports} onOpen={openReport} />
      </>
    );
  } else if (cls) {
    body = (
      <PanelClass
        data={data} cls={cls}
        onWeakness={(i) => setSel((s) => ({ ...s, weaknessIdx: i }))}
        onAll={() => setSel((s) => ({ ...s, weaknessIdx: -1 }))}
      />
    );
  }

  // weaknessIdx -1 = "all reports of this class" view
  if (cls && sel.weaknessIdx === -1 && !report && !searching) {
    body = (
      <>
        <button type="button" className="key back" onClick={() => setSel((s) => ({ ...s, weaknessIdx: null }))}>&larr; {cls.name}</button>
        <p className="tag">CLASS / {cls.short}</p>
        <h2 className="small">All {cls.name} reports</h2>
        <hr className="rule" />
        <ReportList reports={reports} onOpen={openReport} />
      </>
    );
  }

  return (
    <aside id="panel" className={open ? 'panel open' : 'panel'} aria-label="Details" aria-hidden={!open}>
      <button type="button" className="key close" tabIndex={open ? 0 : -1} onClick={() => { setSearching(false); onClose(); }}>Close <kbd>Esc</kbd></button>
      {body}
    </aside>
  );
}
