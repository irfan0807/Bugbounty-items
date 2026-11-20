import { useEffect, useMemo, useState } from 'react';
import PanelCves from './PanelCves.jsx';
import PanelReport from './PanelReport.jsx';
import CveCanvas from './CveCanvas.jsx';
import LearningLibrary from './LearningLibrary.jsx';

const BYPASS_GROUPS = [
  ['Login and identity checks', 'Authentication, SSO, session and password-reset checks', /login|auth|account takeover|password reset|session|identity|sso|oauth|credential/i],
  ['Authorisation and access checks', 'Permission, role, ownership and paywall checks', /authori[sz]|access control|idor|privilege|permission|role|ownership|paywall|unauthori[sz]/i],
  ['Other protections', 'Bypasses of checks that do not fit another group', /bypass|circumvent|restriction|protection|verification/i],
  ['Earlier fixes', 'Reports that got past a fix for an earlier report', /fix bypass|patch bypass|regression|re-introduced|reintroduced/i],
  ['Input filters and sanitisers', 'Blocklists, HTML sanitisers, escaping and tag or attribute stripping', /filter|saniti[sz]|escape|blocklist|script|html|tag stripping/i],
  ['Two-factor and verification codes', '2FA, OTP and code checks that can be skipped, reused or guessed', /2fa|mfa|otp|one.time|verification code|two.factor/i],
  ['SSRF protections', 'Host allow-lists, internal-address blocks, redirect and DNS checks', /ssrf|server.side request forgery|internal address|host allow/i],
  ['Web application firewalls', 'Cloudflare, Akamai, ModSecurity and other request filters', /waf|cloudflare|akamai|modsecurity|firewall/i],
  ['Rate limits and lockouts', 'Throttling, attempt limits, lockouts and CAPTCHA', /rate.limit|lockout|throttl|captcha|brute.force/i],
  ['Content Security Policy', 'Script and resource policies, nonces and allow-listed hosts', /content.security.policy|\bcsp\b|nonce|script-src/i],
  ['CSRF protections', 'Tokens, SameSite cookies, and Origin or Referer checks', /csrf|cross.site request forgery|samesite|referer|origin header/i],
  ['Same-origin and CORS rules', 'Origin allow-lists, CORS headers and same-origin policy gaps', /cors|cross.origin|same.origin|origin allow/i],
  ['Path and encoding checks', 'Path normalisation, traversal filters and encoding tricks', /path traversal|encoding|normalis|normaliz|double.decode/i],
  ['Email and phone verification', 'Confirming an address or number before it is trusted', /email verification|phone verification|verify email|verify phone/i],
  ['URL and redirect validation', 'redirect_uri checks, host validation and URL parser differences', /redirect|open redirect|url validation|host validation/i],
  ['File upload checks', 'Extension, content-type and file-content validation', /file upload|content.type|extension check|mime.type/i],
  ['Sandboxes and execution limits', 'Iframe sandboxes, restricted interpreters, jails and disabled functions', /sandbox|jail|disabled function|execution limit|iframe/i],
  ['Token and signature checks', 'JWT, HMAC, signature and API token validation', /jwt|json web token|hmac|signature|api token/i],
];

