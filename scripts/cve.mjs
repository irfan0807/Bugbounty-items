// CVE intelligence adapter. GET /api/cve/:id (new endpoint, existing API untouched).
// Source: NIST NVD 2.0. Every relationship keeps provenance + a verification label.
// Nothing is inferred here: if NVD does not say it, it is not returned.

const cache = new Map();
const searchCache = new Map();
let kevCache = null;
const CISA_KEV = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
const NVD = 'https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=';
const HEADERS = { 'User-Agent': 'SkyNetSecurityReader/1.0', Accept: 'application/json' };

function parseCpe(uri) {
  const p = uri.split(':'); // cpe:2.3:part:vendor:product:version:...
  if (p.length < 6) return null;
  return { part: p[2], vendor: p[3], product: p[4], version: p[5] === '*' || p[5] === '-' ? null : p[5] };
}

function collectProducts(configurations) {
  const map = new Map();
  const walk = (nodes) => {
    for (const n of nodes || []) {
      for (const m of n.cpeMatch || []) {
        if (m.vulnerable === false) continue;
        const c = parseCpe(m.criteria);
        if (!c) continue;
        const key = `${c.vendor}:${c.product}`;
        const e = map.get(key) || { vendor: c.vendor, product: c.product, versions: new Set(), ranges: [] };
        if (c.version) e.versions.add(c.version);
        else if (m.versionStartIncluding || m.versionEndExcluding || m.versionEndIncluding || m.versionStartExcluding) {
          e.ranges.push([m.versionStartIncluding && `>=${m.versionStartIncluding}`, m.versionStartExcluding && `>${m.versionStartExcluding}`, m.versionEndExcluding && `<${m.versionEndExcluding}`, m.versionEndIncluding && `<=${m.versionEndIncluding}`].filter(Boolean).join(' '));
        }
        map.set(key, e);
      }
      walk(n.children);
    }
  };
  for (const c of configurations || []) walk(c.nodes);
  return [...map.values()].slice(0, 25).map((e) => ({
    vendor: e.vendor,
    product: e.product,
    versions: [...e.versions].slice(0, 8),
    ranges: [...new Set(e.ranges)].slice(0, 4),
  }));
}

function pickCvss(metrics) {
  const m = metrics?.cvssMetricV40?.[0] || metrics?.cvssMetricV31?.[0] || metrics?.cvssMetricV30?.[0] || metrics?.cvssMetricV2?.[0];
  if (!m) return null;
  const d = m.cvssData;
  return { version: d.version, score: d.baseScore, severity: (d.baseSeverity || m.baseSeverity || '').toLowerCase() || null, vector: d.vectorString, source: m.source };
}

export async function fetchCve(id) {
  if (cache.has(id)) return cache.get(id);
  const res = await fetch(NVD + id, { headers: HEADERS });
  if (!res.ok) {
    const e = new Error(`NVD answered HTTP ${res.status}`);
    e.status = 502;
    throw e;
  }
  const j = await res.json();
  const cve = j.vulnerabilities?.[0]?.cve;
  if (!cve) {
    const e = new Error('CVE not found in NVD');
    e.status = 404;
    throw e;
  }

  const cwes = new Map();
  for (const w of cve.weaknesses || []) {
    for (const d of w.description || []) {
      if (!/^CWE-\d+$/.test(d.value)) continue; // skips NVD-CWE-Other / noinfo
      const e = cwes.get(d.value) || { id: d.value, sources: [] };
      e.sources.push({ source: w.source, type: w.type });
      cwes.set(d.value, e);
    }
  }

  const refs = (cve.references || []).map((r) => ({ url: r.url, source: r.source, tags: r.tags || [] }));
  const out = {
    id: cve.id,
    status: cve.vulnStatus,
    published: cve.published,
    modified: cve.lastModified,
    description: (cve.descriptions || []).find((d) => d.lang === 'en')?.value || '',
    cvss: pickCvss(cve.metrics),
    cwes: [...cwes.values()],
    products: collectProducts(cve.configurations),
    advisories: refs.filter((r) => r.tags.some((t) => /Vendor Advisory|Third Party Advisory|Mitigation|Patch/.test(t))).slice(0, 12),
    exploits: refs.filter((r) => r.tags.includes('Exploit')).slice(0, 12),
    mitigations: refs.filter((r) => r.tags.some((t) => /Mitigation|Patch/.test(t))).slice(0, 12),
    kev: cve.cisaExploitAdd
      ? { added: cve.cisaExploitAdd, due: cve.cisaActionDue || null, name: cve.cisaVulnerabilityName || null, action: cve.cisaRequiredAction || null }
      : null,
    refCount: refs.length,
    evidenceUrl: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
    fetchedAt: new Date().toISOString(),
  };
  cache.set(id, out);
  return out;
}

