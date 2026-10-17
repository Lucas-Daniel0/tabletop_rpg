/* ---------- fundos animados em canvas: Sangue (gotas que se soltam) e Medo (névoa texturizada) ----------
   Sangue: cada fio escorre numa trilha que ondula (meandro), engrossa a ponta, afina o pescoço (Plateau–Rayleigh),
   solta uma gota que cai com gravidade, balança e, às vezes, deixa um rastro fino ou perolas pequenas; o resto recua.
   Parte dos fios, em vez de soltar gota, empaca no meio do caminho e se espalha. Valores em research_notes/. */

/* fundo do Sangue: GIF pixel art ancorado embaixo (escala inteira = pixels nítidos) + lua vermelha desenhada na mesma grade, à direita */
function bloodMoonCanvas() {
  const N = 72, cv = document.createElement('canvas'); cv.width = cv.height = N; const x = cv.getContext('2d'), c0 = 36, R = 21;
  const LV = ['#7c1620', '#98222a', '#b23034', '#cc4442', '#e8544c', '#ff7a6c'], B = [[0, 2], [3, 1]], L = [-.55, -.7, .45], ln = Math.hypot(...L);
  const craters = [[-7, -6, 4.5], [7, 4, 5.5], [-2, 10, 3.2], [10, -8, 2.8], [-12, 4, 2.5]];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const dx = i + .5 - c0, dy = j + .5 - c0, d = Math.hypot(dx, dy);
    if (d < R) {
      const nx = dx / R, ny = dy / R, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)), lam = Math.max(0, (nx * L[0] + ny * L[1] + nz * L[2]) / ln);
      let lv = lam < .14 ? 0 : lam < .3 ? 1 : lam < .5 ? 2 : lam < .72 ? 3 : lam < .9 ? 4 : 5; if (d > R - 1.2 && lv > 1) lv -= 1;
      for (const [cx, cy, cr] of craters) { const q = Math.hypot(dx - cx, dy - cy); if (q < cr) lv -= 1; }
      x.fillStyle = LV[Math.max(0, Math.min(5, lv))]; x.fillRect(i, j, 1, 1);
    } else if (d < R + 14) {
      const k = (d - R) / 14, a = k < .3 ? .2 : k < .62 ? .11 : .05;
      { x.fillStyle = 'rgba(255,110,100,' + a + ')'; x.fillRect(i, j, 1, 1); }
    }
  }
  return cv;
}
function bloodScene(box) {
  const bg = document.createElement('i'); bg.className = 'bgp'; bg.style.backgroundImage = 'url(' + BLOOD_GIF + ')';
  const mn = bloodMoonCanvas(); mn.className = 'bm'; box.append(bg, mn);
  const place = () => {
    const W = innerWidth, H = innerHeight, s = Math.ceil(Math.max(W / 256, H / 224)), ox = (W - 256 * s) / 2, oy = H - 224 * s;
    bg.style.backgroundSize = 256 * s + 'px ' + 224 * s + 'px';
    const narrow = W < 700, ms = narrow ? Math.max(2, s - 1) : s;
    const cx = W * (narrow ? .78 : .84), cy = H * (narrow ? .115 : .3);
    mn.style.width = mn.style.height = 72 * ms + 'px';
    mn.style.left = Math.round(cx / ms - 36) * ms + 'px'; mn.style.top = Math.round(cy / ms - 36) * ms + 'px';
  };
  place(); const on = () => { if (!box.isConnected) { removeEventListener('resize', on); return; } place(); }; addEventListener('resize', on);
}

