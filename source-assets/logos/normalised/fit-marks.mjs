import http from 'node:http';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9244;
const chrome = spawn(CHROME, [`--remote-debugging-port=${PORT}`, '--headless=new', '--disable-gpu',
  '--no-first-run', '--user-data-dir=' + process.cwd() + '/cdp-fit', 'about:blank'], { stdio: 'ignore' });
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
await wait(1600);
await evalJs(fs.readFileSync('trace-lib.js','utf8') + ';true');
await evalJs(`window.TRACED = ${fs.readFileSync('traced.json','utf8')}; true`);

const VB = 256, TRACE_AT = 384;
const TARGET_THICK = 24, TARGET_FILL = 90;

const MARKS = [
  { name: 'portfolio', colour: '#9a56d6', tint: '#d69eff', split: true, erodeSteps: [1,2,3,4,5] },
  { name: 'ai',        colour: '#d86fe8' },
  { name: 'art',       colour: '#eac767' },
  { name: 'studio',    colour: '#ea8b62' },
];

// One helper in the page: build the SVG at a given scale/stroke, rasterise it,
// and report the same three numbers the audit used.
await evalJs(`window.buildAndMeasure = async (name, colour, tint, split, fitPx, strokeW, erode) => {
  const T = TRACED[name];
  const sfx = erode ? '_e' + erode : '';
  const groups = split ? [{ loops: T['main' + sfx], fill: colour }, { loops: T['light' + sfx], fill: tint }]
                       : [{ loops: T['all' + sfx], fill: colour }];
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  for (const g of groups) for (const lp of g.loops) for (const p of lp) {
    if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0];
    if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1];
  }
  const bw = maxX - minX, bh = maxY - minY;
  const k = fitPx / Math.max(bw, bh);
  const ox = ${VB} / 2 - (minX + bw / 2) * k, oy = ${VB} / 2 - (minY + bh / 2) * k;
  const eps = 0.6;
  const body = groups.map(g => {
    const d = TRACE.toPath(g.loops, eps, k, ox, oy);
    if (!d) return '';
    const stroke = strokeW > 0.05
      ? \` stroke="\${g.fill}" stroke-width="\${strokeW.toFixed(2)}" stroke-linejoin="round" stroke-linecap="round"\`
      : '';
    return \`<path fill="\${g.fill}" fill-rule="evenodd"\${stroke} d="\${d}"/>\`;
  }).join('');
  const svg = \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB} ${VB}" width="${VB}" height="${VB}">\${body}</svg>\`;

  const img = new Image();
  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  await img.decode();
  const S = ${VB};
  const c = document.createElement('canvas'); c.width = S; c.height = S;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, S, S);
  const d = ctx.getImageData(0, 0, S, S).data;
  let ink = 0, perim = 0, mnX = S, mxX = -1, mnY = S, mxY = -1, sumS = 0, sumV = 0, n = 0;
  const on = (x, y) => x >= 0 && y >= 0 && x < S && y < S && d[(y * S + x) * 4 + 3] > 96;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = (y * S + x) * 4;
    if (d[i+3] <= 96) continue;
    ink++;
    if (x < mnX) mnX = x; if (x > mxX) mxX = x; if (y < mnY) mnY = y; if (y > mxY) mxY = y;
    const mx = Math.max(d[i], d[i+1], d[i+2]), mi = Math.min(d[i], d[i+1], d[i+2]);
    sumS += mx === 0 ? 0 : (mx - mi) / mx; sumV += mx / 255; n++;
    if (!on(x-1,y) || !on(x+1,y) || !on(x,y-1) || !on(x,y+1)) perim++;
  }
  return { svg,
    inkPct: +(ink / (S * S) * 100).toFixed(1),
    boxFillPct: +(Math.max(mxX - mnX + 1, mxY - mnY + 1) / S * 100).toFixed(1),
    strokePx: +(2 * ink / Math.max(perim, 1)).toFixed(1),
    meanSat: +(sumS / n).toFixed(2), meanVal: +(sumV / n).toFixed(2) };
}; true`);

const results = {};
for (const m of MARKS) {
  // Stroke dilates, erosion thins. Try each erosion depth and keep whichever
  // lands closest to the target, so a glyph that starts too heavy is not stuck
  // at its natural weight.
  let best = null, bestErr = 1e9, bestErode = 0;
  for (const erode of [0, ...(m.erodeSteps || [])]) {
    let fit = VB * 0.82, sw = 4, out;
    for (let pass = 0; pass < 14; pass++) {
      out = await evalJs(`buildAndMeasure(${JSON.stringify(m.name)}, ${JSON.stringify(m.colour)}, ${JSON.stringify(m.tint || m.colour)}, ${!!m.split}, ${fit}, ${sw}, ${erode})`);
      const dT = TARGET_THICK - out.strokePx, dF = TARGET_FILL - out.boxFillPct;
      if (Math.abs(dT) <= 0.8 && Math.abs(dF) <= 1.0) break;
      sw = Math.max(0, sw + dT * 0.85);
      fit = fit * (1 + dF / out.boxFillPct * 0.8);
    }
    const err = Math.abs(TARGET_THICK - out.strokePx) + Math.abs(TARGET_FILL - out.boxFillPct);
    if (err < bestErr) { bestErr = err; best = out; bestErode = erode; }
  }
  const out = best;
  results[m.name] = out;
  console.log(m.name.padEnd(10), 'thickness', String(out.strokePx).padStart(5),
    ' boxFill', String(out.boxFillPct).padStart(5), ' ink', String(out.inkPct).padStart(5),
    ' sat', out.meanSat, ' val', out.meanVal, ' erode', bestErode);
  fs.writeFileSync(`mark-${m.name}.svg`, out.svg);
}
const f = k => { const v = Object.values(results).map(r => r[k]); return +(Math.max(...v) / Math.min(...v)).toFixed(2); };
console.log('\nspread  thickness', f('strokePx') + 'x   boxFill', f('boxFillPct') + 'x   ink', f('inkPct') + 'x   sat', f('meanSat') + 'x   val', f('meanVal') + 'x');
ws.close(); chrome.kill();
