'use strict';
/* ===== lights.js — elementos luminosos =====
   Cada luz: { kind, x, y, r (raio em px de mundo), color, intensity 0..1, dir (graus, 0 = →, 90 = ↓),
               spread (abertura em graus; 360 = todas as direções), flicker, on }
   Tipos: natural (só luz, sem ícone), tocha, poste, lamparina, luz de teto, led. */

const LIGHT_TYPES = {
  natural: { name: 'Fonte natural', size: 0, r: 6, color: '#fff1cf', intensity: .85, spread: 360, flicker: false, note: 'Só a luz, sem ícone (lua, brilho, janela…)' },
  torch: { name: 'Tocha', size: .85, r: 5, color: '#ff9a3a', intensity: .95, spread: 360, flicker: true, anim: true },
  post: { name: 'Poste', size: .95, r: 8, color: '#ffe7ac', intensity: .9, spread: 360, flicker: false },
  lamp: { name: 'Lamparina', size: .6, r: 3.5, color: '#ffb347', intensity: .9, spread: 360, flicker: true, anim: true },
  ceiling: { name: 'Luz de teto', size: .85, r: 6, color: '#f6f2e4', intensity: .85, spread: 360, flicker: false },
  led: { name: 'Led', size: .7, r: 5, color: '#8fe3ff', intensity: .9, spread: 90, flicker: false, rot: true }
};
const LIGHT_ORDER = ['natural', 'torch', 'post', 'lamp', 'ceiling', 'led'];
function lightKind(l) { return LIGHT_TYPES[l.kind] ? l.kind : 'lamp'; }
function lightDefaults(kind, grid) { const T = LIGHT_TYPES[kind] || LIGHT_TYPES.lamp; return { kind, r: T.r * (grid || 48), color: T.color, intensity: T.intensity, spread: T.spread, flicker: T.flicker, dir: kind === 'led' ? 90 : 0 }; }
function lightAnimated(l) { const T = LIGHT_TYPES[lightKind(l)]; return l.on !== false && (l.flicker || T.anim); }
function lightFlick(l, time) { return l.flicker ? (.82 + .12 * Math.sin(time / 83 + l.x) + .06 * Math.sin(time / 37 + l.y)) : 1; }

/* Preenche a luz com um gradiente radial restrito ao cone. mode 'cut' acumula por destination-out; 'add' por screen.
   Vários cones sobrepostos, cada vez mais estreitos, dão uma borda suave. */
function lightPaint(c, l, I, stops, mode) {
  const sp = clamp(l.spread == null ? 360 : l.spread, 8, 360), dir = (l.dir || 0) * Math.PI / 180, R = l.r;
  const mk = (i, rr) => { const g = c.createRadialGradient(l.x, l.y, 0, l.x, l.y, rr); for (const s of stops(i, rr)) g.addColorStop(s[0], s[1]); return g; };
  if (sp >= 359) { c.fillStyle = mk(I, R); c.fillRect(l.x - R, l.y - R, R * 2, R * 2); return; }
  const f = [1, .9, .8, .7, .6, .5, .4, .3], n = f.length, Ik = mode === 'cut' ? 1 - Math.pow(1 - I, 1 / n) : Math.min(1, I / n * 1.2);
  c.fillStyle = mk(Ik, R);
  for (const k of f) { const half = sp * k / 2 * Math.PI / 180; c.beginPath(); c.moveTo(l.x, l.y); c.arc(l.x, l.y, R, dir - half, dir + half); c.closePath(); c.fill(); }
  const r0 = Math.min(R * .22, 40); c.fillStyle = mk(I * .9, r0); c.beginPath(); c.arc(l.x, l.y, r0, 0, 6.2832); c.fill();
}
const lightCutStops = (i) => [[0, 'rgba(0,0,0,' + i + ')'], [.4, 'rgba(0,0,0,' + i * .85 + ')'], [1, 'rgba(0,0,0,0)']];
const lightGlowStops = col => i => [[0, rgba(col, .34 * i)], [.5, rgba(col, .12 * i)], [1, rgba(col, 0)]];

