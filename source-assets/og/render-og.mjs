import http from 'node:http';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = Number(process.env.CDP_PORT || 9270);
const OUT = process.env.OUT || 'og-new.png';
const ROOT = 'c:/Users/User/Desktop/Personal Projects/Resume & Portfolio/DGFari 3D Portfolio Website';
const chrome = spawn(CHROME, [`--remote-debugging-port=${PORT}`, '--headless=new',
  '--no-first-run', '--user-data-dir=' + process.cwd() + '/cdp-og', 'about:blank'], { stdio: 'ignore' });
const get = p => new Promise((res, rej) => { http.get({ host:'127.0.0.1', port:PORT, path:p }, r => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>res(JSON.parse(d))); }).on('error', rej); });
const wait = ms => new Promise(r => setTimeout(r, ms));
let list; for (let i=0;i<40;i++){ try { list = await get('/json/list'); break; } catch { await wait(250); } }
const ws = new WebSocket(list.find(t=>t.type==='page').webSocketDebuggerUrl);
let id=0; const pending=new Map();
await new Promise(r=>ws.onopen=r);
ws.onmessage=e=>{const m=JSON.parse(e.data); if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);}};
const send=(m,p={})=>new Promise(res=>{const n=++id;pending.set(n,res);ws.send(JSON.stringify({id:n,method:m,params:p}));});
const evalJs=async e=>{const r=await send('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true}); if(r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails,null,1)); return r.result.result.value;};
await send('Page.enable'); await send('Runtime.enable');
// 2x so the downscale to 1200x630 is clean rather than the browser's own AA.
await send('Emulation.setDeviceMetricsOverride',{width:1200,height:630,deviceScaleFactor:2,mobile:false});

const html = fs.readFileSync('og-template.html','utf8');
await send('Page.navigate',{ url: 'data:text/html;charset=utf-8;base64,' + Buffer.from(html,'utf8').toString('base64') });
await wait(1200);
// Fonts come from Google; wait for them rather than screenshotting the fallback.
await evalJs(`document.fonts.ready.then(() => true)`);
const hero = fs.readFileSync('hero-f0.png').toString('base64');
const bg = fs.readFileSync('og-bg.png').toString('base64');
const icon = fs.readFileSync(ROOT + '/public/itsdgfari_icon.svg').toString('base64');
await evalJs(`(async () => {
  document.getElementById('bg').style.backgroundImage = 'url(data:image/png;base64,${bg})';
  const h = document.getElementById('hero'); h.src = 'data:image/png;base64,${hero}';
  const k = document.getElementById('icon'); k.src = 'data:image/svg+xml;base64,${icon}';
  await Promise.all([h.decode(), k.decode()]);
  return true; })()`);
await wait(500);
console.log('font loaded:', await evalJs(`document.fonts.check('700 62px Geist')`));
console.log('layout:', await evalJs(`(() => {
  const r = el => { const b = document.querySelector(el).getBoundingClientRect();
    return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; };
  return { mark: r('.mark'), icon: r('.mark img'), tag: r('.tag'), pills: r('.pills'),
    domain: r('.domain'), hero: r('.hero'),
    pillLabels: [...document.querySelectorAll('.pills span')].map(s => s.textContent).join(', '),
    pillsFit: document.querySelector('.pills').scrollWidth <= document.querySelector('.left').clientWidth }; })()`));
const shot = (await send('Page.captureScreenshot', { format:'png', captureBeyondViewport:false })).result.data;
fs.writeFileSync(OUT, Buffer.from(shot,'base64'));
console.log('written', OUT);

// Rendered at 2x then resampled down to 1200x630, which is sharper than asking
// the browser to rasterise text at 1x. Exported as JPEG at a few qualities so
// the smallest one that still holds up can be picked on evidence.
for (const q of [0.82, 0.86, 0.9]) {
  const jpg = await evalJs(`(async () => {
    const img = new Image();
    img.src = 'data:image/png;base64,${shot}';
    await img.decode();
    const c = document.createElement('canvas'); c.width = 1200; c.height = 630;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.drawImage(img, 0, 0, 1200, 630);
    return c.toDataURL('image/jpeg', ${q});
  })()`);
  const buf = Buffer.from(jpg.split(',')[1], 'base64');
  const name = 'og-q' + String(q).replace('.', '') + '.jpg';
  fs.writeFileSync(name, buf);
  console.log('  ', name, (buf.length / 1024).toFixed(0) + 'KB');
}
ws.close(); chrome.kill();
