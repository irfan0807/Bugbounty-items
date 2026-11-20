// Live report scraper. Runs on the Vite dev/preview server (Node), because browsers
// cannot call hackerone.com directly (CORS). GET /api/report/:id -> trimmed JSON.

const cache = new Map();
const HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'Mozilla/5.0 (compatible; SkyNetSecurityReader/1.0)',
};

export async function scrapeReport(id) {
  if (cache.has(id)) return cache.get(id);

  const res = await fetch(`https://hackerone.com/reports/${id}.json`, { headers: HEADERS });
  if (!res.ok) {
    const err = new Error(res.status === 404 ? 'Report not found or not public' : `HackerOne answered HTTP ${res.status}`);
    err.status = res.status === 404 ? 404 : 502;
    throw err;
  }
  const j = await res.json();
  const summaries = (j.summaries || [])
    .filter((s) => s.content)
    .map((s) => ({ category: s.category, content: s.content, user: s.user?.username || null }));

  const out = {
    id: j.id,
    url: j.url,
    title: j.title,
    state: j.readable_substate || j.substate || j.state,
    severity: j.severity?.rating || j.severity_rating || 'none',
    score: j.severity?.score ?? null,
    metrics: j.severity?.metrics || null,
    createdAt: j.created_at,
    disclosedAt: j.disclosed_at,
    reporter: j.reporter?.username || null,
    team: j.team?.profile?.name || j.team?.handle || null,
    teamHandle: j.team?.handle || null,
    teamUrl: j.team?.url || null,
    weakness: j.weakness?.name || null,
    cves: j.cve_ids || [],
    votes: j.vote_count ?? 0,
    hasBounty: !!j['has_bounty?'],
    asset: j.structured_scope?.asset_identifier || null,
    assetType: j.structured_scope?.asset_type || null,
    attachments: (j.attachments || []).length,
    body: (j.vulnerability_information || '').slice(0, 30000),
    summaries,
    scrapedAt: new Date().toISOString(),
  };
  cache.set(id, out);
  return out;
}

function handler(req, res, next) {
  const m = /^\/api\/report\/(\d{1,9})\/?(\?.*)?$/.exec(req.url || '');
  if (!m) return next();
  scrapeReport(Number(m[1]))
    .then((data) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    })
    .catch((e) => {
      res.statusCode = e.status || 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: e.message }));
    });
}

export default function scraperPlugin() {
  return {
    name: 'skynet-scraper',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
