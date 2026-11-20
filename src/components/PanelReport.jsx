import { useEffect, useState } from 'react';
import { REPORT_URL } from '../data.js';

// Splits text into paragraphs and ``` code blocks. Text is rendered as plain text (never as HTML).
function Body({ text }) {
  return (
    <div className="body">
      {text.split(/```/).map((p, i) =>
        i % 2 ? <pre key={i}><code>{p.replace(/^\w*\n/, '')}</code></pre> : p.trim() && <p key={i}>{p.trim()}</p>
      )}
    </div>
  );
}

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-');

// One report. Runs the scraper (/api/report/:id) when opened.
export default function PanelReport({ report }) {
  const [st, setSt] = useState({ status: 'loading', data: null, error: '' });

  useEffect(() => {
    let live = true;
    setSt({ status: 'loading', data: null, error: '' });
    fetch(`/api/report/${report.id}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
        return j;
      })
      .then((data) => live && setSt({ status: 'done', data, error: '' }))
      .catch((e) => live && setSt({ status: 'error', data: null, error: e.message }));
    return () => { live = false; };
  }, [report.id]);

  const { status, data, error } = st;
  const facts = data && [
    ['Status', data.state], ['Severity', `${data.severity}${data.score != null ? ` ${data.score}` : ''}`],
    ['Reporter', data.reporter || '-'], ['Program', data.team || report.program],
    ['Reported', fmtDate(data.createdAt)], ['Disclosed', fmtDate(data.disclosedAt)],
    ['Upvotes', data.votes.toLocaleString('en-US')],
    ['Bounty', report.bounty ? `$${report.bounty.toLocaleString('en-US')}` : data.hasBounty ? 'paid' : 'none'],
    ...(data.asset ? [['Asset', data.asset]] : []),
    ...(data.cves.length ? [['CVE', data.cves.join(', ')]] : []),
  ];

  return (
    <>
      <p className="tag">REPORT / #{report.id}</p>
      <h2 className="small">{data?.title || report.title}</h2>
      <p className="dim lede">{report.program} / {report.weakness}</p>

      {status === 'loading' && <p className="dim note scan" role="status">Reading hackerone.com/reports/{report.id} ...</p>}
      {status === 'error' && (
        <p className="warn" role="alert">
          Could not fetch this report: {error}. The reader needs the dev server and an internet connection.
        </p>
      )}

      {facts && (
        <dl className="facts">
          {facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>
      )}
      {data && (data.body ? <Body text={data.body} /> : <p className="dim note">The author did not publish the full text of this report.</p>)}
      {data?.summaries.map((s, i) => (
        <div key={i}>
          <p className="tag">{s.category === 'team' ? 'PROGRAM SUMMARY' : 'RESEARCHER SUMMARY'}</p>
          <Body text={s.content} />
        </div>
      ))}

      <a className="key more" href={REPORT_URL(report.id)} target="_blank" rel="noopener noreferrer">
        Open on HackerOne<span className="sr-only"> (new tab)</span> &#8599;
      </a>
    </>
  );
}