async function fetchKev() {
  if (kevCache && Date.now() - kevCache.savedAt < 60 * 60 * 1000) return kevCache.data;
  const res = await fetch(CISA_KEV, { headers: { 'User-Agent': HEADERS['User-Agent'], Accept: 'application/json' } });
  if (!res.ok) {
    const e = new Error(`CISA KEV answered HTTP ${res.status}`);
    e.status = 502;
    throw e;
  }
  const body = await res.json();
  const data = {
    title: body.title,
    catalogVersion: body.catalogVersion,
    dateReleased: body.dateReleased,
    count: body.count ?? body.vulnerabilities?.length ?? 0,
    vulnerabilities: (body.vulnerabilities || []).map((v) => ({
      cveID: v.cveID,
      vendorProject: v.vendorProject,
      product: v.product,
      vulnerabilityName: v.vulnerabilityName,
      dateAdded: v.dateAdded,
      shortDescription: v.shortDescription,
      requiredAction: v.requiredAction,
      dueDate: v.dueDate,
      knownRansomwareCampaignUse: v.knownRansomwareCampaignUse,
      notes: v.notes,
    })),
  };
  kevCache = { data, savedAt: Date.now() };
  return data;
}

async function searchCves(query) {
  const key = query.trim().toLowerCase();
  if (searchCache.has(key)) return searchCache.get(key);
  const params = new URLSearchParams({ keywordSearch: query.trim(), resultsPerPage: '20', sortBy: 'published', sortOrder: 'desc' });
  const res = await fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?${params}`, { headers: HEADERS });
  if (!res.ok) {
    const e = new Error(`NVD answered HTTP ${res.status}`);
    e.status = 502;
    throw e;
  }
  const j = await res.json();
  const result = {
    total: j.totalResults ?? 0,
    cves: (j.vulnerabilities || []).map(({ cve }) => ({
      id: cve.id,
      description: (cve.descriptions || []).find((d) => d.lang === 'en')?.value || '',
      published: cve.published,
      cvss: pickCvss(cve.metrics),
      kev: cve.cisaExploitAdd ? { added: cve.cisaExploitAdd, name: cve.cisaVulnerabilityName || null } : null,
      evidenceUrl: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
    })),
  };
  searchCache.set(key, result);
  return result;
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

const cweCache = new Map();

// GET /api/cwe/CWE-79/cves -> a handful of recent NVD CVEs that NVD itself classifies under that CWE.
async function fetchCweCves(cwe) {
  if (cweCache.has(cwe)) return cweCache.get(cwe);
  const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?cweId=${cwe}&resultsPerPage=8`;
  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) {
    const e = new Error(`NVD answered HTTP ${r.status}`);
    e.status = 502;
    throw e;
  }
  const j = await r.json();
  const out = {
    cwe,
    total: j.totalResults ?? 0,
    cves: (j.vulnerabilities || []).map((v) => ({ id: v.cve.id, cvss: pickCvss(v.cve.metrics), published: v.cve.published })),
  };
  cweCache.set(cwe, out);
  return out;
}

function handler(req, res, next) {
  const search = /^\/api\/cves\/search\/?(?:\?(.*))?$/.exec(req.url || '');
  if (search) {
    const query = new URLSearchParams(search[1] || '').get('q')?.trim();
    if (!query || query.length < 2 || query.length > 120) {
      sendJson(res, 400, { error: 'Enter at least two characters to search CVEs.' });
      return;
    }
    searchCves(query)
      .then((data) => sendJson(res, 200, data))
      .catch((e) => sendJson(res, e.status || 500, { error: e.message }));
    return;
  }
  if (/^\/api\/kev\/?(?:\?.*)?$/.test(req.url || '')) {
    fetchKev()
      .then((data) => sendJson(res, 200, data))
      .catch((e) => sendJson(res, e.status || 500, { error: e.message }));
    return;
  }
  const c = /^\/api\/cwe\/(CWE-\d{1,5})\/cves\/?(\?.*)?$/i.exec(req.url || '');
  if (c) {
    fetchCweCves(c[1].toUpperCase())
      .then((d) => sendJson(res, 200, d))
      .catch((e) => sendJson(res, e.status || 500, { error: e.message }));
    return;
  }
  const m = /^\/api\/cve\/(CVE-\d{4}-\d{4,7})\/?(\?.*)?$/i.exec(req.url || '');
  if (!m) return next();
  fetchCve(m[1].toUpperCase())
    .then((d) => sendJson(res, 200, d))
    .catch((e) => sendJson(res, e.status || 500, { error: e.message }));
}

export default function cvePlugin() {
  return {
    name: 'skynet-cve-adapter',
    configureServer(s) { s.middlewares.use(handler); },
    configurePreviewServer(s) { s.middlewares.use(handler); },
  };
}
