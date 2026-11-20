import { nodeKey } from './model.js';

export const node = (type, id, label, sub = '', extra = {}) => ({ key: nodeKey(type, id), type, id, label, sub, ...extra });

// Every edge carries its provenance (sourceName), evidence links and a verification label.
export const edge = (a, b, rel, verify, sourceName, evidence = [], extra = {}) => ({
  id: `${a}|${rel}|${b}`, source: a, target: b, rel, verify, sourceName, evidence, ...extra,
});

export async function getJson(url) {
  const r = await fetch(url);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
  return j;
}
