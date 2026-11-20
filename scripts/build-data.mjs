// Builds public/reports.json from data/data.csv (open "hackerone-reports" dataset).
// Run: node scripts/build-data.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { parseCsv } from './csv.mjs';

// 18 classes. Rules are tested in order against the lower-cased weakness name.
const CLASSES = [
  { id: 'xss', name: 'Cross-Site Scripting', short: 'XSS', re: /cross-site scripting|xss|script-related html/ },
  { id: 'csrf', name: 'Cross-Site Request Forgery', short: 'CSRF', re: /csrf|cross-site request forgery/ },
  { id: 'ssrf', name: 'Server-Side Request Forgery', short: 'SSRF', re: /ssrf|server-side request forgery/ },
  { id: 'redirect', name: 'Open Redirect', short: 'REDIR', re: /open redirect/ },
  { id: 'race', name: 'Race Condition', short: 'RACE', re: /race condition|toctou|time-of-check/ },
  { id: 'memory', name: 'Memory Safety', short: 'MEM', re: /memory|buffer|overflow|use after free|double free|null pointer|out-of-bounds|array index|type confusion|null termination|format string|integer|heap|dangling|uninitialized|stack/ },
  { id: 'injection', name: 'Injection', short: 'INJ', re: /injection|xxe|xml external|deserialization|template|eval/ },
  { id: 'info', name: 'Information Disclosure', short: 'INFO', re: /information (exposure|disclosure)|disclosure|exposure|privacy|sent data|debug/ },
  { id: 'auth', name: 'Authentication & Sessions', short: 'AUTH', re: /authentication|session|password recovery|brute|mfa|2fa|login/ },
  { id: 'access', name: 'Access Control', short: 'ACL', re: /access control|authorization|idor|direct object|privilege|forced browsing|externally controlled reference|client-side enforcement|assumed-immutable|untrusted inputs|reliance on/ },
  { id: 'path', name: 'Files & Path Traversal', short: 'FILE', re: /path traversal|file inclusion|upload|file|directory/ },
  { id: 'http', name: 'HTTP Protocol Abuse', short: 'HTTP', re: /request smuggling|response splitting|crlf|cache|http/ },
  { id: 'ui', name: 'UI Redress & Phishing', short: 'UI', re: /clickjacking|ui redress|phishing|spoof/ },
  { id: 'crypto', name: 'Cryptography & Secrets', short: 'CRYPTO', re: /crypto|certificate|man-in-the-middle|cleartext|plaintext|password|encryption|credential|sensitive information|hard-coded|hardcoded/ },
  { id: 'misconf', name: 'Misconfiguration', short: 'CONF', re: /misconfiguration|configuration|logging/ },
  { id: 'logic', name: 'Business Logic & Design', short: 'LOGIC', re: /business logic|secure design|design/ },
  { id: 'dos', name: 'Denial of Service', short: 'DOS', re: /resource consumption|denial of service|without limits|throttling|resources|dos/ },
  { id: 'other', name: 'Other Weaknesses', short: 'OTHER', re: /.*/ },
];

const OTHER = CLASSES.length - 1;
const idx = (id) => CLASSES.findIndex((c) => c.id === id);

// Extra weakness rules checked before the generic ones above.
const WEAKNESS_FIXES = [
  ['ssrf', /server side request forgery/],
  ['crypto', /ssl|tls|origin validation|random values|one-way hash|key past|integrity check|authenticity/],
  ['access', /permission|exposed dangerous method|export of android/],
  ['dos', /infinite loop|recursion|data amplification|xml entity expansion|resource shutdown|reachable assertion/],
  ['injection', /code execution|unexpected code|neutralization of (escape|meta|control|value|whitespace)|output neutralization|input validation|syntactic|unexpected data type|misinterpretation/],
  ['memory', /off-by-one|wrap-around|write-what-where|incorrect calculation of buffer/],
  ['ui', /ui\) misrepresentation|user interface/],
  ['logic', /expected behavior|exceptional condition|error condition|incorrectly-resolved|comparison|extraneous untrusted/],
  ['path', /search path/],
  ['info', /llm0\d|misinformation/],
  ['misconf', /default (initialization|permissions)|known vulnerabilities|supply chain|untrusted control sphere/],
];