const TOPICS = [
  ['API Key Leaks', 'Finding exposed credentials in client bundles, repositories and responses.', 'API Key Leaks'],
  ['Account Takeover', 'Common account recovery, identity and session weaknesses.', 'Account Takeover'],
  ['Brute Force Rate Limit', 'Assessing attempt limits and throttling with controlled requests.', 'Brute Force'],
  ['Business Logic Errors', 'Testing workflows, pricing, state changes and transaction assumptions.', 'Business Logic'],
  ['CORS Misconfiguration', 'Origin handling and cross-origin access checks.', 'CORS Misconfiguration'],
  ['CRLF Injection', 'Carriage return and line feed handling in headers and protocol messages.', 'CRLF Injection'],
  ['CSS Injection', 'Reviewing attacker-controlled styles and their security impact.', 'CSS Injection'],
  ['CSV Injection', 'Spreadsheet formula handling in exported files.', 'CSV Injection'],
  ['CVE Exploits', 'Reference material for known vulnerability checks and advisories.', 'CVE Exploits'],
  ['Clickjacking', 'Frame embedding protections and UI redress testing.', 'Clickjacking'],
  ['Client Side Path Traversal', 'Client-side path resolution and route handling.', 'Client Side Path Traversal'],
  ['Command Injection', 'Safe assessment patterns for command construction and input handling.', 'Command Injection'],
  ['Cross-Site Request Forgery', 'Request origin, token and cookie protections.', 'Cross-Site Request Forgery'],
  ['DNS Rebinding', 'DNS resolution changes and trust boundaries in network clients.', 'DNS Rebinding'],
  ['DOM Clobbering', 'HTML name and id collisions that affect browser-side code.', 'DOM Clobbering'],
  ['Denial of Service', 'Resource limits and availability safeguards.', 'Denial of Service'],
  ['Dependency Confusion', 'Package namespace and dependency source validation.', 'Dependency Confusion'],
  ['Directory Traversal', 'Path handling and file access checks.', 'Directory Traversal'],
  ['Encoding Transformations', 'How parsers and filters handle alternate encodings.', 'Encoding Transformations'],
  ['External Variable Modification', 'Unexpected changes to environment and runtime variables.', 'External Variable Modification'],
  ['File Inclusion', 'Server-side include and file resolution behavior.', 'File Inclusion'],
  ['Google Web Toolkit', 'Security review notes for applications built with GWT.', 'Google Web Toolkit'],
  ['GraphQL Injection', 'Schema discovery, authorization and query handling.', 'GraphQL Injection'],
  ['HTTP Parameter Pollution', 'Duplicate parameter handling across proxies and applications.', 'HTTP Parameter Pollution'],
  ['Headless Browser', 'Browser automation boundaries and unsafe page processing.', 'Headless Browser'],
  ['Hidden Parameters', 'Discovering and validating undocumented request parameters.', 'Hidden Parameters'],
  ['Insecure Deserialization', 'Reviewing serialized input and object reconstruction.', 'Insecure Deserialization'],
  ['Insecure Direct Object References', 'Object-level authorization checks across user and tenant boundaries.', 'Insecure Direct Object References'],
  ['Insecure Management Interface', 'Access and exposure checks for administration interfaces.', 'Insecure Management Interface'],
  ['Insecure Randomness', 'Reviewing security-sensitive random number generation.', 'Insecure Randomness'],
  ['Insecure Source Code Management', 'Repository exposure, access control and secret handling.', 'Insecure Source Code Management'],
  ['JSON Web Token', 'Token validation, algorithm and claim handling.', 'JSON Web Token'],
  ['Java RMI', 'Remote method invocation exposure and access controls.', 'Java RMI'],
  ['LDAP Injection', 'Directory query construction and input handling.', 'LDAP Injection'],
  ['LaTeX Injection', 'Untrusted input handling in document compilation.', 'LaTeX Injection'],
  ['Mass Assignment', 'Unexpected writable fields in object binding and API updates.', 'Mass Assignment'],
  ['Methodology and Resources', 'General testing workflows and curated learning references.', 'Methodology and Resources'],
  ['NoSQL Injection', 'Query construction and type handling in NoSQL databases.', 'NoSQL Injection'],
  ['OAuth Misconfiguration', 'OAuth redirect, scope and client configuration review.', 'OAuth Misconfiguration'],
  ['ORM Leak', 'Data exposure and query behavior through object-relational layers.', 'ORM Leak'],
  ['Open Redirect', 'Redirect destination validation and parser differences.', 'Open Redirect'],
  ['Prompt Injection', 'Trust boundaries for instructions and retrieved content in AI systems.', 'Prompt Injection'],
  ['Prototype Pollution', 'JavaScript object merge and property assignment behavior.', 'Prototype Pollution'],
  ['Race Condition', 'Concurrent requests and time-of-check/time-of-use behavior.', 'Race Condition'],
  ['Regular Expression', 'Regular expression denial-of-service and input validation concerns.', 'Regular Expression'],
  ['Reverse Proxy Misconfigurations', 'Trust boundaries and request interpretation across proxy layers.', 'Reverse Proxy Misconfigurations'],
  ['Request Smuggling', 'Differences in HTTP message framing between intermediaries.', 'Request Smuggling'],
  ['SAML Injection', 'SAML message validation, signature and identity mapping.', 'SAML Injection'],
  ['Server Side Include Injection', 'SSI parsing and untrusted template fragments.', 'Server Side Include Injection'],
  ['SQL Injection', 'Parameterized query review and database input handling.', 'SQL Injection'],
  ['Server Side Request Forgery', 'Outbound request controls, DNS resolution and redirect handling.', 'Server Side Request Forgery'],
  ['Server Side Template Injection', 'Template contexts, expression evaluation and safe rendering.', 'Server Side Template Injection'],
  ['Tabnabbing', 'Safe handling of links that open new browser tabs.', 'Tabnabbing'],
  ['Type Juggling', 'Implicit type conversion and comparison behavior.', 'Type Juggling'],
  ['Upload Insecure Files', 'Upload validation, storage paths and content processing.', 'Upload Insecure Files'],
  ['Virtual Hosts', 'Host header routing and virtual host configuration.', 'Virtual Hosts'],
  ['Web Cache Deception', 'Cache key behavior and discrepancies between routes and resources.', 'Web Cache Deception'],
  ['Web Sockets', 'Handshake authorization and message-level access controls.', 'Web Sockets'],
  ['XPATH Injection', 'XPath query construction and XML data access.', 'XPATH Injection'],
  ['XS-Leak', 'Cross-site side channels and browser observable behavior.', 'XS-Leak'],
  ['XSLT Injection', 'Stylesheet processing and untrusted XML transformations.', 'XSLT Injection'],
  ['XSS Injection', 'Context-aware output encoding and browser parsing behavior.', 'XSS Injection'],
  ['XXE Injection', 'XML parser configuration and external entity resolution.', 'XXE Injection'],
  ['Zip Slip', 'Archive extraction paths and traversal protections.', 'Zip Slip'],
];

