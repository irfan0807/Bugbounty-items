// Security Graph model: entity types, relationship types, verification levels.
// Kept separate from rendering and from the data layer.

export const ENTITY_TYPES = {
  cve: { label: 'CVE', color: '#ff5f7a', short: 'CVE' },
  vuln: { label: 'Vulnerability', color: '#00e5ff', short: 'VULN' },
  cwe: { label: 'CWE / Weakness', color: '#7df9ff', short: 'CWE' },
  report: { label: 'Bug Bounty Report', color: '#ffc46b', short: 'RPT' },
  product: { label: 'Affected Product', color: '#00a8ff', short: 'PROD' },
  advisory: { label: 'Security Advisory', color: '#8fb3ff', short: 'ADV' },
  exploit: { label: 'Exploit / PoC', color: '#ff9a5f', short: 'EXP' },
  mitigation: { label: 'Mitigation', color: '#54ffa8', short: 'FIX' },
};

// Types in the spec with no data source yet (threat actors, campaigns, malware, ATT&CK, ...).
// They are listed so the UI can say so honestly instead of showing invented nodes.
export const UNSUPPORTED_TYPES = [
  'Threat Actor', 'Threat Campaign', 'Malware', 'MITRE ATT&CK Technique',
  'Attack Vector', 'Security Control', 'Software Version (separate node)',
];

export const REL_TYPES = {
  demonstrates: 'Report demonstrates vulnerability',
  weakness: 'Vulnerability has associated weakness',
  classified: 'CVE is classified by CWE',
  affects: 'CVE affects product',
  exploit: 'CVE has public exploit reference',
  advisory: 'CVE has security advisory',
  mitigation: 'CVE has mitigation / patch reference',
  reportCve: 'Report references CVE',
};

export const VERIFY = {
  verified: { label: 'VERIFIED', text: 'Directly supported by a reliable record.' },
  reported: { label: 'SOURCE-REPORTED', text: 'Explicitly asserted by the cited source.' },
  inferred: { label: 'INFERRED', text: 'A possible association from analysis. Not confirmed.' },
  unverified: { label: 'UNVERIFIED', text: 'Insufficient evidence.' },
};

// Name-based mapping from HackerOne weakness names to CWE ids. This is analysis, so every edge
// built from it is labelled INFERRED. Evidence points at the MITRE CWE definition.
const CWE_RULES = [
  [/sql injection/i, 'CWE-89'],
  [/cross-?site scripting|\bxss\b/i, 'CWE-79'],
  [/os command injection/i, 'CWE-78'],
  [/^command injection/i, 'CWE-77'],
  [/server-?side request forgery|ssrf/i, 'CWE-918'],
  [/cross-?site request forgery|csrf/i, 'CWE-352'],
  [/path traversal/i, 'CWE-22'],
  [/xml external entit|xxe/i, 'CWE-611'],
  [/open redirect/i, 'CWE-601'],
  [/insecure direct object|idor/i, 'CWE-639'],
  [/improper access control/i, 'CWE-284'],
  [/improper authentication/i, 'CWE-287'],
  [/missing authorization/i, 'CWE-862'],
  [/^code injection/i, 'CWE-94'],
  [/deserialization/i, 'CWE-502'],
  [/information disclosure/i, 'CWE-200'],
  [/use after free/i, 'CWE-416'],
  [/race condition/i, 'CWE-362'],
  [/improper input validation/i, 'CWE-20'],
  [/file upload|unrestricted upload/i, 'CWE-434'],
  [/hard-?coded/i, 'CWE-798'],
  [/session fixation/i, 'CWE-384'],
  [/crlf/i, 'CWE-93'],
  [/request smuggling/i, 'CWE-444'],
  [/prototype pollution/i, 'CWE-1321'],
  [/out-of-bounds read/i, 'CWE-125'],
  [/out-of-bounds write/i, 'CWE-787'],
  [/null pointer/i, 'CWE-476'],
  [/integer overflow/i, 'CWE-190'],
  [/uncontrolled resource consumption/i, 'CWE-400'],
  [/improper certificate validation/i, 'CWE-295'],
  [/cleartext transmission/i, 'CWE-319'],
  [/cleartext storage/i, 'CWE-312'],
];

export function cweForWeakness(name) {
  for (const [re, id] of CWE_RULES) if (re.test(name)) return id;
  return null;
}

export const cweUrl = (id) => `https://cwe.mitre.org/data/definitions/${id.replace('CWE-', '')}.html`;
export const nvdUrl = (id) => `https://nvd.nist.gov/vuln/detail/${id}`;

export const nodeKey = (type, id) => `${type}:${id}`;
