import { useMemo } from 'react';
import PanelClass from './PanelClass.jsx';
import PanelPrograms from './PanelPrograms.jsx';
import PanelSearch from './PanelSearch.jsx';
import PanelReport from './PanelReport.jsx';
import PanelCves from './PanelCves.jsx';
import ReportList from './ReportList.jsx';

// Slide-in panel on the right. Chooses a view from the current selection.
export default function SidePanel({ data, open, lens, sel, setSel, searching, setSearching, onClose }) {
  const cls = sel.classIdx != null ? data.classes.find((c) => c.index === sel.classIdx) : null;
  const weak = cls && sel.weaknessIdx != null ? cls.weaknesses.find((w) => w.index === sel.weaknessIdx) : null;
  const program = sel.programIdx != null ? data.programs.find((p) => p.index === sel.programIdx) : null;
  const report = sel.reportId != null ? data.reports.find((r) => r.id === sel.reportId) : null;

  const reports = useMemo(() => {
    if (weak) return data.reports.filter((r) => r.classIdx === cls.index && r.weaknessIdx === weak.index);
    if (cls) return data.reports.filter((r) => r.classIdx === cls.index);
    if (program) return data.reports.filter((r) => r.programIdx === program.index);
    return [];
  }, [data, cls, weak, program]);

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
    body = <PanelPrograms data={data} onPick={(i) => setSel({ classIdx: null, weaknessIdx: null, programIdx: i, reportId: null })} />;
  } else if (lens === 'cves') {
    body = <PanelCves />;
  } else if (program) {
    body = (
      <>
        <p className="tag">PROGRAM</p>
        <h2>{program.name}</h2>
        <p className="dim lede">
          {program.count.toLocaleString('en-US')} reports
          {program.bounty > 0 && <> / <span className="hot">${program.bounty.toLocaleString('en-US')}</span> in bounties</>}
        </p>
        <hr className="rule" />
        <ReportList reports={reports} onOpen={openReport} />
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
