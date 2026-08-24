import http from 'node:http';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const ROOT = process.env.SITE_ROOT || 'c:/Users/User/Desktop/Personal Projects/Resume & Portfolio/DGFari 3D Portfolio Website';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = Number(process.env.CDP_PORT || 9290);

// The card, in one place.
//
// `drop` is how far below the card's bottom edge her chest is cropped; raising
// it lowers her and buys headroom above her head. `shiftX` slides her past the
// right edge; the glow is derived from her position, so it travels with her.
const CARD = {
  hero: 840,
  drop: 48,
  shiftX: 40,
  quality: 0.86,
};

// The backlight is not chosen, it is ported. These are the portfolio's mobile
// hero measured live in a headless browser at 390px: the clip's rendered width,
// the .character-rim box after its transform, its blur and inset shadow, and
// where its centre sits inside the clip. Everything about the glow on this card
// is derived from these by the ratio between the two hero widths, so the card
// reproduces what the phone actually shows rather than an approximation of it.
const PORTFOLIO_MOBILE = {
  videoW: 437,
  videoH: 344,
  rimBase: 160,
  rimScale: 1.35,
  rimBlur: 31,
  shadow: [66, 35, 85],
  shadowColour: 'rgba(85,0,255,0.65)',
  // Centre of the rim as a fraction of the clip: horizontally centred, and
  // vertically down near her chin rather than behind her head.
  fx: (195 - -23) / 437,
  fy: (457 - 296) / 344,
};

const ASPECT = 700 / 552; // the hero frame's own aspect

const chrome = spawn(CHROME, [`--remote-debugging-port=${PORT}`, '--headless=new',
  '--no-first-run', '--user-data-dir=' + process.cwd() + '/cdp-og', 'about:blank'], { stdio: 'ignore' });
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
// Rendered at 2x and resampled down, which is sharper than asking the browser
// to rasterise this type at 1x.
await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 2, mobile: false });

const html = fs.readFileSync('og-template.html', 'utf8');
await send('Page.navigate', { url: 'data:text/html;charset=utf-8;base64,' + Buffer.from(html, 'utf8').toString('base64') });
await wait(1200);
// Geist comes from Google Fonts. Wait for it rather than shooting the fallback.
await evalJs('document.fonts.ready.then(() => true)');

const hero = fs.readFileSync('hero-f0.png').toString('base64');
const icon = fs.readFileSync(ROOT + '/public/itsdgfari_icon.svg').toString('base64');
await evalJs(`(async () => {
  const h = document.getElementById('hero'); h.src = 'data:image/png;base64,${hero}';
  const k = document.getElementById('icon'); k.src = 'data:image/svg+xml;base64,${icon}';
  await Promise.all([h.decode(), k.decode()]);
  return true;
})()`);
await wait(400);

// Where her head sits in the source frame, measured rather than eyeballed: the
// widest opaque span across the upper part of the frame is her hair, and its
// midpoint is her head. Deriving the glow from this means changing the hero
// size moves the glow with it, instead of leaving a second number to keep in
// sync by hand.
const head = await evalJs(`(async () => {
  const img = new Image(); img.src = 'data:image/png;base64,${hero}'; await img.decode();
  const W = img.naturalWidth, H = img.naturalHeight;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, W, H).data;
  let top = H, minX = W, maxX = 0;
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    if (d[(py * W + px) * 4 + 3] < 120) continue;
    if (py < top) top = py;
    if (py < H * 0.42) { if (px < minX) minX = px; if (px > maxX) maxX = px; }
  }
  return { fx: ((minX + maxX) / 2) / W, fy: (top + H * 0.20) / H, topFrac: top / H };
})()`);

const heroH = CARD.hero / ASPECT;
const heroLeft = 1200 + CARD.shiftX - CARD.hero;
const heroTop = 630 + CARD.drop - heroH;

const P = PORTFOLIO_MOBILE;
const k = CARD.hero / P.videoW; // how much bigger she is here than on a phone
const rimSize = Math.round(P.rimBase * k);
const rimBlur = Math.round(P.rimBlur * k);
const rimShadow = P.shadow.map(v => Math.round(v * k) + 'px').join(' ') + ' 0 ' + P.shadowColour;
const rx = Math.round(heroLeft + P.fx * CARD.hero);
const ry = Math.round(heroTop + P.fy * heroH);

await evalJs(`(() => { const r = document.documentElement.style;
  r.setProperty('--hero-w', '${CARD.hero}px');
  r.setProperty('--rim-size', '${rimSize}px');
  r.setProperty('--rim-blur', '${rimBlur}px');
  r.setProperty('--rim-scale', '${P.rimScale}');
  r.setProperty('--rim-shadow', '${rimShadow}');
  r.setProperty('--rim-x', '${rx}px');
  r.setProperty('--rim-y', '${ry}px');
  document.querySelector('.hero').style.bottom = '-${CARD.drop}px';
  document.querySelector('.hero').style.right = '-${CARD.shiftX}px';
  return true; })()`);
await wait(450);

console.log('head centre in source frame:', JSON.stringify(head));
console.log('scale vs the phone:', k.toFixed(3) + 'x');
console.log('glow: base ' + rimSize + 'px, blur ' + rimBlur + 'px, shadow ' + rimShadow);
console.log('glow centred at', rx + ',' + ry, ' effective diameter', Math.round(rimSize * P.rimScale) + 'px');
console.log('layout:', await evalJs(`(() => {
  const r = s => { const b = document.querySelector(s).getBoundingClientRect();
    return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; };
  return { mark: r('.mark'), tag: r('.tag'), pills: r('.pills'), domain: r('.domain'), hero: r('.hero'),
    pillLabels: [...document.querySelectorAll('.pills span')].map(s => s.textContent).join(', '),
    pillsFit: document.querySelector('.pills').scrollWidth <= document.querySelector('.left').clientWidth,
    heroClearsText: document.querySelector('.hero').getBoundingClientRect().left
      > document.querySelector('.tag').getBoundingClientRect().left }; })()`));

const png = (await send('Page.captureScreenshot', { format: 'png' })).result.data;
fs.writeFileSync('og-render.png', Buffer.from(png, 'base64'));

const jpg = await evalJs(`(async () => {
  const img = new Image(); img.src = 'data:image/png;base64,${png}'; await img.decode();
  const c = document.createElement('canvas'); c.width = 1200; c.height = 630;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  x.drawImage(img, 0, 0, 1200, 630);
  return c.toDataURL('image/jpeg', ${CARD.quality});
})()`);
const buf = Buffer.from(jpg.split(',')[1], 'base64');
fs.writeFileSync('dgfari-og.jpg', buf);
console.log('written dgfari-og.jpg  ' + (buf.length / 1024).toFixed(0) + 'KB');

ws.close();
chrome.kill();