const ghTopic = (path) => `https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/${encodeURIComponent(path).replaceAll('%2F', '/')}`;
const display = (n) => n.toLocaleString('en-US');

function PageHeader({ eyebrow, title, children }) {
  return <header className="library-head"><p className="tag">{eyebrow}</p><h1>{title}</h1>{children && <p className="library-intro">{children}</p>}</header>;
}

function Browse({ data, onReport }) {
  const [tab, setTab] = useState('classes');
  const [query, setQuery] = useState('');
  const [classId, setClassId] = useState('');
  const [programId, setProgramId] = useState('');
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.reports.filter((r) => (!classId || r.classIdx === Number(classId)) && (!programId || r.programIdx === Number(programId)) && (!q || r.search.includes(q)))
      .slice(0, 80);
  }, [data, query, classId, programId]);
  return <>
    <PageHeader eyebrow="REPORT INDEX" title={`Browse ${display(data.reports.length)} disclosed reports`}>Browse by vulnerability class, weakness, program, or search the report titles. Open a result to read the source write-up.</PageHeader>
    <div className="library-stats"><span>{display(data.reports.length)} reports</span><span>{data.classes.length} classes</span><span>{data.classes.reduce((n, c) => n + c.weaknesses.length, 0)} weaknesses</span><span>{data.programs.length} programs</span></div>
    <div className="library-toolbar"><div className="lens" role="tablist" aria-label="Browse by"><button aria-selected={tab === 'classes'} onClick={() => setTab('classes')}>Classes and weaknesses</button><button aria-selected={tab === 'programs'} onClick={() => setTab('programs')}>Programs</button></div><input className="field" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search reports, weakness or program" aria-label="Search reports" /></div>
    {tab === 'classes' && <div className="browse-columns"><div><h2>Vulnerability classes</h2><ul className="library-list">{data.classes.map((c) => <li key={c.index}><button onClick={() => setClassId(classId === String(c.index) ? '' : String(c.index))} aria-pressed={classId === String(c.index)}><span>{c.name}</span><b>{display(c.count)}</b></button><div className="library-sub">{c.weaknesses.slice(0, 6).map((w) => <button key={w.index} onClick={() => { setClassId(String(c.index)); setQuery(w.name); }}>{w.name} <small>{display(w.count)}</small></button>)}</div></li>)}</ul></div>
      <div><h2>Reports {results.length ? `(${results.length}${query || classId ? '+' : ''})` : ''}</h2><ReportRows rows={results} data={data} onReport={onReport} /></div></div>}
    {tab === 'programs' && <><div className="library-toolbar"><select className="field" aria-label="Filter program" value={programId} onChange={(e) => setProgramId(e.target.value)}><option value="">All programs</option>{data.programs.map((p) => <option key={p.index} value={p.index}>{p.name} ({p.count})</option>)}</select></div><ReportRows rows={results} data={data} onReport={onReport} /></>}
  </>;
}

