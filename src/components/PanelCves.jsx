import { useState } from 'react';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-');

// CVE lookup against NIST NVD through /api/cve/:id. Only what NVD returns is shown.
export default function PanelCves() {
  const [q, setQ] = useState('');
  const [st, setSt] = useState({ status: 'idle', data: null, error: '' });

  const run = (e) => {
    e.preventDefault();
    const id = q.trim().toUpperCase();
    if (!/^CVE-\d{4}-\d{4,7}$/.test(id)) {
      setSt({ status: 'error', data: null, error: 'Enter an id like CVE-2021-44228.' });
      return;
    }
    setSt({ status: 'loading', data: null, error: '' });
    fetch(`/api/cve/${id}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
        return j;
      })
      .then((data) => setSt({ status: 'done', data, error: '' }))
      .catch((err) => setSt({ status: 'error', data: null, error: err.message }));
  };

  const { status, data, error } = st;
  return (
    <>
      <p className="tag">INDEX / CVES</p>
      <h2>CVE lookup</h2>
      <p className="dim lede">Look up any CVE in the NIST National Vulnerability Database.</p>
      <form onSubmit={run} role="search">
        <input className="field" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="CVE-2021-44228" aria-label="CVE id" />
      </form>

      {status === 'loading' && <p className="dim note scan" role="status">Asking NVD ...</p>}
      {status === 'error' && <p className="warn" role="alert">{error}</p>}
      {data && (
        <>
          <hr className="rule" />
          <h2 className="small">{data.id}</h2>
          <dl className="facts">
            <div><dt>CVSS</dt><dd>{data.cvss ? `${data.cvss.score} ${data.cvss.severity || ''}` : 'unknown'}</dd></div>
            <div><dt>Published</dt><dd>{fmtDate(data.published)}</dd></div>
            <div><dt>Weakness</dt><dd>{data.cwes.map((c) => c.id).join(', ') || 'unknown'}</dd></div>
            <div><dt>CISA KEV</dt><dd>{data.kev ? `since ${data.kev.added}` : 'not listed'}</dd></div>
          </dl>
          <div className="body"><p>{data.description}</p></div>
          {data.exploits.length > 0 && (
            <>
              <p className="tag">EXPLOIT REFERENCES (AS TAGGED BY NVD)</p>
              <ul className="plain">
                {data.exploits.map((x) => <li key={x.url}><a className="link" href={x.url} target="_blank" rel="noopener noreferrer">{x.url}</a></li>)}
              </ul>
            </>
          )}
          <a className="key more" href={data.evidenceUrl} target="_blank" rel="noopener noreferrer">NVD record &#8599;</a>
        </>
      )}
    </>
  );
}