/* ---------- sprites pixelados ---------- */
const LSPR = new Map();
const LIGHT_DRAW = {
  torch(P, W, H, o) {
    const cx = W / 2, cy = H / 2 + 1, f = o.frame | 0; if (o.on) P.glow(cx, cy - 1, 8, o.rp.m, .5); P.shadowE(cx, cy, 5.5, 5.5, 1, 2, .5);
    P.ell(cx, cy, 6, 6, OUTC); P.ell(cx, cy, 5, 5, IRON.m); P.ring(cx, cy, 5, 5, IRON.l1, 1); P.ell(cx, cy, 3.6, 3.6, '#241a14'); P.ell(cx, cy, 2.6, 2.6, WOODR.m); P.p(cx - 1, cy - 1, WOODR.l2); P.p(cx + 1, cy + 1, WOODR.d1);
    P.f(cx - 6, cy - 1, 2, 2, IRON.d1);
    if (o.on) {
      const sh = [0, 1, 0, -1][f % 4], H1 = [6, 7, 6, 8][f % 4];
      P.poly([[cx - 3, cy + 1], [cx + sh - 1, cy - H1], [cx + 3, cy + 1]], '#ff6a1a'); P.poly([[cx - 2, cy + 1], [cx + sh, cy - H1 + 2], [cx + 2, cy + 1]], '#ffb83a'); P.poly([[cx - 1, cy + 1], [cx + sh, cy - 2], [cx + 1, cy + 1]], '#fff2a0');
      P.p(cx + 4 + sh, cy - 6 - f % 3, '#ffb04a'); P.p(cx - 4 - sh, cy - 4 - (f + 1) % 3, '#ff7a1e');
    } else { P.ell(cx, cy, 1.6, 1.6, '#0c0806'); P.p(cx + 2, cy - 4, '#6a6a72'); P.p(cx + 3, cy - 6, '#55555c'); }
  },
  post(P, W, H, o) {
    const cx = W / 2, cy = H / 2; if (o.on) P.glow(cx, cy, 9, o.rp.m, .5); P.shadowE(cx, cy, 6, 6, 1, 2, .5);
    P.ell(cx, cy, 7, 7, OUTC); P.ell(cx, cy, 6, 6, IRON.m); P.ring(cx, cy, 6, 6, IRON.l1, 1); P.dithE(cx + 1, cy + 2, 5, 4, IRON.d2, .5);
    P.ell(cx, cy, 4.2, 4.2, OUTC);
    if (o.on) { P.ell(cx, cy, 3.6, 3.6, o.rp.l1); P.ell(cx, cy, 2.4, 2.4, o.rp.l3); P.ell(cx, cy, 1.2, 1.2, '#fff'); }
    else { P.ell(cx, cy, 3.6, 3.6, '#394048'); P.ell(cx - 1, cy - 1, 1.4, 1.4, '#59616a'); }
    P.line(cx - 3, cy, cx + 3, cy, IRON.d2); P.line(cx, cy - 3, cx, cy + 3, IRON.d2);
    P.f(cx - 8, cy - 1, 2, 3, IRON.d1); P.f(cx + 6, cy - 1, 2, 3, IRON.d1);
  },
  lamp(P, W, H, o) {
    const cx = W / 2, cy = H / 2, f = o.frame | 0; if (o.on) P.glow(cx, cy, 6, o.rp.m, .55); P.shadowE(cx, cy + 1, 3.6, 3.4, 1, 1, .5);
    P.f(cx + 3, cy - 1, 3, 3, OUTC); P.f(cx + 4, cy, 1, 1, GOLD.l1);
    P.ell(cx, cy, 4, 4, OUTC); P.ell(cx, cy, 3.1, 3.1, GOLD.m); P.ring(cx, cy, 3.1, 3.1, GOLD.l1, 1); P.p(cx - 2, cy - 2, GOLD.l3); P.p(cx + 2, cy + 1, GOLD.d1);
    if (o.on) { P.ell(cx, cy, 2, 2, o.rp.l2); P.p(cx + ((f % 3) === 1 ? 1 : 0) - 0, cy - 1 - (f % 2), '#fff6c0'); P.p(cx, cy, '#fff'); }
    else P.ell(cx, cy, 1.6, 1.6, '#4a3a22');
  },
  ceiling(P, W, H, o) {
    const cx = W / 2, cy = H / 2; if (o.on) P.glow(cx, cy, 9, o.rp.m, .5); P.shadowE(cx, cy, 6, 6, 1, 2, .45);
    P.ell(cx, cy, 7, 7, OUTC); P.ell(cx, cy, 6, 6, '#9aa0a8'); P.ring(cx, cy, 6, 6, '#d0d4da', 1); P.dithE(cx + 1, cy + 2, 5, 4, '#6e747c', .5);
    for (const [a, b] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) P.p(cx + a, cy + b, '#5a6068');
    if (o.on) { P.ell(cx, cy, 4, 4, o.rp.l1); P.ell(cx, cy, 2.8, 2.8, o.rp.l3); P.ell(cx, cy, 1.6, 1.6, '#fff'); }
    else { P.ell(cx, cy, 4, 4, '#555c64'); P.ell(cx - 1, cy - 1, 1.6, 1.6, '#767e88'); }
  },
  led(P, W, H, o) { // desenhado apontando para a direita; o sprite é girado pela direção da luz
    const cy = H / 2; if (o.on) P.glow(W - 3, cy, 7, o.rp.m, .6); P.shadowR(2, cy - 3, 8, 7, 1, 1, .45);
    P.box(1, cy - 4, 7, 8, IRON, { cut: 1 }); P.f(2, cy - 2, 2, 4, IRON.d2);
    if (o.on) { P.f(8, cy - 3, 3, 6, OUTC); P.f(8, cy - 2, 2, 4, o.rp.l2); P.f(9, cy - 1, 1, 2, '#fff'); }
    else { P.f(8, cy - 3, 3, 6, OUTC); P.f(8, cy - 2, 2, 4, '#394048'); }
  }
};