function ReportRows({ rows, data, onReport }) {
  if (!rows.length) return <p className="dim note">No reports match this filter.</p>;
  return <ol className="library-report-list">{rows.map((r) => <li key={r.id}><button onClick={() => onReport(r.id)}><strong>{r.title || 'Untitled report'}</strong><span>{data.programs[r.programIdx]?.name} · {data.classes.find((c) => c.index === r.classIdx)?.name} · {data.weaknesses?.[r.weaknessIdx] || r.weakness}</span><small>HackerOne report #{r.id} ↗</small></button></li>)}</ol>;
}

function Bypasses({ data, onReport }) {
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState('');
  const grouped = useMemo(() => BYPASS_GROUPS.map(([name, description, pattern]) => ({ name, description, reports: data.reports.filter((r) => pattern.test(`${r.title} ${r.weakness}`)) })).sort((a, b) => b.reports.length - a.reports.length), [data]);
  const current = grouped[active] || grouped[0];
  const hits = current.reports.filter((r) => !query || r.search.includes(query.trim().toLowerCase())).slice(0, 100);
  return <>
    <PageHeader eyebrow="REPORT COLLECTION" title="The bypass library">Reports where a researcher got past a protection, grouped by the check they defeated. Groups are inferred from report titles and weakness labels, so some results may be approximate.</PageHeader>
    <div className="browse-columns"><ul className="library-list">{grouped.map((g, i) => <li key={g.name}><button aria-pressed={active === i} onClick={() => { setActive(i); setQuery(''); }}><span>{g.name}<small>{g.description}</small></span><b>{display(g.reports.length)}</b></button></li>)}</ul><div><div className="library-toolbar"><h2>{current.name}</h2><input className="field" type="search" placeholder="Filter these reports" value={query} onChange={(e) => setQuery(e.target.value)} /></div><ReportRows rows={hits} data={data} onReport={onReport} /><p className="dim note">Showing up to 100 of {display(current.reports.length)} matching reports.</p></div></div>
  </>;
}

function Payloads() {
  const [query, setQuery] = useState('');
  const topics = TOPICS.filter(([name, desc]) => `${name} ${desc}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <>
    <PageHeader eyebrow="TECHNIQUE INDEX" title="Payloads and techniques">A searchable topic index for vulnerability testing. Each topic opens its maintained reference in PayloadsAllTheThings; use techniques only in systems you are authorised to test.</PageHeader>
    <div className="library-toolbar"><span className="dim">{topics.length} of {TOPICS.length} topics</span><input className="field" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a technique" aria-label="Find a technique" /></div>
    <div className="topic-grid">{topics.map(([name, description, path]) => <a className="topic-card" key={name} href={ghTopic(path)} target="_blank" rel="noreferrer"><span className="tag">TECHNIQUE ↗</span><h2>{name}</h2><p>{description}</p></a>)}</div>
    <p className="dim note">Reference material by Swissky and contributors, available under the MIT licence.</p>
  </>;
}

function Cves() {
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState('');
  const [year, setYear] = useState(null);
  const [month, setMonth] = useState(null);
  const [selectedCve, setSelectedCve] = useState('');
  const [searchText, setSearchText] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    let live = true;
    fetch('/api/kev').then(async (r) => {
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      return j;
    }).then((j) => live && setCatalog(j.vulnerabilities || [])).catch((e) => live && setError(e.message));
    return () => { live = false; };
  }, []);
  const recent = [...(catalog || [])].sort((a, b) => b.dateAdded.localeCompare(a.dateAdded)).slice(0, 24);
  const search = async (e) => {
    e.preventDefault();
    const q = searchText.trim();
    if (q.length < 2) { setSearchError('Enter at least two characters.'); return; }
    setSearching(true);
    setSearchError('');
    try {
      const r = await fetch(`/api/cves/search?q=${encodeURIComponent(q)}`);
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setSearchResult(j);
    } catch (error) {
      setSearchError(error.message);
    } finally {
      setSearching(false);
    }
  };
  return <>
    <PageHeader eyebrow="VULNERABILITY INTELLIGENCE" title="The CVE library">Browse CISA Known Exploited Vulnerabilities by year and month. Select a red point to open its NVD record, or enter any CVE identifier below.</PageHeader>
    <div className="cve-page-chart"><CveCanvas entries={catalog || []} error={error} year={year} month={month} onYear={setYear} onMonth={setMonth} onCve={setSelectedCve} /></div>
    <section className="cve-search-block"><h2>Search CVEs and products</h2><form className="cve-search-form" onSubmit={search}><input className="field" value={searchText} onChange={(e) => setSearchText(e.target.value)} type="search" placeholder="Search a product, vendor, or CVE id" aria-label="Search NVD CVEs" /><button className="key" type="submit" disabled={searching}>{searching ? 'Searching…' : 'Search NVD'}</button></form>{searchError && <p className="warn" role="alert">{searchError}</p>}{searchResult && <><p className="dim note">{searchResult.total.toLocaleString('en-US')} matches · showing the newest {searchResult.cves.length}</p><ul className="library-report-list">{searchResult.cves.map((c) => <li key={c.id}><button type="button" onClick={() => setSelectedCve(c.id)}><strong>{c.id} · {c.description.slice(0, 240)}</strong><span>{c.published?.slice(0, 10)} · {c.cvss ? `CVSS ${c.cvss.score} ${c.cvss.severity || ''}` : 'CVSS unavailable'}{c.kev ? ' · CISA KEV' : ''}</span></button></li>)}</ul></>}</section>
    <div className="cve-layout"><div className="cve-guide"><h2>Recently added to CISA KEV</h2><p>{catalog ? `${catalog.length.toLocaleString('en-US')} known exploited CVEs in the feed.` : error ? `The catalog could not load: ${error}` : 'Loading the live catalog…'}</p><ul className="cve-recent">{recent.map((c) => <li key={c.cveID}><button type="button" onClick={() => setSelectedCve(c.cveID)}><strong>{c.vulnerabilityName}</strong><span>{c.cveID} · {c.dateAdded}</span></button></li>)}</ul></div><div className="cve-form"><h2>Check a CVE</h2><p className="dim lede">NVD description, CVSS, affected products, CWE, references and exploitation status.</p><PanelCves initialQuery={selectedCve} /></div></div>
  </>;
}

function About({ data }) {
  return <>
    <PageHeader eyebrow="ABOUT SKYNET" title="Every disclosed bug, mapped to how it was found.">Explore {display(data.reports.length)} public HackerOne reports across {display(data.programs.length)} programs, grouped by vulnerability class and weakness.</PageHeader>
    <div className="about-grid"><section><h2>How to read the map</h2><ul><li>Each node on the inner ring is a vulnerability class.</li><li>Each strip beyond it represents a weakness; each line stands for a report.</li><li>Curves through the middle connect classes found in reports for the same programs.</li><li>Open a class or weakness to browse the reports and source write-ups.</li></ul></section><section><h2>Where the data comes from</h2><p>Report metadata is bundled from the public HackerOne reports dataset. Individual report pages link to their original HackerOne source. CVE lookups are requested from the National Vulnerability Database.</p><p>Reports belong to their authors and the programs that disclosed them. This independent project is not affiliated with HackerOne.</p></section><section><h2>Use it responsibly</h2><p>Use security research material to learn and to test systems you are authorised to assess, within the relevant program scope.</p></section><section><h2>Read-only API</h2><p>Use the local endpoints to retrieve a public report, look up a CVE, or list recent CVEs associated with a CWE.</p><a className="link" href="/api">Read the API reference →</a></section></div>
  </>;
}

function ApiDocs() {
  const endpoints = [
    ['GET /api/report/{id}', 'Fetch a public HackerOne report with its status, severity, disclosure details, published body and summaries.'],
    ['GET /api/cve/{id}', 'Look up a CVE in NVD, including CVSS, affected products, weaknesses, exploit references and CISA KEV data.'],
    ['GET /api/cves/search?q={term}', 'Search recent NVD CVEs by product, vendor or identifier.'],
    ['GET /api/cwe/{cwe}/cves', 'List recent NVD records that NVD associates with a CWE identifier, for example CWE-79.'],
  ];
  return <>
    <PageHeader eyebrow="DEVELOPER REFERENCE" title="Read-only API">The app exposes public report and vulnerability data through simple GET endpoints. Start the app with its Vite dev server to use these routes.</PageHeader>
    <div className="api-example"><p className="tag">EXAMPLE</p><code>GET /api/cve/CVE-2021-44228</code><p className="dim">The response includes the NVD description, CVSS score, CWEs, affected products, references and exploitation status when available.</p></div>
    <div className="api-list">{endpoints.map(([path, description]) => <section key={path}><code>{path}</code><p>{description}</p></section>)}</div>
    <p className="dim note">Responses depend on the connected upstream sources. The API is read-only and does not require a key in this local app.</p>
  </>;
}

export default function LibraryPages({ page, data }) {
  const [selectedReport, setSelectedReport] = useState(null);
  useEffect(() => {
    if (!selectedReport) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setSelectedReport(null);
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [selectedReport]);
  const onReport = (id) => setSelectedReport(data.reports.find((r) => r.id === id) || null);
  const titles = { browse: 'Browse reports', bypasses: 'Bypasses', payloads: 'Payloads', cves: 'CVE library', learn: 'Learning handbook', api: 'API reference', about: 'About' };
  let content;
  if (page === 'browse') content = <Browse data={data} onReport={onReport} />;
  else if (page === 'bypasses') content = <Bypasses data={data} onReport={onReport} />;
  else if (page === 'payloads') content = <Payloads />;
  else if (page === 'cves') content = <Cves />;
  else if (page === 'learn') content = <LearningLibrary data={data} />;
  else if (page === 'api') content = <ApiDocs />;
  else content = <About data={data} />;
  return <main className="library-page" id="main" aria-label={titles[page] || 'About'}>{content}<footer className="library-footer">SkyNet · Public security research · <a href="/learn">Learning handbook</a> · <a href="/about">About this project</a> · <a href="/">Open the map</a></footer>{selectedReport && <div className="library-report-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setSelectedReport(null)}><section className="library-report-dialog" role="dialog" aria-modal="true" aria-label={`Report ${selectedReport.id}`}><button className="key close" type="button" onClick={() => setSelectedReport(null)}>Close <kbd>Esc</kbd></button><PanelReport report={selectedReport} /></section></div>}</main>;
}
