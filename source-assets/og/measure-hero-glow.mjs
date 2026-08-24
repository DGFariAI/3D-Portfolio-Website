import http from 'node:http';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = Number(process.env.CDP_PORT || 9291);
const URL = process.env.URL || 'http://localhost:4203/portfolio';

const chrome = spawn(CHROME, [`--remote-debugging-port=${PORT}`, '--headless=new',
  '--no-first-run', '--user-data-dir=' + process.cwd() + '/cdp-hero', 'about:blank'], { stdio: 'ignore' });
const get = p => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: PORT, path: p }, r => {
    let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
  }).on('error', rej);
});
const wait = ms => new Promise(r => setTimeout(r, ms));
let list;
for (let i = 0; i < 40; i++) { try { list = await get('/json/list'); break; } catch { await wait(250); } }
const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl);
let id = 0; const pending = new Map();
await new Promise(r => ws.onopen = r);
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (m, p = {}) => new Promise(res => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const evalJs = async e => {
  const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
  if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails, null, 1));
  return r.result.result.value;
};

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send('Page.navigate', { url: URL });
// The intro runs for several seconds before the hero settles.
await wait(11000);

const geom = await evalJs(`(() => {
  const rim = document.querySelector('.character-rim');
  const vid = document.querySelector('.landing-sticky-video');
  const cs = rim ? getComputedStyle(rim) : null;
  const r = el => { if (!el) return null; const b = el.getBoundingClientRect();
    return { l: Math.round(b.left), t: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height),
      cx: Math.round((b.left + b.right) / 2), cy: Math.round((b.top + b.bottom) / 2) }; };
  return { rim: r(rim), video: r(vid),
    rimStyle: cs && { w: cs.width, h: cs.height, filter: cs.filter, transform: cs.transform,
      bg: cs.backgroundColor, shadow: cs.boxShadow, opacity: cs.opacity } };
})()`);
console.log('rim box   :', JSON.stringify(geom.rim));
console.log('video box :', JSON.stringify(geom.video));
console.log('rim style :', JSON.stringify(geom.rimStyle, null, 1));

const shot = (await send('Page.captureScreenshot', { format: 'png' })).result.data;
fs.writeFileSync('hero-mobile.png', Buffer.from(shot, 'base64'));

// Radial profile of the violet spill around the glow's centre, measured in
// device pixels: how far the bloom actually carries, and how bright at the core.
const profile = await evalJs(`(async () => {
  const img = new Image(); img.src = 'data:image/png;base64,${shot}'; await img.decode();
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, img.width, img.height).data;
  const D = 2;
  const rim = ${JSON.stringify(geom.rim)};
  const cx = rim.cx * D, cy = rim.cy * D;
  const out = [];
  // Sample only upward and sideways from the centre, where the character is not
  // in the way, so the numbers describe the glow and not her hair.
  for (let rad = 0; rad <= 520; rad += 20) {
    let sum = 0, n = 0;
    for (let a = 200; a <= 340; a += 4) {
      const t = a * Math.PI / 180;
      const px = Math.round(cx + Math.cos(t) * rad * D), py = Math.round(cy + Math.sin(t) * rad * D);
      if (px < 0 || py < 0 || px >= img.width || py >= img.height) continue;
      const i = (py * img.width + px) * 4;
      sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; n++;
    }
    if (n) out.push({ rad, lum: +(sum / n).toFixed(1) });
  }
  const peak = Math.max(...out.map(o => o.lum));
  const floor = out[out.length - 1].lum;
  const halfR = (out.find(o => o.lum <= floor + (peak - floor) * 0.5) || {}).rad;
  const tenR = (out.find(o => o.lum <= floor + (peak - floor) * 0.1) || {}).rad;
  return { out, peak, floor, halfR, tenR };
})()`);
console.log('\nglow falloff from its centre (CSS px, sampled away from her):');
for (const p of profile.out) console.log('   r=' + String(p.rad).padStart(3), 'lum', p.lum);
console.log('  peak', profile.peak, ' floor', profile.floor,
  ' half-brightness radius', profile.halfR, ' 10% radius', profile.tenR);

ws.close();
chrome.kill();