function bloodFx(box) {
  const cv = document.createElement('canvas'); cv.className = 'bc'; box.append(cv);
  const ctx = cv.getContext('2d'); if (!ctx) return;
  const rnd = Math.random, lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), sm = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const TONE = [['#4a050d', '#7d0a18', '#a5101f'], ['#5c0711', '#a31021', '#cf2535'], ['#350409', '#640710', '#8f1322']], SL = [4, 20, 36, 58, 75, 90];
  let VW = 1, VH = 1, dpr = 1, FL = 0;
  const size = () => { dpr = 1 / Math.max(1, Math.round(Math.ceil(Math.max(innerWidth / 256, innerHeight / 224)) / 2)); VW = Math.max(320, innerWidth); VH = Math.max(320, innerHeight); FL = VH - 9 * Math.ceil(Math.max(VW / 256, VH / 224)); cv.width = Math.round(VW * dpr); cv.height = Math.round(VH * dpr); };
  size();
  const drops = [], beads = [], later = [], sparks = [], puddles = [];
  const neckRel = u => u < .55 ? .88 * Math.exp(-Math.log(.88 / .20) / .55 * u) : u < .85 ? .20 + (.08 - .20) * (u - .55) / .30 : .08 * Math.pow(Math.max(0, 1 - (u - .85) / .15), 2 / 3);

  /* trilha: x em função de y (fixa depois de desenhada); soma de ondas + empurrões de defeitos da parede */
  function makePath(r) {
    const W = r.W, st = 8, n = Math.ceil((VH + 260) / st), arr = new Float32Array(n);
    const A1 = W * (.12 + rnd() * .28), l1 = W * (20 + rnd() * 16), A2 = W * (.04 + rnd() * .07), l2 = W * (7 + rnd() * 5), p1 = rnd() * 6.28, p2 = rnd() * 6.28;
    const kn = []; let ky = -80, kv = 0; while (ky < VH + 200) { kn.push([ky, kv]); ky += W * (6 + rnd() * 12); kv = clamp(kv + (rnd() * 2 - 1) * W * .3, -W * .55, W * .55); }
    for (let i = 0; i < n; i++) {
      const y = i * st - 80; let k = 0; for (let j = 0; j < kn.length - 1; j++) if (y >= kn[j][0] && y <= kn[j + 1][0]) { k = lerp(kn[j][1], kn[j + 1][1], sm((y - kn[j][0]) / (kn[j + 1][0] - kn[j][0]))); break; }
      arr[i] = r.x0 + A1 * Math.sin(y / l1 * 6.2832 + p1) + A2 * Math.sin(y / l2 * 6.2832 + p2) + k;
    }
    r.px = arr; r.pst = st;
  }
  const px = (r, y) => { const f = (y + 80) / r.pst, i = clamp(Math.floor(f), 0, r.px.length - 2); return lerp(r.px[i], r.px[i + 1], clamp(f - i, 0, 1)); };

  function reset(r) {
    r.W = Math.round(10 + rnd() * 8); r.a = r.W / 2; r.x0 = clamp(VW * (SL[r.i] + (rnd() - .5) * 4) / 100, r.W * 2.5, VW - r.W * 2.5); makePath(r);
    r.st = 'adv'; r.t = 0; r.alpha = 1; r.v = VH * (.11 + rnd() * .05); r.pinchY = VH * (.28 + rnd() * .34); r.stallY = VH * (.34 + rnd() * .22);
    r.goal = r.mode === 'fall' ? r.pinchY - VH * .05 : r.stallY; r.hh = r.W * .75; r.ry = r.hh * 1.3; r.sh = r.hh * 2.2; r.n = r.a * .88; r.thr = 0; r.fl = 0; r.tipY = -r.ry - r.sh - 20;
    r.pauses = []; for (let j = rnd() * 3 | 0; j > 0; j--) r.pauses.push(VH * (.08 + rnd() * .22)); r.pauses.sort((a, b) => a - b); r.pz = 0; r.bo = 1; r.vs = 0;
    const q = rnd(); r.trail = q < .42 ? 'film' : q < .84 ? 'beads' : 'none';
  }
  const R = SL.map((p, i) => ({ i, mode: 'fall', st: 'wait', t: -(rnd() * 5), tone: TONE[i % 3] }));

  function pinch(r) {
    const cy = r.tipY - r.ry, hh = r.hh, rr = Math.sqrt(hh * r.ry);
    drops.push({ x: px(r, cy), y: cy, vy: r.vs + 25, vx: (rnd() - .5) * 90, r: rr, tt: 0, ph: rnd() * 6.28, tone: r.tone, trail: r.trail, pts: [], ta: 1.6, dead: false, dist: 0, spc: rr * (3.2 + rnd() * 3), film: r.trail === 'film' });
    if (rnd() < .7) { const ty = r.tipY - r.ry - r.sh - r.thr * .5, d = .03 + rnd() * .08; later.push({ t: d, fn: () => drops.push({ x: px(r, ty), y: ty, vy: Math.max(10, r.vs - 10), vx: (rnd() - .5) * 50, r: rr * (.1 + rnd() * .1), tt: 0, ph: rnd() * 6.28, tone: r.tone, trail: 'none', pts: [], ta: 0, dead: false, dist: 0, spc: 1e9, film: false, sat: true }) }); }
    r.st = 'stub'; r.t = 0; r.ye = r.tipY - r.ry - r.sh; r.n0 = Math.max(.6, r.n); r.thr0 = r.thr; r.fl0 = r.fl;
  }
  function step(dt) {
    for (let i = later.length - 1; i >= 0; i--) { later[i].t -= dt; if (later[i].t <= 0) { later[i].fn(); later.splice(i, 1); } }
    for (const r of R) {
      r.t += dt; const a = r.a;
      if (r.st === 'wait') { if (r.t >= 0) reset(r); continue; }
      if (r.st === 'adv') {
        let v = r.v * clamp(r.t / 1.2, .25, 1);
        if (r.pz > 0) { r.pz -= dt; v *= .06; if (r.pz <= 0) r.bo = 1.6; } else { if (r.bo > 1) { r.bo = Math.max(1, r.bo - dt * .8); v *= r.bo; } if (r.pauses.length && r.tipY > r.pauses[0]) { r.pauses.shift(); r.pz = .35 + rnd() * .45; } }
        if (r.mode === 'stall') v *= clamp((r.goal - r.tipY) / (VH * .1), .12, 1);
        r.tipY += v * dt; if (r.tipY >= r.goal - .5) { r.st = 'swell'; r.t = 0; r.s0 = r.hh; }
      } else if (r.st === 'swell') {
        const dur = 1.3, s = sm(r.t / dur);
        if (r.mode === 'fall') { r.hh = r.W * (.75 + .23 * s); r.ry = r.hh * (1.3 + .25 * s); r.sh = r.hh * 2.2; r.n = a * (.88 - .13 * s); r.fl = r.hh * 1.2 * s; r.tipY += r.v * .22 * (1 - s) * dt; }
        else { r.hh = r.W * (.75 + .35 * s); r.ry = r.hh * (1.3 - .5 * s); r.sh = r.hh * (2.2 - .6 * s); r.n = a * .88; r.tipY += r.v * .08 * (1 - s) * dt; }
        if (r.t >= dur) { r.st = r.mode === 'fall' ? 'neck' : 'disp'; r.t = 0; r.vs = 0; r.nStart = r.n; }
      } else if (r.st === 'neck') {
        const dur = .95, u = clamp(r.t / dur, 0, 1);
        r.n = r.nStart * neckRel(u) / .88; r.thr = 3 * r.hh * u * u; r.fl = r.hh * (1.2 + .6 * sm(u)); r.vs += 140 * dt; r.tipY += (r.v * .12 + r.vs) * dt;
        if (u >= 1) pinch(r);
      } else if (r.st === 'stub') {
        const t = r.t, s = sm(t / .5), R0 = .7 * r.thr0;
        r.hh = lerp(r.n0, a * 1.12, s); r.ry = r.hh * 1.3; r.sh = lerp(.5, a * 2, s); r.n = lerp(r.n0, a * .88, s); r.thr = r.thr0 * (1 - s); r.fl = Math.max(r.fl0 * (1 - s), 0);
        const creep = clamp((t - .9) / 1.5, 0, 1) * 18;
        r.tipY = r.ye - R0 * (1 - Math.exp(-t / .12) * Math.cos(6.2832 * t / .4)) + creep;
        r.alpha = 1 - sm((t - 1.3) / 2.1); if (t > 3.6) { r.st = 'wait'; r.t = -(.5 + rnd() * 2.6); r.mode = 'fall'; }
      } else if (r.st === 'disp') {
        const dur = 2.6, s = sm(r.t / dur); const h0 = r.W * 1.1;
        r.hh = h0 * (1 + .75 * s); r.ry = r.W * 1.1 * .8 * (1 - .55 * s); r.sh = r.hh * 1.6; r.alpha = 1 - sm((r.t - .5) / 2.0);
        if (!r.bd && r.t > .5) { r.bd = 1; for (let j = 2 + (rnd() * 2 | 0); j > 0; j--) { const y = r.tipY + r.W * (.4 + rnd() * 1.3), x = px(r, r.tipY) + (rnd() - .5) * r.W * 1.6; beads.push({ x, y, r: r.W * (.07 + rnd() * .1), age: 0, life: 2.6 + rnd() * 1.2, tone: r.tone }); } }
        if (r.t >= dur + .2) { r.st = 'wait'; r.bd = 0; r.t = -(.5 + rnd() * 2.6); r.mode = rnd() < .8 ? 'fall' : r.mode; }
      }
    }
    const g = VH * 3.8;
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i]; d.tt += dt;
      if (!d.dead) {
        d.vy = Math.min(d.vy + g * dt, VH * 2.4); const ox = d.x, oy = d.y; d.y += d.vy * dt; d.x += (d.vx + Math.sin(d.tt * 3.2 + d.ph) * 16) * dt;
        const last = d.pts[d.pts.length - 1]; if (!last || Math.hypot(d.x - last.x, d.y - last.y) > 6) d.pts.push({ x: d.x, y: d.y });
        d.dist += d.y - oy;
        if (d.trail === 'beads' && d.dist > d.spc && d.r > 5) { d.dist = 0; const br = d.r * (.12 + rnd() * .2); beads.push({ x: d.x + (rnd() - .5) * d.r * .7, y: d.y - d.r * 1.1, r: br, age: 0, life: 2.4 + rnd() * 2.2, tone: d.tone }); d.r *= Math.sqrt(Math.max(.2, 1 - (br / d.r) * (br / d.r))); d.spc = d.r * (3.2 + rnd() * 3); }
        if (d.y + d.r * .7 >= FL) { splash(d); d.dead = true; }
      } else d.ta -= dt / 1.8;
      if (d.dead && (d.ta <= 0 || !d.film)) drops.splice(i, 1);
    }
    for (let i = beads.length - 1; i >= 0; i--) { beads[i].age += dt; if (beads[i].age > beads[i].life) beads.splice(i, 1); }
    stepSplash(dt);
  }


  /* impacto no chão: a gota achata numa poça, a coroa lança gotículas em arco que caem e pousam miúdas */
  function splash(d) {
    const r = d.r, spd = clamp(d.vy / (VH * 1.6), .35, 1.3); if (r < 1.5) return;
    if (r > 3.5) puddles.push({ x: d.x, r, age: 0, life: .9 + r / 22, tone: d.tone });
    const n = r < 5 ? 2 : clamp(Math.round(r / 2.2) + 3, 5, 11);
    for (let i = 0; i < n; i++) {
      const ang = (rnd() - .5) * 2.3, sp = VH * (.25 + rnd() * .6) * spd * 1.35, big = i < 2 && r > 6;
      sparks.push({ x: d.x + (rnd() - .5) * r * .8, y: FL - 2, vx: sp * Math.sin(ang) * 1.15, vy: -sp * Math.cos(ang), r: Math.max(1.6, r * (big ? .22 + rnd() * .1 : .08 + rnd() * .13)), tone: d.tone, st: 0, age: 0, life: 1.1 + rnd() * 1.4 });
    }
  }
  function stepSplash(dt) {
    const g = VH * 3.8;
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i]; p.age += dt;
      if (p.st === 0) { p.vy += g * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.vy > 0 && p.y >= FL - p.r * .4) { p.st = 1; p.y = FL - p.r * .35; p.age = Math.min(p.age, p.life * .35); } }
      if (p.age > p.life) sparks.splice(i, 1);
    }
    for (let i = puddles.length - 1; i >= 0; i--) { puddles[i].age += dt; if (puddles[i].age > puddles[i].life) puddles.splice(i, 1); }
  }
  function drawSplash(layer) {
    if (layer === 0) {
      for (const q of puddles) {
        const u = q.age / q.life, e = sm(q.age / .3), rx = q.r * (1.1 + 2.6 * e), ry = Math.max(2.5, rx * .2), a = (1 - sm((u - .25) / .75)) * .85;
        ctx.globalAlpha = a; ctx.fillStyle = q.tone[2]; ctx.beginPath(); ctx.ellipse(q.x, FL, rx, ry, 0, 0, 6.2832); ctx.fill();
        ctx.fillStyle = q.tone[0]; ctx.globalAlpha = a * .7; ctx.beginPath(); ctx.ellipse(q.x + rx * .08, FL - .5, rx * .8, ry * .6, 0, 0, 6.2832); ctx.fill();
      }
      for (const p of sparks) if (p.st === 1) {
        const a = 1 - sm((p.age - p.life * .45) / (p.life * .55)); if (a <= .01) continue;
        ctx.globalAlpha = a * .9; ctx.fillStyle = p.tone[1]; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * 1.7, Math.max(.8, p.r * .55), 0, 0, 6.2832); ctx.fill();
      }
    } else for (const p of sparks) if (p.st === 0) {
      const v = Math.hypot(p.vx, p.vy), st = 1 + Math.min(.7, v / (VH * 2.2)); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx) + Math.PI / 2); ctx.scale(1 / Math.sqrt(st), st);
      ctx.globalAlpha = 1; ctx.fillStyle = p.tone[1]; ctx.beginPath(); ctx.arc(0, 0, Math.max(.9, p.r), 0, 6.2832); ctx.fill();
      ctx.fillStyle = 'rgba(255,170,160,.4)'; ctx.beginPath(); ctx.arc(-p.r * .3, -p.r * .3, Math.max(.4, p.r * .32), 0, 6.2832); ctx.fill(); ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  /* ---- desenho ---- */
  function prof(P, y) {
    const d = P.tipY - y; if (d < 0) return 0;
    if (d <= P.ry) { const q = (P.ry - d) / P.ry; return P.hh * Math.sqrt(Math.max(0, 1 - q * q)); }
    let e = d - P.ry; if (e <= P.sh) return lerp(P.hh, P.n, sm(e / P.sh));
    e -= P.sh; if (e <= P.thr) return P.n;
    e -= P.thr; if (e <= P.fl) return lerp(P.n, P.nS, sm(e / P.fl));
    const yJ = P.tipY - P.ry - P.sh - P.thr - P.fl; return yJ <= 0 ? P.nS : lerp(P.a, P.nS, clamp(y / yJ, 0, 1));
  }
  function body(r) {
    const P = { tipY: r.tipY, hh: r.hh, ry: r.ry, sh: r.sh, n: r.n, thr: r.thr, fl: r.fl, a: r.a, nS: r.a * .88 }, ys = [], yJ = P.tipY - P.ry - P.sh - P.thr - P.fl;
    for (let y = -8; y < Math.min(yJ, P.tipY); y += 14) ys.push(y);
    for (let y = Math.max(yJ, -8); y < P.tipY - P.ry; y += 3) ys.push(y);
    for (let k = 0; k <= 14; k++) ys.push(P.tipY - P.ry * (1 - Math.cos(Math.PI / 2 * (1 - k / 14))));
    if (ys.length < 3) return;
    const L = [], Rt = [], C = []; for (const y of ys) { const w = prof(P, y), x = px(r, y); C.push(x); L.push(x - w); Rt.push(x + w); }
    ctx.globalAlpha = r.alpha; const tn = r.tone;
    const path = () => { ctx.beginPath(); ctx.moveTo(L[0], ys[0]); for (let i = 1; i < ys.length; i++) ctx.lineTo(L[i], ys[i]); for (let i = ys.length - 1; i >= 0; i--) ctx.lineTo(Rt[i], ys[i]); ctx.closePath(); };
    path(); ctx.fillStyle = tn[1]; ctx.fill();
    ctx.save(); path(); ctx.clip();
    ctx.lineJoin = 'round'; ctx.strokeStyle = tn[0]; ctx.globalAlpha = r.alpha * .6; ctx.lineWidth = Math.max(3, r.W * .22); ctx.stroke(); ctx.globalAlpha = r.alpha;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const strip = (k, col, w) => { ctx.beginPath(); for (let i = 0; i < ys.length; i++) { const x = C[i] + k * (Rt[i] - C[i]); i ? ctx.lineTo(x, ys[i]) : ctx.moveTo(x, ys[i]); } ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); };
    strip(.55, 'rgba(18,0,3,.28)', r.W * .26); strip(-.5, tn[2], r.W * .2); strip(-.55, 'rgba(255,150,140,.20)', Math.max(2, r.W * .09));
    const gy = r.tipY - r.ry * 1.05, gx = px(r, gy) - r.hh * .38; ctx.fillStyle = 'rgba(255,178,170,.42)'; ctx.beginPath(); ctx.ellipse(gx, gy, Math.max(1.3, r.hh * .16), Math.max(2.2, r.ry * .34), .06, 0, 6.2832); ctx.fill();
    ctx.restore();
    if (P.thr > 0 && P.n < 1.5) { ctx.beginPath(); const y0 = P.tipY - P.ry - P.sh, y1 = y0 - P.thr; ctx.moveTo(px(r, y0), y0); ctx.lineTo(px(r, y1), y1); ctx.strokeStyle = tn[1]; ctx.globalAlpha = r.alpha * .75; ctx.lineWidth = Math.max(.8, P.n * 2); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }
  function film(d) {
    const p = d.pts, n = p.length; if (n < 2 || d.ta <= 0) return; const wt = d.r * .62; ctx.lineCap = 'round'; ctx.strokeStyle = d.tone[1];
    for (let i = 1; i < n; i++) { const q = i / n; ctx.globalAlpha = clamp(d.ta, 0, 1) * .58 * Math.pow(q, 1.3); ctx.lineWidth = Math.max(1, wt * (.3 + .7 * q)); ctx.beginPath(); ctx.moveTo(p[i - 1].x, p[i - 1].y); ctx.lineTo(p[i].x, p[i].y); ctx.stroke(); }
    if (!d.dead) { const l = p[n - 1]; ctx.globalAlpha = .58; ctx.lineWidth = wt; ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(d.x, d.y); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }
  function ball(x, y, r, tn, a, tail, sy) {
    if (r < .6) return; ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(1 / sy, sy);
    const gr = ctx.createRadialGradient(-r * .3, -r * .35, r * .1, 0, 0, r * 1.05); gr.addColorStop(0, tn[2]); gr.addColorStop(.6, tn[1]); gr.addColorStop(1, tn[0]);
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832); ctx.fill();
    if (tail > .02) { const ap = r * (1 + 1.5 * tail); ctx.beginPath(); ctx.moveTo(-.95 * r, -.31 * r); ctx.quadraticCurveTo(-.1 * r * tail, -(.31 * r + (ap - .31 * r) * .38), 0, -ap); ctx.quadraticCurveTo(.1 * r * tail, -(.31 * r + (ap - .31 * r) * .38), .95 * r, -.31 * r); ctx.lineTo(0, 0); ctx.closePath(); ctx.fillStyle = tn[1]; ctx.fill(); }
    ctx.fillStyle = 'rgba(255,182,174,.45)'; ctx.beginPath(); ctx.ellipse(-r * .36, -r * .34, Math.max(.8, r * .14), Math.max(1.2, r * .3), -.5, 0, 6.2832); ctx.fill();
    ctx.restore();
  }
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, VW, VH);
    drawSplash(0);
    for (const d of drops) if (d.film) film(d);
    for (const r of R) if (r.st !== 'wait' && r.alpha > .01) body(r);
    for (const b of beads) { const a = Math.min(1, b.age / .18) * (1 - sm((b.age - (b.life - 1)) / 1)); ball(b.x, b.y, b.r, b.tone, a, 0, 1); }
    for (const d of drops) if (!d.dead) { const wob = .2 * Math.exp(-d.tt / .25) * Math.cos(6.2832 * d.tt / .35), st = 1 + .25 * Math.min(1, d.vy / (VH * 2)), sy = (1 + wob) * st; ball(d.x, d.y, d.r, d.tone, 1, Math.max(0, 1 - d.tt / .14), sy); }
    drawSplash(1);
  }

  let last = 0, off = 0, n = 0; const resize = () => { size(); };
  addEventListener('resize', resize);
  const calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches ? .6 : 1;
  for (let t = 0; t < 7; t += 1 / 30) step(1 / 30);
  const frame = now => {
    if (!box.isConnected) { removeEventListener('resize', resize); return; }
    requestAnimationFrame(frame);
    if (document.hidden) { last = now; return; }
    if ((n++ & 15) === 0) off = getComputedStyle(box).display === 'none' ? 1 : 0;
    const dt = Math.min(.05, (now - last) / 1000 || .016); last = now; if (off) return;
    step(dt * calm); draw();
  };
  requestAnimationFrame(t => { last = t; frame(t); });
}

