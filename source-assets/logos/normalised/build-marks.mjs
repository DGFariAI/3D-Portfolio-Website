import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ROOT = 'c:/Users/User/Desktop/Personal Projects/Resume & Portfolio/DGFari 3D Portfolio Website';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9243;
const chrome = spawn(CHROME, [`--remote-debugging-port=${PORT}`, '--headless=new', '--disable-gpu',
  '--no-first-run', '--user-data-dir=' + process.cwd() + '/cdp-build', 'about:blank'], { stdio: 'ignore' });
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
await send('Page.navigate',{url:'http://localhost:4187/'});
await wait(1800);
await evalJs(fs.readFileSync('trace-lib.js','utf8') + ';true');

const b64 = p => fs.readFileSync(path.join(ROOT, p)).toString('base64');
const MARKS = [
  { name: 'portfolio', file: 'dgfari-portfolio.svg', src: 'http://localhost:4187/itsdgfari_icon.svg',
    colour: '#b677ed', tint: '#dcbcf8', split: true, erodeSteps: [1,2,3,4,5] },
  { name: 'ai', file: 'dgfari-ai.svg', src: 'data:image/png;base64,' + b64('source-assets/logos/DGFari-AI.png'),
    colour: '#d86fe8' },
  // The only one that could not be normalised from its own artwork: at 5.5px
  // its lines had to grow 4.5x to reach the shared weight, which closed the
  // frame's opening and fused the six rays into a single blob. Redrawn as clean
  // geometry already at the target weight, keeping the frame and a three-ray
  // burst; the perspective and the finer rays do not survive 28px either way.
  { name: 'art', file: 'dgfari-art.svg',
    src: 'data:image/svg+xml;base64,' + Buffer.from(fs.readFileSync('art-authored.svg')).toString('base64'),
    colour: '#eac767' },
  { name: 'studio', file: 'dgfari-studio.svg', src: 'data:image/png;base64,' + b64('source-assets/logos/DGFari-Studio.png'),
    colour: '#ea8b62' },
];

const TRACE_AT = 384;   // trace resolution
const VB = 256;         // output viewBox

// Trace once per mark. `split` also returns the lighter sub-shape separately, so
// the flame keeps the two-tone that makes it readable as a flame.
const traced = {};
for (const m of MARKS) {
  const erodeSteps = m.erodeSteps || [];
  traced[m.name] = await evalJs(`(async () => {
    const S = ${TRACE_AT};
    const img = new Image(); img.crossOrigin = 'anonymous'; img.src = ${JSON.stringify(m.src)};
    await img.decode();
    const c = document.createElement('canvas'); c.width = S; c.height = S;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const s = Math.min(S / img.naturalWidth, S / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
    const d = ctx.getImageData(0, 0, S, S).data;
    const ink = new Uint8Array(S * S), light = new Uint8Array(S * S);
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      if (d[i+3] < 110) continue;
      ink[p] = 1;
      // Split on value: the flame's pale petal sits well above its main petal.
      const v = Math.max(d[i], d[i+1], d[i+2]) / 255;
      const sat = v === 0 ? 0 : (v * 255 - Math.min(d[i], d[i+1], d[i+2])) / (v * 255);
      if (v > 0.82 && sat < 0.42) light[p] = 1;
    }
    const paths = (grid) => TRACE.contours(grid, S, S);
    const main = new Uint8Array(S * S);
    for (let p = 0; p < ink.length; p++) main[p] = ink[p] && !light[p] ? 1 : 0;
    // Stroke can only dilate a shape. The flame is already thicker than the
    // target, so it needs the opposite: erode the grid before tracing, which is
    // the only way to take weight off a solid glyph without redrawing it.
    const erode = (g, r) => {
      let cur = g;
      for (let pass = 0; pass < r; pass++) {
        const next = new Uint8Array(S * S);
        for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
          const i = y * S + x;
          if (!cur[i]) continue;
          if (x > 0 && y > 0 && x < S - 1 && y < S - 1 &&
              cur[i-1] && cur[i+1] && cur[i-S] && cur[i+S]) next[i] = 1;
        }
        cur = next;
      }
      return cur;
    };
    const out = {
      all: paths(ink), main: paths(main), light: paths(light),
      lightPx: light.reduce((a, b) => a + b, 0), inkPx: ink.reduce((a, b) => a + b, 0),
    };
    for (const r of ${JSON.stringify(erodeSteps)}) {
      out['main_e' + r] = paths(erode(main, r));
      out['light_e' + r] = paths(erode(light, r));
      out['all_e' + r] = paths(erode(ink, r));
    }
    return out;
  })()`);
  console.log(m.name, 'loops', traced[m.name].all.length, ' light px share',
    (traced[m.name].lightPx / Math.max(traced[m.name].inkPx, 1) * 100).toFixed(1) + '%');
}
fs.writeFileSync('traced.json', JSON.stringify(traced));
ws.close(); chrome.kill();
