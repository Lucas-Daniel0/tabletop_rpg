'use strict';
/* ===== art.js — kit de pixel art procedural =====
   Estilo: top-down em pixel art com contorno escuro, sombreamento em 5 tons com troca de matiz
   (sombras frias/roxas, luzes quentes), sombras projetadas e texturas com "dither".
   1 célula = PX pixels de arte; o resultado é ampliado sem suavização. */

const PX = 16;
const OUTC = '#150e1b';

function makeRamp(hex) {
  return {
    d3: mix(shade(hex, -.66), '#1a1030', .34), d2: mix(shade(hex, -.45), '#2a1b48', .2), d1: mix(shade(hex, -.22), '#3a2a66', .1),
    m: hex, l1: mix(shade(hex, .17), '#ffe6a8', .1), l2: mix(shade(hex, .36), '#fff0c4', .18), l3: mix(shade(hex, .58), '#fff8e2', .3)
  };
}
const RAMPS = {};
function RP(hex) { hex = hex || '#808080'; return RAMPS[hex] || (RAMPS[hex] = makeRamp(hex)); }
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bay = (x, y) => (BAYER[((y & 3) << 2) | (x & 3)] + .5) / 16;

class Pix {
  constructor(W, H, pad, R) {
    this.W = W; this.H = H; this.pad = pad; this.R = R || Math.random;
    this.cv = makeCanvas(W + 2 * pad, H + 2 * pad); this.c = this.cv.getContext('2d'); this.c.imageSmoothingEnabled = false; this.c.translate(pad, pad);
  }
  f(x, y, w, h, col) {
    const x0 = Math.round(x), y0 = Math.round(y), x1 = Math.round(x + w), y1 = Math.round(y + h); if (x1 <= x0 || y1 <= y0) return this;
    this.c.fillStyle = col; this.c.fillRect(x0, y0, x1 - x0, y1 - y0); return this;
  }
  p(x, y, col) { this.c.fillStyle = col; this.c.fillRect(Math.floor(x), Math.floor(y), 1, 1); return this; }
  clear(x, y, w, h) { this.c.clearRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); return this; }
  alpha(a) { this.c.globalAlpha = a; return this; }
  hl(x, y, n, col) { return this.f(x, y, n, 1, col); }
  vl(x, y, n, col) { return this.f(x, y, 1, n, col); }
  line(x0, y0, x1, y1, col) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy, n = 0;
    this.c.fillStyle = col;
    for (;;) { this.c.fillRect(x0, y0, 1, 1); if ((x0 === x1 && y0 === y1) || n++ > 4000) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
    return this;
  }
  ell(cx, cy, rx, ry, col) {
    this.c.fillStyle = col; const y0 = Math.floor(cy - ry), y1 = Math.ceil(cy + ry);
    for (let y = y0; y < y1; y++) {
      const dy = y + .5 - cy; if (Math.abs(dy) > ry) continue; const hw = rx * Math.sqrt(Math.max(0, 1 - (dy / ry) * (dy / ry))), a = Math.round(cx - hw), b = Math.round(cx + hw);
      if (b > a) this.c.fillRect(a, y, b - a, 1);
    }
    return this;
  }
  ring(cx, cy, rx, ry, col, t) {
    t = t || 1; this.c.fillStyle = col; const y0 = Math.floor(cy - ry), y1 = Math.ceil(cy + ry);
    for (let y = y0; y < y1; y++) {
      const dy = y + .5 - cy; if (Math.abs(dy) > ry) continue; const hw = rx * Math.sqrt(Math.max(0, 1 - (dy / ry) * (dy / ry))), a = Math.round(cx - hw), b = Math.round(cx + hw);
      const irx = rx - t, iry = ry - t; let ia = 0, ib = 0, inner = false;
      if (irx > 0 && iry > 0 && Math.abs(dy) < iry) { const ih = irx * Math.sqrt(Math.max(0, 1 - (dy / iry) * (dy / iry))); ia = Math.round(cx - ih); ib = Math.round(cx + ih); inner = ib > ia; }
      if (!inner) { if (b > a) this.c.fillRect(a, y, b - a, 1); } else { if (ia > a) this.c.fillRect(a, y, ia - a, 1); if (b > ib) this.c.fillRect(ib, y, b - ib, 1); }
    }
    return this;
  }
  poly(pts, col) {
    this.c.fillStyle = col; let ymin = 1e9, ymax = -1e9; for (const q of pts) { ymin = Math.min(ymin, q[1]); ymax = Math.max(ymax, q[1]); }
    for (let y = Math.floor(ymin); y < Math.ceil(ymax); y++) {
      const yy = y + .5, xs = [];
      for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a[1] <= yy && b[1] > yy) || (b[1] <= yy && a[1] > yy)) xs.push(a[0] + (yy - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
      xs.sort((u, v) => u - v); for (let k = 0; k + 1 < xs.length; k += 2) { const a = Math.round(xs[k]), b = Math.round(xs[k + 1]); if (b > a) this.c.fillRect(a, y, b - a, 1); }
    }
    return this;
  }
  polyO(pts, col) { for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; this.line(a[0], a[1], b[0], b[1], col); } return this; }
  /* retângulo com cantos cortados (pixel-arredondado) */
  rr(x, y, w, h, col, cut) {
    cut = cut == null ? 1 : cut; x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    if (cut <= 0 || w < 4 || h < 4) return this.f(x, y, w, h, col);
    this.f(x + cut, y, w - 2 * cut, h, col); this.f(x, y + cut, w, h - 2 * cut, col); return this;
  }
  /* bloco com contorno escuro e bisel: fill m, luz em cima/esquerda, sombra embaixo/direita */
  box(x, y, w, h, r, o) {
    o = o || {}; x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h); const cut = o.cut == null ? 1 : o.cut;
    if (w < 3 || h < 3) { return this.f(x, y, w, h, o.out || OUTC); }
    this.rr(x, y, w, h, o.out || OUTC, cut); this.rr(x + 1, y + 1, w - 2, h - 2, r.m, Math.max(0, cut - 1));
    if (w > 4 && h > 4) { this.hl(x + 1 + cut, y + 1, w - 2 - 2 * cut, r.l1); this.vl(x + 1, y + 1 + cut, h - 2 - 2 * cut, r.l1); this.hl(x + 1 + cut, y + h - 2, w - 2 - 2 * cut, r.d1); this.vl(x + w - 2, y + 1 + cut, h - 2 - 2 * cut, r.d1); }
    return this;
  }
  /* manchas de pixel aleatórias */
  noise(x, y, w, h, cols, dens) {
    const n = Math.max(0, Math.round(w * h * dens)), R = this.R; cols = [].concat(cols);
    for (let i = 0; i < n; i++) this.p(x + R() * w, y + R() * h, cols[(R() * cols.length) | 0]);
    return this;
  }
  /* gradiente com dither ordenado entre duas cores; dir: 'v' (cima→baixo), 'h', 'd' (diagonal) */
  grad(x, y, w, h, c1, c2, dir, lo, hi) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h); lo = lo == null ? 0 : lo; hi = hi == null ? 1 : hi;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const t0 = dir === 'h' ? i / Math.max(1, w - 1) : dir === 'd' ? (i / Math.max(1, w - 1) + j / Math.max(1, h - 1)) / 2 : j / Math.max(1, h - 1), t = lo + (hi - lo) * t0;
      this.p(x + i, y + j, t > bay(x + i, y + j) ? c2 : c1);
    }
    return this;
  }
  /* preenchimento "dither" de densidade d (0..1) dentro de um retângulo */
  dith(x, y, w, h, col, d) { x = Math.round(x); y = Math.round(y); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (d > bay(x + i, y + j)) this.p(x + i, y + j, col); return this; }
  dithE(cx, cy, rx, ry, col, d) { // elipse com dither
    for (let j = Math.floor(cy - ry); j < Math.ceil(cy + ry); j++) for (let i = Math.floor(cx - rx); i < Math.ceil(cx + rx); i++) { const dx = (i + .5 - cx) / rx, dy = (j + .5 - cy) / ry; if (dx * dx + dy * dy <= 1 && d > bay(i, j)) this.p(i, j, col); }
    return this;
  }
  shadowR(x, y, w, h, dx, dy, a) { this.c.save(); this.c.globalAlpha = a == null ? .42 : a; this.f(x + (dx == null ? 1 : dx), y + (dy == null ? 2 : dy), w, h, '#0a0414'); this.c.restore(); return this; }
  shadowE(cx, cy, rx, ry, dx, dy, a) { this.c.save(); this.c.globalAlpha = a == null ? .42 : a; this.ell(cx + (dx == null ? 1 : dx), cy + (dy == null ? 2 : dy), rx, ry, '#0a0414'); this.c.restore(); return this; }
  /* "bolha" sombreada: árvores, barris, almofadas, pedras redondas */
  blob(cx, cy, rx, ry, r, o) {
    o = o || {}; const out = o.out || r.d3; this.ell(cx, cy, rx + 1, ry + 1, out); this.ell(cx, cy, rx, ry, r.d1);
    this.ell(cx - rx * .1, cy - ry * .14, rx * .86, ry * .84, r.m); this.ell(cx - rx * .22, cy - ry * .3, rx * .58, ry * .5, r.l1);
    if (!o.flat) { this.dithE(cx - rx * .24, cy - ry * .34, rx * .34, ry * .28, r.l2, .75); this.dithE(cx + rx * .22, cy + ry * .5, rx * .6, ry * .24, r.d2, .5); }
    return this;
  }
  clip(x, y, w, h, fn) { const c = this.c; c.save(); c.beginPath(); c.rect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); c.clip(); fn(); c.restore(); return this; }
  glow(cx, cy, r, col, a) { // brilho em degraus (pixelado)
    const R = Math.ceil(r); for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) { const d = Math.hypot(i, j) / r; if (d >= 1) continue; const t = (1 - d) * (a == null ? .5 : a); if (t > bay(Math.floor(cx) + i, Math.floor(cy) + j) * .6) { this.c.save(); this.c.globalAlpha = Math.min(.55, t); this.p(cx + i, cy + j, col); this.c.restore(); } }
    return this;
  }
}

/* utilitários de textura reutilizados pelo catálogo */
function jitterTone(r, R, bias) { const k = R() + (bias || 0); return k < .22 ? r.d1 : k < .72 ? r.m : k < .93 ? r.l1 : r.l2; }
function crack(P, x, y, len, col) { const R = P.R; let a = x, b = y; for (let i = 0; i < len; i++) { P.p(a, b, col); const t = R(); if (t < .4) a += R() < .5 ? -1 : 1; else if (t < .8) b += 1; else { a += 1; b += 1; } } }
function tuft(P, x, y, r) { P.p(x, y, r.d2); P.p(x - 1, y - 1, r.l1); P.p(x + 1, y - 1, r.l1); P.p(x, y - 1, r.l2); }

function rrPath(c, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function lgrad(c, x0, y0, x1, y1, stops) { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach(s => g.addColorStop(s[0], s[1])); return g; }