/* ---------- névoa do Medo: texturas de ruído (fbm) assadas uma vez e movidas em camadas ---------- */
const FOG_TILES = {};
function fogTile(key, seed, W, H, cx, cy, oct, mode) {
  if (FOG_TILES[key]) return FOG_TILES[key];
  const cvs = document.createElement('canvas'); cvs.width = W; cvs.height = H; const c = cvs.getContext('2d'); if (!c) return '';
  let s = seed; const rr = () => (s = (s * 16807) % 2147483647) / 2147483647, L = [];
  for (let o = 0; o < oct; o++) { const gx = cx * (1 << o), gy = cy * (1 << o), g = new Float32Array(gx * (gy + 1)); for (let i = 0; i < g.length; i++) g[i] = rr(); L.push({ gx, gy, g, amp: Math.pow(.56, o) }); }
  let tot = 0; for (const l of L) tot += l.amp;
  const im = c.createImageData(W, H), d = im.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let v = 0;
    for (const l of L) { const u = x / W * l.gx, w = y / H * l.gy, ix = Math.floor(u), iy = Math.floor(w), fx = u - ix, fy = w - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), x0 = ix % l.gx, x1 = (ix + 1) % l.gx, a = l.g[iy * l.gx + x0], b = l.g[iy * l.gx + x1], cc = l.g[(iy + 1) * l.gx + x0], dd = l.g[(iy + 1) * l.gx + x1]; v += l.amp * (a + (b - a) * sx + (cc - a + (a - b - cc + dd) * sx) * sy); }
    v /= tot; if (mode === 'wisp') v = 1 - Math.abs(2 * v - 1) * 1.15;
    const t = clamp01((v - (mode === 'wisp' ? .6 : .44)) / (mode === 'wisp' ? .26 : .2)), dens = t * t * (3 - 2 * t), k = (y * W + x) * 4, lum = 196 + 52 * v;
    d[k] = lum * .93 + 8; d[k + 1] = lum * .96 + 8; d[k + 2] = lum + 10; d[k + 3] = Math.round(255 * dens * (mode === 'wisp' ? .8 : 1));
  }
  c.putImageData(im, 0, 0); const url = 'url(' + cvs.toDataURL('image/png') + ')'; FOG_TILES[key] = url; return url;
}
function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
function fogFx(box) {
  const set = (cls, key, seed, cx, cy, oct, mode) => { const el = box.querySelector(cls); if (el) el.style.backgroundImage = fogTile(key, seed, 960, 320, cx, cy, oct, mode); };
  set('.m1', 'f1', 1234567, 3, 2, 6, 'cloud'); set('.m2', 'f2', 7654321, 4, 2, 6, 'cloud'); set('.m3', 'f3', 424242, 5, 2, 6, 'cloud'); set('.m4', 'f4', 99991, 4, 2, 6, 'wisp');
}
