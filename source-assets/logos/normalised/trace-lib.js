// Marching squares over a binary grid -> closed loops, then Ramer-Douglas-Peucker.
// Every ink/background transition becomes its own loop, so holes come out as
// subpaths and fill-rule evenodd resolves them without any special casing.
window.TRACE = {
  contours(bin, W, H) {
    const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : bin[y * W + x];
    const segs = [];
    for (let y = -1; y < H; y++) for (let x = -1; x < W; x++) {
      const tl = at(x, y), tr = at(x + 1, y), br = at(x + 1, y + 1), bl = at(x, y + 1);
      const c = (tl << 3) | (tr << 2) | (br << 1) | bl;
      if (c === 0 || c === 15) continue;
      const N = [x + 0.5, y], E = [x + 1, y + 0.5], S = [x + 0.5, y + 1], Wd = [x, y + 0.5];
      const push = (a, b) => segs.push([a, b]);
      switch (c) {
        case 1: push(Wd, S); break;
        case 2: push(S, E); break;
        case 3: push(Wd, E); break;
        case 4: push(E, N); break;
        case 5: push(Wd, N); push(S, E); break;   // saddle, resolved consistently
        case 6: push(S, N); break;
        case 7: push(Wd, N); break;
        case 8: push(N, Wd); break;
        case 9: push(N, S); break;
        case 10: push(N, E); push(S, Wd); break;  // saddle
        case 11: push(N, E); break;
        case 12: push(E, Wd); break;
        case 13: push(E, S); break;
        case 14: push(S, Wd); break;
      }
    }
    // Chain segments head-to-tail into closed loops.
    const key = p => p[0].toFixed(1) + ',' + p[1].toFixed(1);
    const from = new Map();
    for (const s of segs) {
      const k = key(s[0]);
      if (!from.has(k)) from.set(k, []);
      from.get(k).push(s);
    }
    const used = new Set();
    const loops = [];
    for (const s of segs) {
      if (used.has(s)) continue;
      const loop = [s[0]];
      let cur = s;
      while (cur && !used.has(cur)) {
        used.add(cur);
        loop.push(cur[1]);
        const next = (from.get(key(cur[1])) || []).find(t => !used.has(t));
        cur = next;
      }
      if (loop.length > 8) loops.push(loop);
    }
    return loops;
  },

  rdp(pts, eps) {
    if (pts.length < 3) return pts;
    // A closed loop starts and ends on the same point, so the very first
    // split line has zero length and every distance to it measures zero:
    // the whole loop collapses to two points. Seed it by splitting at the
    // vertex farthest from the start, which gives both halves a real chord.
    const first = pts[0], last = pts[pts.length - 1];
    if (Math.hypot(first[0] - last[0], first[1] - last[1]) < 1e-6) {
      let far = 0, fd = -1;
      for (let i = 1; i < pts.length - 1; i++) {
        const dd = Math.hypot(pts[i][0] - first[0], pts[i][1] - first[1]);
        if (dd > fd) { fd = dd; far = i; }
      }
      if (far > 0) {
        const a = TRACE.rdp(pts.slice(0, far + 1), eps);
        const b = TRACE.rdp(pts.slice(far), eps);
        return a.concat(b.slice(1));
      }
    }
    const d = (p, a, b) => {
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const L = Math.hypot(dx, dy) || 1e-9;
      return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / L;
    };
    const run = (s, e) => {
      let mx = 0, mi = -1;
      for (let i = s + 1; i < e; i++) { const dd = d(pts[i], pts[s], pts[e]); if (dd > mx) { mx = dd; mi = i; } }
      if (mx > eps) return [...run(s, mi), ...run(mi, e).slice(1)];
      return [pts[s], pts[e]];
    };
    return run(0, pts.length - 1);
  },

  // Closed loops as one path, smoothed with quadratics through midpoints so the
  // traced outline does not read as a polygon at large sizes.
  toPath(loops, eps, scale, ox, oy) {
    const f = n => (Math.round(n * 100) / 100);
    let out = '';
    for (const raw of loops) {
      const p = TRACE.rdp(raw, eps).map(q => [q[0] * scale + ox, q[1] * scale + oy]);
      if (p.length < 4) continue;
      const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      let m = mid(p[p.length - 1], p[0]);
      out += `M${f(m[0])} ${f(m[1])}`;
      for (let i = 0; i < p.length; i++) {
        const cur = p[i], nxt = p[(i + 1) % p.length];
        const mm = mid(cur, nxt);
        out += `Q${f(cur[0])} ${f(cur[1])} ${f(mm[0])} ${f(mm[1])}`;
      }
      out += 'Z';
    }
    return out;
  },
};
