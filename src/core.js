'use strict';
/* ===== core.js — utilidades, modelo de dados e assets ===== */

function makeCanvas(w, h) {
  if (globalThis.__makeCanvas) return globalThis.__makeCanvas(w, h);
  const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function uid(p) { return (p || 'i') + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3); }
function rng(seed) {
  let a = (seed | 0) >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hexToRgb(h) {
  h = String(h || '#000').replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16) || 0;
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
}
function toHex(r, g, b) { return '#' + [r, g, b].map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join(''); }
function rgba(h, a) { const [r, g, b] = hexToRgb(h); return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; }
function shade(h, amt) { // -1..1, devolve hex
  const [r, g, b] = hexToRgb(h);
  const f = c => amt < 0 ? c * (1 + amt) : c + (255 - c) * amt;
  return toHex(f(r), f(g), f(b));
}
function mix(h1, h2, t) {
  const a = hexToRgb(h1), b = hexToRgb(h2);
  return toHex(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
}
function inR(px, py, r) { return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h; }
function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
function rotPoint(px, py, cx, cy, deg) {
  const a = -deg * Math.PI / 180, dx = px - cx, dy = py - cy;
  return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
}
function segDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0; t = clamp(t, 0, 1);
  return dist(px, py, x1 + t * dx, y1 + t * dy);
}

/* ---------- Assets (imagens) ---------- */
const Assets = {
  data: {},      // id -> dataURL
  imgs: {},      // id -> Image carregada
  loading: {},
  onLoad: null,
  put(id, url) { this.data[id] = url; delete this.imgs[id]; delete this.loading[id]; if (this.onLoad) this.onLoad(id); },
  has(id) { return !!this.data[id]; },
  get(id) {
    if (!id) return null;
    if (this.imgs[id]) return this.imgs[id];
    const url = this.data[id];
    if (!url || this.loading[id]) return null;
    this.loading[id] = true;
    const done = img => { this.imgs[id] = img; delete this.loading[id]; if (this.onLoad) this.onLoad(id); };
    if (globalThis.__loadImage) { globalThis.__loadImage(url).then(done).catch(() => { delete this.loading[id]; }); }
    else { const img = new Image(); img.onload = () => done(img); img.onerror = () => { delete this.loading[id]; }; img.src = url; }
    return null;
  },
  clear() { this.data = {}; this.imgs = {}; this.loading = {}; }
};

/* ---------- Modelo da campanha ---------- */
function newCampaign() {
  return { v: 1, name: 'Nova campanha', grid: 48, tokenScale: 1, snap: true, showGrid: true, areas: [], elements: [], walls: [], zones: [], fog: [], lights: [], creatures: [], characters: {} };
}
function newArea(c, x, y, w, h, extra) {
  return Object.assign({ id: uid('a'), name: 'Área ' + (c.areas.length + 1), x, y, w, h, color: '#16181b', bg: null, darkness: 0, ambient: '#04050a', reveal: 'auto' }, extra || {});
}
function freeSpotX(c) { // onde colocar um novo anexo sem sobrepor
  let m = 0; for (const a of c.areas) m = Math.max(m, a.x + a.w); return c.areas.length ? m + c.grid * 6 : 0;
}

const STATES = [['normal', 'Normal'], ['dying', 'Morrendo'], ['dead', 'Morto']];
const FRAMES = [['circle', 'Círculo'], ['rounded', 'Arredondado'], ['square', 'Quadrado'], ['hex', 'Hexágono'], ['full', 'Corpo inteiro']];

function newCharacter(pid, name) {
  return { id: pid, owner: pid, name: name || 'Jogador', asset: null, frame: 'circle', color: '#c9a227', state: 'normal', alpha: 1, size: 1, x: 0, y: 0 };
}
function newCreature(x, y) {
  return { id: uid('n'), name: 'Criatura', x, y, size: 1, asset: null, frame: 'rounded', color: '#a31621', state: 'normal', alpha: 1, hidden: true, nameVis: false };
}