function drawLightSprite(ctx, l, grid, time, s) {
  const kind = lightKind(l), T = LIGHT_TYPES[kind]; if (!T.size || !LIGHT_DRAW[kind]) return;
  const on = l.on !== false, AW = Math.round(T.size * PX), AH = T.rot ? AW : AW, pad = 5, frame = (on && T.anim) ? Math.floor((time || 0) / 150) % 4 : 0;
  const col = l.color || T.color, key = [kind, on ? 1 : 0, frame, col].join('|');
  let ent = LSPR.get(key);
  if (!ent) {
    const P = new Pix(AW, AH, pad, rng(3)), rp = RP(col);
    try { LIGHT_DRAW[kind](P, AW, AH, { on, frame, rp, color: col }); } catch (err) { if (typeof console !== 'undefined') console.error('luz falhou', kind, err); }
    ent = { cv: P.cv }; LSPR.set(key, ent); if (LSPR.size > 400) LSPR.delete(LSPR.keys().next().value);
  }
  const sc = (grid || 48) / PX, w = (AW + 2 * pad) * sc, hh = (AH + 2 * pad) * sc;
  ctx.save(); ctx.translate(l.x, l.y); if (T.rot) ctx.rotate((l.dir || 0) * Math.PI / 180);
  ctx.imageSmoothingEnabled = sc * (s || 1) < 1.05; ctx.drawImage(ent.cv, -w / 2, -hh / 2, w, hh); ctx.restore();
}

/* miniatura (para o painel) */
function lightThumb(kind) {
  const S = 76, c = document.createElement('canvas'); c.width = S * 2; c.height = S * 2; c.style.cssText = 'width:' + S + 'px;height:' + S + 'px';
  const x = c.getContext('2d'); x.fillStyle = '#12141a'; x.fillRect(0, 0, S * 2, S * 2);
  const T = LIGHT_TYPES[kind], l = Object.assign({ x: S, y: S, on: true }, lightDefaults(kind, 48)); l.r = S * .95; l.dir = 0;
  x.globalCompositeOperation = 'screen'; lightPaint(x, l, .95, lightGlowStops(l.color), 'add'); x.globalCompositeOperation = 'source-over';
  if (T.size) { x.save(); x.translate(S, S); x.scale(2, 2); x.translate(-S, -S); drawLightSprite(x, l, 48 * 0.8, 450, 1); x.restore(); }
  else { x.strokeStyle = 'rgba(255,241,207,.7)'; x.setLineDash([4, 4]); x.beginPath(); x.arc(S, S, 14, 0, 6.28); x.stroke(); }
  return c;
}
