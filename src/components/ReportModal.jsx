import { useEffect, useRef, useState } from 'react';
import { REPORT_URL } from '../data.js';

// Splits report text into plain paragraphs and ``` code blocks.
function Body({ text }) {
  const parts = text.split(/```/);
  return (
    <div className="rm-body">
      {parts.map((p, i) =>
        i % 2 ? (
          <pre key={i}><code>{p.replace(/^\w*\n/, '')}</code></pre>
        ) : (
          p.trim() && <p key={i}>{p.trim()}</p>
        )
      )}
    </div>
  );
}

const fmt = (d) => (d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '-');

// Opens when a report is clicked and runs the scraper (/api/report/:id) for it.
export default function ReportModal({ report, onClose }) {
  const [state, setState] = useState({ status: 'loading', data: null, error: '' });
  const ref = useRef(null);

  useEffect(() => {
    let live = true;
    setState({ status: 'loading', data: null, error: '' });
    fetch(`/api/report/${report.id}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
        return j;
      })
      .then((data) => live && setState({ status: 'done', data, error: '' }))
      .catch((e) => live && setState({ status: 'error', data: null, error: e.message }));
    return () => { live = false; };
  }, [report.id]);

  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [onClose]);

  const { status, data, error } = state;

  return (
    <div className="rm-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass rm" role="dialog" aria-modal="true" aria-label={`Report ${report.id}`} tabIndex={-1} ref={ref}>
        <div className="rm-head">
          <span className="chip">#{report.id}</span>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close report">&times;</button>
        </div>
        <h2 className="rm-title">{data?.title || report.title}</h2>
        <p className="muted">{report.program} &middot; {report.weakness}</p>

        {status === 'loading' && (
          <div className="rm-scan" role="status">
            <i className="scan-line" aria-hidden="true" />
            Running scraper on hackerone.com/reports/{report.id}...
          </div>
        )}

        {status === 'error' && (
          <div className="rm-error" role="alert">
            <p>Scraper could not fetch this report: {error}</p>
            <p className="muted small-text">The scraper needs the dev server (npm run dev) and an internet connection.</p>
          </div>
        )}

        {data && (
          <>
            <dl className="rm-meta">
              <div><dt>Status</dt><dd>{data.state}</dd></div>
              <div><dt>Severity</dt><dd className={`sev sev-${data.severity}`}>{data.severity}{data.score != null && ` ${data.score}`}</dd></div>
              <div><dt>Reporter</dt><dd>{data.reporter || '-'}</dd></div>
              <div><dt>Program</dt><dd>{data.team || '-'}</dd></div>
              <div><dt>Reported</dt><dd>{fmt(data.createdAt)}</dd></div>
              <div><dt>Disclosed</dt><dd>{fmt(data.disclosedAt)}</dd></div>
              <div><dt>Upvotes</dt><dd>{data.votes.toLocaleString()}</dd></div>
              <div><dt>Bounty</dt><dd>{report.bounty ? `$${report.bounty.toLocaleString()}` : data.hasBounty ? 'Paid' : 'None'}</dd></div>
              {data.asset && <div className="wide"><dt>Asset</dt><dd>{data.asset}</dd></div>}
              {data.cves.length > 0 && <div className="wide"><dt>CVE</dt><dd>{data.cves.join(', ')}</dd></div>}
            </dl>

            {data.body ? (
              <>
                <h3 className="rm-h">Report</h3>
                <Body text={data.body} />
              </>
            ) : (
              <p className="muted">The author did not publish the full text of this report.</p>
            )}

            {data.summaries.map((s, i) => (
              <div key={i} className="rm-summary">
                <h3 className="rm-h">{s.category === 'team' ? 'Program summary' : 'Researcher summary'}</h3>
                <Body text={s.content} />
              </div>
            ))}
          </>
        )}

        <div className="rm-foot">
          <a className="btn" href={REPORT_URL(report.id)} target="_blank" rel="noopener noreferrer">
            Open on HackerOne<span className="sr-only"> (new tab)</span> &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
