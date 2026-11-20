// Screenshot helper: drives Chrome over the DevTools Protocol so the viewport is exact
// (headless --window-size alone rounds the window and crops). Usage:
//   node scripts/shot.mjs <url> <out.png> <width> <height> [clickSelector] [hoverSelector]
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const [, , url, out, w = '1440', h = '900', clickSel, hoverSel] = process.argv;
const PORT = 9333;
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  `--remote-debugging-port=${PORT}`, '--user-data-dir=' + process.env.TEMP + '\\hexshot-profile',
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function targets() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const j = await r.json();
      const page = j.find((t) => t.type === 'page');
      if (page) return page;
    } catch { /* not up yet */ }
    await sleep(250);
  }
  throw new Error('Chrome did not start');
}

const page = await targets();
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
const send = (method, params = {}) => new Promise((resolve) => {
  const n = ++id;
  pending.set(n, resolve);
  ws.send(JSON.stringify({ id: n, method, params }));
});

await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 1, mobile: +w < 600 });
await send('Page.enable');
await send('Page.navigate', { url });
await sleep(3500);

if (clickSel) {
  await send('Runtime.evaluate', { expression: `document.querySelector(${JSON.stringify(clickSel)})?.click()` });
  await sleep(1500);
}
if (hoverSel) {
  await send('Runtime.evaluate', {
    expression: `(() => { const el = document.querySelector(${JSON.stringify(hoverSel)}); if (!el) return 'no el';
      const r = el.getBoundingClientRect();
      const opts = { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
      el.dispatchEvent(new PointerEvent('pointermove', opts)); el.dispatchEvent(new MouseEvent('mousemove', opts)); return 'ok'; })()`,
  });
  await sleep(600);
}

const shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(out, Buffer.from(shot.result.data, 'base64'));

const size = await send('Runtime.evaluate', { returnByValue: true, expression: 'JSON.stringify({w: innerWidth, h: innerHeight, sw: document.documentElement.scrollWidth})' });
console.log(out, size.result?.result?.value);
ws.close();
chrome.kill();
process.exit(0);