// Title rules used only when a report has no weakness ("Unspecified").
const TITLE_RULES = [
  ['xss', /\bxss\b|cross[- ]site scripting|script injection|html injection/],
  ['csrf', /\bcsrf\b|cross[- ]site request forgery/],
  ['ssrf', /\bssrf\b|server[- ]side request forgery/],
  ['redirect', /open redirect|redirect to|unvalidated redirect/],
  ['race', /race condition|toctou/],
  ['injection', /sql injection|\bsqli\b|command injection|\brce\b|remote code execution|code execution|template injection|\bssti\b|xxe|deserializ|prototype pollution|injection/],
  ['memory', /overflow|use[- ]after[- ]free|out[- ]of[- ]bounds|memory corruption|segfault|heap|null pointer|double free/],
  ['http', /request smuggling|response splitting|crlf|cache poison|web cache|host header/],
  ['path', /path traversal|directory traversal|local file|arbitrary file|file upload|file inclusion|\blfi\b/],
  ['ui', /clickjacking|phishing|ui redress|spoofing/],
  ['crypto', /certificate|\btls\b|\bssl\b|cleartext|plaintext|hard-?coded|weak (hash|crypto)|encryption|secret key|api key/],
  ['dos', /denial of service|\bdos\b|resource exhaustion|infinite loop|crash|redos/],
  ['auth', /authentication|login|session|password reset|\bmfa\b|\b2fa\b|account takeover|\boauth\b|brute[- ]force|sign[- ]?in/],
  ['access', /\bidor\b|access control|authori[sz]ation|privilege|permission|unauthori[sz]ed|bypass|broken access/],
  ['info', /disclos|leak|expos|information|sensitive|enumerat|private/],
  ['misconf', /misconfig|subdomain takeover|takeover|dangling|cors|default (credentials|password)/],
  ['logic', /business logic|logic flaw|coupon|price|payment|bypass limit/],
];

const classifyWeakness = (weakness) => {
  const w = weakness.toLowerCase();
  // 1) the four very specific classes always win
  const specific = CLASSES.slice(0, 4).findIndex((c) => c.re.test(w));
  if (specific >= 0) return specific;
  // 2) targeted fixes for odd weakness names
  const fix = WEAKNESS_FIXES.find(([, re]) => re.test(w));
  if (fix) return idx(fix[0]);
  // 3) generic rules, then "other"
  return CLASSES.findIndex((c) => c.re.test(w));
};

const classifyTitle = (title) => {
  const t = title.toLowerCase();
  const hit = TITLE_RULES.find(([, re]) => re.test(t));
  return hit ? idx(hit[0]) : OTHER;
};

const rows = parseCsv(readFileSync('data/data.csv', 'utf8'));
rows.shift(); // header

const programs = [];
const programIdx = new Map();
const weaknesses = [];
const weaknessIdx = new Map();
const reports = [];
const seen = new Set();

for (const [program, title, link, upvotes, bounty, vuln] of rows) {
  const idMatch = /reports\/(\d+)/.exec(link || '');
  if (!idMatch) continue;
  const id = Number(idMatch[1]);
  if (seen.has(id)) continue;
  seen.add(id);

  const wName = (vuln || '').trim() || 'Unspecified';
  const cleanTitle = (title || '').trim();
  if (!programIdx.has(program)) { programIdx.set(program, programs.length); programs.push(program); }
  if (!weaknessIdx.has(wName)) {
    weaknessIdx.set(wName, weaknesses.length);
    weaknesses.push(wName);
  }
  // Reports without a weakness get a class guessed from the title.
  const classIdx = wName === 'Unspecified' ? classifyTitle(cleanTitle) : classifyWeakness(wName);
  reports.push([
    id,
    programIdx.get(program),
    weaknessIdx.get(wName),
    classIdx,
    parseInt(upvotes, 10) || 0,
    Math.round(parseFloat(bounty) || 0),
    cleanTitle,
    wName === 'Unspecified' ? 1 : 0, // 1 = class guessed from title
  ]);
}

mkdirSync('public', { recursive: true });
writeFileSync(
  'public/reports.json',
  JSON.stringify({
    // report row: [id, programIdx, weaknessIdx, classIdx, upvotes, bounty, title, guessedFlag]
    classes: CLASSES.map(({ id, name, short }) => ({ id, name, short })),
    programs,
    weaknesses,
    reports,
  })
);

// Console summary
const byClass = new Array(CLASSES.length).fill(0);
for (const r of reports) byClass[r[3]]++;
console.log('reports', reports.length, 'programs', programs.length, 'weaknesses', weaknesses.length);
CLASSES.forEach((c, i) => console.log(String(byClass[i]).padStart(6), c.name));
console.log('unspecified', reports.filter((r) => r[7]).length);
