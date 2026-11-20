import { useEffect, useMemo, useState } from 'react';
import { CLASS_GUIDES, weaknessNotes } from '../learningContent.js';
import WeaknessDetailModal from './WeaknessDetailModal.jsx';
import ContextualTutor from './ContextualTutor.jsx';

const fmt = (n) => n.toLocaleString('en-US');

export default function LearningLibrary({ data }) {
  const params = new URLSearchParams(window.location.search);
  const firstClass = data.classes.find((c) => c.id === params.get('class')) || data.classes[0];
  const [classIdx, setClassIdx] = useState(firstClass?.index ?? null);
  const [weaknessIdx, setWeaknessIdx] = useState(params.has('w') ? Number(params.get('w')) : null);
  const [modalOpen, setModalOpen] = useState(params.has('w'));
  const [query, setQuery] = useState('');
  const [catalogMode, setCatalogMode] = useState(params.get('catalog') === 'cwe');
  const [cweItems, setCweItems] = useState([]);
  const [selectedCweId, setSelectedCweId] = useState(params.get('cwe') || '5');
  const [catalogLimit, setCatalogLimit] = useState(80);
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}cwe-catalog.json`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('CWE catalog unavailable')))
      .then(setCweItems)
      .catch(() => setCweItems([]));
  }, []);
  const activeClass = data.classes.find((c) => c.index === classIdx) || data.classes[0];
  const guide = CLASS_GUIDES[activeClass.id] || CLASS_GUIDES.other;
  const activeWeakness = activeClass.weaknesses.find((w) => w.index === weaknessIdx) || null;
  const needle = query.trim().toLowerCase();
  const filteredCweItems = useMemo(() => cweItems.filter((entry) => !needle || `${entry.id} ${entry.name} ${entry.abstraction} ${entry.status} ${entry.description} ${entry.extendedDescription}`.toLowerCase().includes(needle)), [cweItems, needle]);
  const selectedCwe = cweItems.find((entry) => entry.id === selectedCweId) || filteredCweItems[0] || cweItems[0];

  const filteredClasses = useMemo(() => data.classes.filter((c) => !needle || `${c.name} ${c.short} ${c.id}`.toLowerCase().includes(needle) || c.weaknesses.some((w) => w.name.toLowerCase().includes(needle))), [data, needle]);
  const searchResults = useMemo(() => {
    if (!needle) return [];
    return data.classes.flatMap((c) => c.weaknesses
      .filter((w) => `${c.name} ${c.short} ${c.id} ${w.name}`.toLowerCase().includes(needle))
      .map((w) => ({ cls: c, weakness: w }))
    ).slice(0, 80);
  }, [data, needle]);
  const reportExamples = useMemo(() => {
    if (!activeClass) return [];
    return data.reports.filter((r) => r.classIdx === activeClass.index && (!activeWeakness || r.weaknessIdx === activeWeakness.index))
      .sort((a, b) => b.upvotes - a.upvotes).slice(0, 6);
  }, [data, activeClass, activeWeakness]);

  const selectClass = (c) => { setClassIdx(c.index); setWeaknessIdx(null); setModalOpen(false); setQuery(''); };
  const selectWeakness = (c, w) => { setClassIdx(c.index); setWeaknessIdx(w.index); setModalOpen(true); setQuery(''); };
  const changeCatalogMode = (nextMode) => { setCatalogMode(nextMode); setModalOpen(false); setQuery(''); setCatalogLimit(80); };
  const selectModalWeakness = (w) => setWeaknessIdx(w.index);
  const closeWeaknessModal = () => setModalOpen(false);
  const formatCatalogText = (value = '') => value.replace(/::/g, '\n\n').replace(/:(?=(?:SCOPE|IMPACT|NOTE|PHASE|DESCRIPTION|STRATEGY|EFFECTIVENESS|DETECTION|METHOD|ORDINAL|NATURE|CWE ID|VIEW ID):)/g, '\n');

  return (
    <div className="learn-page">
      <header className="learn-hero">
        <div className="learn-orbit-mark" aria-hidden="true"><span /><span /><span /><i /></div>
        <p className="tag">LEARNING / VULNERABILITY HANDBOOK</p>
        <h1>Understand the flaw.<br /><em>Learn how to prevent it.</em></h1>
        <p className="learn-lede">Study practical report lessons or explore the complete MITRE Common Weakness Enumeration: how weaknesses develop, their effects, and ways to prevent them.</p>
        <div className="learn-totals"><span>{fmt(data.classes.length)} classes</span><span>{fmt(data.classes.reduce((n, c) => n + c.weaknesses.length, 0))} report labels</span><span>{cweItems.length ? fmt(cweItems.length) : '…'} MITRE CWE entries</span></div>
      </header>

      <div className="learn-mode-switch" role="tablist" aria-label="Learning library">
        <button type="button" role="tab" aria-selected={!catalogMode} className={!catalogMode ? 'active' : ''} onClick={() => changeCatalogMode(false)}>Report lessons <span>{fmt(data.classes.reduce((n, c) => n + c.weaknesses.length, 0))}</span></button>
        <button type="button" role="tab" aria-selected={catalogMode} className={catalogMode ? 'active' : ''} onClick={() => changeCatalogMode(true)}>Full CWE catalog <span>{cweItems.length ? fmt(cweItems.length) : '…'}</span></button>
      </div>
      <div className="learn-search-wrap"><label className="sr-only" htmlFor="learn-search">Search the learning library</label><input id="learn-search" className="field learn-search" type="search" value={query} onChange={(e) => { setQuery(e.target.value); setCatalogLimit(80); }} placeholder={catalogMode ? 'Search CWE ID, name, description, or class…' : 'Search XSS, IDOR, race conditions, or any weakness…'} /><span className="learn-shortcut">{catalogMode ? `${fmt(filteredCweItems.length)} CWE ENTRIES` : 'REPORT TAXONOMY'}</span></div>

      {catalogMode ? (
        <div className="learn-layout learn-catalog-layout">
          <aside className="learn-sidebar learn-cwe-sidebar" aria-label="MITRE CWE entries">
            <p className="tag">MITRE CWE / {fmt(filteredCweItems.length)} MATCHES</p>
            <nav className="learn-cwe-list">
              {filteredCweItems.slice(0, catalogLimit).map((entry) => <button type="button" key={entry.id} className={entry.id === selectedCwe?.id ? 'active' : ''} onClick={() => setSelectedCweId(entry.id)}><span><b>CWE-{entry.id}</b>{entry.name}</span><small>{entry.abstraction}</small></button>)}
              {!filteredCweItems.length && <p className="dim note">{cweItems.length ? 'No CWE entries match this search.' : 'Loading the MITRE catalog…'}</p>}
              {filteredCweItems.length > catalogLimit && <button type="button" className="learn-show-more" onClick={() => setCatalogLimit((limit) => limit + 80)}>Show 80 more · {fmt(filteredCweItems.length - catalogLimit)} remaining</button>}
            </nav>
          </aside>
          <article className="learn-content learn-cwe-article">
            {selectedCwe ? <>
              <header className="learn-article-head"><p className="tag">MITRE CWE-{selectedCwe.id} / {selectedCwe.abstraction.toUpperCase()} / {selectedCwe.status.toUpperCase()}</p><h2>{selectedCwe.name}</h2><p className="learn-summary">{selectedCwe.description}</p>{selectedCwe.extendedDescription && <p className="learn-summary">{selectedCwe.extendedDescription}</p>}<div className="learn-meta"><span>MITRE CWE version 5.0</span><a href={`https://cwe.mitre.org/data/definitions/${selectedCwe.id}.html`} target="_blank" rel="noreferrer">Open MITRE entry ↗</a></div><ContextualTutor subject={`MITRE CWE-${selectedCwe.id}: ${selectedCwe.name}`} context={`Abstraction: ${selectedCwe.abstraction}\nStatus: ${selectedCwe.status}\nDescription: ${selectedCwe.description}\nExtended description: ${selectedCwe.extendedDescription}\nPotential mitigations: ${selectedCwe.mitigations}\nCommon consequences: ${selectedCwe.consequences}`} /></header>
              <div className="learn-article-body learn-cwe-body">
                {selectedCwe.consequences && <section><h3>Common consequences</h3><p className="learn-cwe-source-text">{formatCatalogText(selectedCwe.consequences)}</p></section>}
                {selectedCwe.mitigations && <section><h3>Potential mitigations</h3><p className="learn-cwe-source-text">{formatCatalogText(selectedCwe.mitigations)}</p></section>}
                {selectedCwe.detectionMethods && <section><h3>Detection methods</h3><p className="learn-cwe-source-text">{formatCatalogText(selectedCwe.detectionMethods)}</p></section>}
                {selectedCwe.introduction && <section><h3>Modes of introduction</h3><p className="learn-cwe-source-text">{formatCatalogText(selectedCwe.introduction)}</p></section>}
                {selectedCwe.relatedWeaknesses && <section><h3>Related weaknesses</h3><p className="learn-cwe-source-text">{formatCatalogText(selectedCwe.relatedWeaknesses)}</p></section>}
              </div>
              <p className="dim note learn-source-note">Descriptions and guidance are from MITRE’s CWE catalog. CWE documents software and hardware weaknesses; CVEs identify specific disclosed vulnerabilities.</p>
            </> : <p className="dim">Loading the MITRE CWE catalog…</p>}
          </article>
        </div>
      ) : <div className="learn-layout">
        <aside className="learn-sidebar" aria-label="Vulnerability classes">
          <p className="tag">CHOOSE A CLASS</p>
          <nav className="learn-class-list">
            {filteredClasses.map((c) => (
              <button type="button" key={c.index} className={c.index === activeClass.index ? 'active' : ''} onClick={() => selectClass(c)}>
                <span><i>{c.short}</i>{c.name}</span><b>{c.weaknesses.length}</b>
              </button>
            ))}
            {!filteredClasses.length && <p className="dim note">No class matches.</p>}
          </nav>
        </aside>

        <section className="learn-content" id="learn-content">
          {needle ? (
            <section className="learn-results" aria-live="polite">
              <p className="tag">SEARCH RESULTS / {searchResults.length}{searchResults.length === 80 ? '+' : ''}</p>
              <h2>Weaknesses matching “{query.trim()}”</h2>
              <ul>{searchResults.map(({ cls, weakness }) => <li key={`${cls.index}-${weakness.index}`}><button type="button" onClick={() => selectWeakness(cls, weakness)}><span><b>{weakness.name}</b><small>{cls.name}</small></span><span>{fmt(weakness.count)} reports ↗</span></button></li>)}</ul>
              {!searchResults.length && <p className="dim">Try a class name, a weakness label, or a familiar term such as “XSS”.</p>}
            </section>
          ) : (
            <>
              <div className="learn-article-head">
                <p className="tag">{activeWeakness ? `WEAKNESS / ${activeClass.short}` : `CLASS / ${activeClass.short}`}</p>
                <h2>{activeWeakness?.name || guide.title}</h2>
                <p className="learn-summary">{guide.summary}</p>
                <div className="learn-meta"><span>{fmt(activeWeakness?.count || activeClass.count)} related reports</span><span>{activeClass.weaknesses.length} labels in this class</span></div>
              </div>

              {!activeWeakness && <ContextualTutor subject={`${activeClass.name}: ${guide.title}`} context={`Summary: ${guide.summary}\nHow it develops: ${guide.develops}\nRisk conditions: ${guide.conditions.join('; ')}\nPrevention: ${guide.prevent.join('; ')}`} />}

              {activeWeakness ? (
                <div className="learn-article-body">
                  <section><h3>How this weakness develops</h3><p>{guide.develops}</p><p>{weaknessNotes(activeWeakness.name, activeClass.id)}</p></section>
                  <section><h3>Conditions that make it possible</h3><ul>{guide.conditions.map((x) => <li key={x}>{x}</li>)}</ul></section>
                  <section><h3>Potential impact</h3><p>{guide.impact}</p></section>
                  <section><h3>How to review it safely</h3><ul>{guide.verify.map((x) => <li key={x}>{x}</li>)}</ul></section>
                  <section><h3>Prevention and repair</h3><ul>{guide.prevent.map((x) => <li key={x}>{x}</li>)}</ul></section>
                </div>
              ) : (
                <div className="learn-article-body">
                  <section><h3>How the flaw develops</h3><p>{guide.develops}</p></section>
                  <section><h3>When risk exists</h3><ul>{guide.conditions.map((x) => <li key={x}>{x}</li>)}</ul></section>
                  <section><h3>Potential impact</h3><p>{guide.impact}</p></section>
                  <section><h3>Safe review workflow</h3><ul>{guide.verify.map((x) => <li key={x}>{x}</li>)}</ul></section>
                  <section><h3>Prevention and repair</h3><ul>{guide.prevent.map((x) => <li key={x}>{x}</li>)}</ul></section>
                </div>
              )}

              <section className="learn-weaknesses">
                <div className="learn-section-heading"><div><p className="tag">IN THIS CLASS</p><h3>Weakness types</h3></div><span>{activeClass.weaknesses.length} entries</span></div>
                <div className="learn-weakness-grid">
                  {activeClass.weaknesses.map((w) => <button type="button" key={w.index} className={`learn-weakness-card${w.index === activeWeakness?.index ? ' active' : ''}`} aria-haspopup="dialog" aria-label={`Open detailed lesson for ${w.name}, ${fmt(w.count)} reports`} onClick={() => { setWeaknessIdx(w.index); setModalOpen(true); }}><span>{w.name}</span><small>{fmt(w.count)} reports</small><i>Open detailed lesson ↗</i></button>)}
                </div>
              </section>

              <section className="learn-examples">
                <div className="learn-section-heading"><div><p className="tag">FROM THE REPORT COLLECTION</p><h3>Read real disclosures</h3></div><span>{fmt(activeWeakness?.count || activeClass.count)} matches</span></div>
                <ul>{reportExamples.map((r) => <li key={r.id}><a href={`https://hackerone.com/reports/${r.id}`} target="_blank" rel="noreferrer"><span><b>{r.title || 'Untitled report'}</b><small>{r.program} · {r.weakness}</small></span><i>Read report ↗</i></a></li>)}</ul>
                {!reportExamples.length && <p className="dim">No matching reports are in the local collection.</p>}
              </section>

              <section className="learn-references">
                <p className="tag">FURTHER READING</p>
                <div>{guide.refs.map(([label, href]) => <a key={href} href={href} target="_blank" rel="noreferrer">{label} ↗</a>)}</div>
                <p className="dim note">This handbook summarizes defensive learning guidance. Follow source references for current testing procedures and technical detail.</p>
              </section>
            </>
          )}
        </section>
      </div>}
      <footer className="learn-footer">The report lessons are based on the vulnerability labels in this app’s collection. The full index includes all 956 weaknesses in MITRE CWE version 5.0; the catalog is maintained and changes over time. Always test only systems you are authorized to assess.</footer>
      {modalOpen && activeWeakness && !catalogMode && <WeaknessDetailModal activeClass={activeClass} weakness={activeWeakness} guide={guide} siblings={activeClass.weaknesses} reports={reportExamples} onSelect={selectModalWeakness} onClose={closeWeaknessModal} />}
    </div>
  );
}
