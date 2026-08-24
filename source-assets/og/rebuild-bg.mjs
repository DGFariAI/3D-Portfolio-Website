import http from 'node:http';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9274;
const chrome = spawn(CHROME, [`--remote-debugging-port=${PORT}`, '--headless=new',
  '--no-first-run', '--user-data-dir=' + process.cwd() + '/cdp-rebg', 'about:blank'], { stdio: 'ignore' });
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
await send('Page.navigate',{url:'about:blank'});
await wait(400);
const b64 = fs.readFileSync('og-original.jpg').toString('base64');

// Recover the old card's background instead of re-inventing it.
//
// The card is masked where the character and the text sat, averaged down to a
// coarse grid using only the pixels that were genuinely background, and the
// cells with nothing left in them are filled by diffusing their neighbours
// inward. Scaled back up that reproduces the original gradient exactly
// wherever it was visible, and interpolates smoothly across the rest.
const out = await evalJs(`(async () => {
  const img = new Image(); img.src = 'data:image/jpeg;base64,${b64}'; await img.decode();
  const W = 1200, H = 630;
  const c = document.createElement('canvas'); c.width=W; c.height=H;
  const x = c.getContext('2d',{willReadFrequently:true}); x.drawImage(img,0,0,W,H);
  const d = x.getImageData(0,0,W,H).data;

  const masked = (px,py) =>
    (px > 660 && py > 40) ||                       // the old character
    (px > 55 && px < 680 && py > 120 && py < 510); // the text column

  const CW = 24, GW = Math.ceil(W/CW), GH = Math.ceil(H/CW);
  const sum = new Float64Array(GW*GH*3), cnt = new Float64Array(GW*GH);
  for (let py=0; py<H; py++) for (let px=0; px<W; px++) {
    if (masked(px,py)) continue;
    const gi = (Math.floor(py/CW)*GW + Math.floor(px/CW));
    const i = (py*W+px)*4;
    sum[gi*3]+=d[i]; sum[gi*3+1]+=d[i+1]; sum[gi*3+2]+=d[i+2]; cnt[gi]++;
  }
  const cell = new Float64Array(GW*GH*3), known = new Uint8Array(GW*GH);
  for (let i=0;i<GW*GH;i++) if (cnt[i] > CW*CW*0.25) {
    known[i]=1; for (let k=0;k<3;k++) cell[i*3+k]=sum[i*3+k]/cnt[i];
  }
  // Diffuse into the unknown cells, then relax the whole field so the seams
  // between measured and filled areas do not show as edges.
  for (let pass=0; pass<400; pass++) {
    const next = cell.slice();
    for (let gy=0; gy<GH; gy++) for (let gx=0; gx<GW; gx++) {
      const i = gy*GW+gx;
      if (known[i]) continue;
      let s=[0,0,0], n=0;
      for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx=gx+dx, ny=gy+dy;
        if (nx<0||ny<0||nx>=GW||ny>=GH) continue;
        const j=ny*GW+nx; s[0]+=cell[j*3]; s[1]+=cell[j*3+1]; s[2]+=cell[j*3+2]; n++;
      }
      if (n) for (let k=0;k<3;k++) next[i*3+k]=s[k]/n;
    }
    cell.set(next);
  }
  const small = document.createElement('canvas'); small.width=GW; small.height=GH;
  const sx = small.getContext('2d');
  const sd = sx.createImageData(GW,GH);
  for (let i=0;i<GW*GH;i++) {
    sd.data[i*4]=Math.round(cell[i*3]); sd.data[i*4+1]=Math.round(cell[i*3+1]);
    sd.data[i*4+2]=Math.round(cell[i*3+2]); sd.data[i*4+3]=255;
  }
  sx.putImageData(sd,0,0);

  const big = document.createElement('canvas'); big.width=W; big.height=H;
  const bx = big.getContext('2d');
  bx.imageSmoothingEnabled=true; bx.imageSmoothingQuality='high';
  bx.filter = 'blur(10px)';
  bx.drawImage(small, 0, 0, W, H);
  bx.filter = 'none';
  const url = big.toDataURL('image/png');
  const bd = big.getContext('2d').getImageData(0,0,W,H).data;
  const at = (px,py) => { const i=(py*W+px)*4; return [bd[i],bd[i+1],bd[i+2]]; };
  return { url, grid: GW+'x'+GH, knownCells: known.reduce((a,b)=>a+b,0), totalCells: GW*GH,
    check: { topLeft: at(40,40), topMid: at(600,30), midLeft: at(40,315),
      bottomLeft: at(40,600), bottomMid: at(600,610), bottomRight: at(1160,600), topRight: at(1160,40) } };
})()`);
fs.writeFileSync('og-bg.png', Buffer.from(out.url.split(',')[1],'base64'));
console.log('grid', out.grid, ' measured cells', out.knownCells + '/' + out.totalCells);
console.log('reconstructed vs original at the same points:');
const orig = { topLeft:[10,8,11], topMid:[30,19,36], midLeft:[17,12,18], bottomLeft:[45,30,49],
  bottomMid:[25,17,28], bottomRight:[10,8,11], topRight:[11,9,12] };
for (const [k,v] of Object.entries(out.check)) {
  const o = orig[k];
  const err = Math.max(...v.map((n,i)=>Math.abs(n-o[i])));
  console.log('  ', k.padEnd(12), 'rebuilt rgb(' + v.join(',') + ')  original rgb(' + o.join(',') + ')  max diff ' + err);
}
ws.close(); chrome.kill();
