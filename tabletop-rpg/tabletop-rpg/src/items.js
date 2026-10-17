'use strict';
/* ===== items.js — itens: catálogos (Ordem Paranormal + D&D), ícones desenhados, inventário e equipamento =====
   Os números dos itens são valores de REFERÊNCIA (confira no seu livro). Tudo pode ser editado/substituído por itens personalizados. */

const ITEM_CATS = { weapon: 'Corpo a corpo', ranged: 'Disparo', armor: 'Armadura / proteção', shield: 'Escudo', wear: 'Vestimenta / acessório', tool: 'Equipamento', consumable: 'Consumível', magic: 'Mágico / paranormal', misc: 'Diversos' };
const ITEM_SLOTS = { main: 'Mão principal', off: 'Mão secundária', two: 'Duas mãos', body: 'Corpo', head: 'Cabeça', back: 'Costas', acc: 'Acessório', light: 'Fonte de luz' };
const SLOT_ORDER = ['main', 'off', 'two', 'body', 'head', 'back', 'acc', 'light'];
const ELEMENTS = {
  sangue: { name: 'Sangue', color: '#c1121f', glyph: 'drop' }, morte: { name: 'Morte', color: '#9aa0ad', glyph: 'skull' },
  conhecimento: { name: 'Conhecimento', color: '#e2b53a', glyph: 'eye' }, energia: { name: 'Energia', color: '#a455e8', glyph: 'bolt' }, medo: { name: 'Medo', color: '#e8e8ee', glyph: 'mask' }
};

/* ---------- ícones (64×64, contorno escuro) ---------- */
const IK = '#17120f', METAL = ['#e4e8ef', '#a9b0bf', '#6f7788'], WOOD = ['#a8743c', '#7a4f2a', '#4f3119'];
function _p(c, pts, fill, lw) { c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (lw !== 0) { c.lineWidth = lw || 3; c.strokeStyle = IK; c.stroke(); } }
function _r(c, x, y, w, h, fill, lw) { _p(c, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], fill, lw); }
function _o(c, x, y, rx, ry, fill, lw) { c.beginPath(); c.ellipse(x, y, rx, ry == null ? rx : ry, 0, 0, 6.2832); if (fill) { c.fillStyle = fill; c.fill(); } if (lw !== 0) { c.lineWidth = lw || 3; c.strokeStyle = IK; c.stroke(); } }
function _l(c, x1, y1, x2, y2, col, w) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineWidth = w || 3; c.strokeStyle = col || IK; c.lineCap = 'round'; c.stroke(); }
function _g(c, x0, y0, x1, y1, a, b, m) { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); if (m) g.addColorStop(.5, m); g.addColorStop(1, b); return g; }
const _met = (c, x0, y0, x1, y1) => _g(c, x0, y0, x1, y1, METAL[0], METAL[2], METAL[1]);
const _wood = (c, x0, y0, x1, y1) => _g(c, x0, y0, x1, y1, WOOD[0], WOOD[2], WOOD[1]);
function _aura(c, x, y, r, col, a) { const g = c.createRadialGradient(x, y, r * .15, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.save(); c.globalAlpha = a; c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.fill(); c.restore(); }
function _flame(c, x, y, s) { _p(c, [[x, y - 16 * s], [x + 7 * s, y - 4 * s], [x + 4 * s, y + 6 * s], [x - 4 * s, y + 6 * s], [x - 7 * s, y - 4 * s]], '#ff7a1f', 2.2); _p(c, [[x, y - 8 * s], [x + 3.5 * s, y - 1 * s], [x + 2 * s, y + 4 * s], [x - 2 * s, y + 4 * s], [x - 3.5 * s, y - 1 * s]], '#ffd24d', 0); }
function _blade(c, x, y0, y1, w) { _p(c, [[x, y0], [x + w, y0 + w * 1.4], [x + w, y1], [x - w, y1], [x - w, y0 + w * 1.4]], _met(c, x - w, 0, x + w, 0)); _l(c, x, y0 + w * 1.8, x, y1 - 2, 'rgba(255,255,255,.55)', 1.6); }

const GLYPHS = {
  sword: { rot: 45, d(c, k) { _blade(c, 32, 1, 40, 5); _r(c, 19, 40, 26, 5, k.a); _r(c, 29, 45, 6, 11, _wood(c, 29, 0, 35, 0)); _o(c, 32, 59, 4, 3.4, k.a); } },
  greatsword: { rot: 45, d(c, k) { _blade(c, 32, 0, 38, 7); _r(c, 17, 38, 30, 5, k.a); _r(c, 29, 43, 6, 14, _wood(c, 29, 0, 35, 0)); _o(c, 32, 60, 4, 3.4, k.a); } },
  dagger: { rot: 45, d(c, k) { _blade(c, 32, 6, 36, 4.5); _r(c, 23, 36, 18, 4, k.a); _r(c, 29, 40, 6, 12, _wood(c, 29, 0, 35, 0)); _o(c, 32, 55, 3, 3, k.a); } },
  axe: { rot: 0, d(c, k) { _r(c, 29, 8, 6, 52, _wood(c, 29, 0, 35, 0)); _p(c, [[35, 10], [56, 4], [58, 18], [56, 32], [35, 28]], _met(c, 35, 0, 58, 0)); _p(c, [[29, 14], [20, 16], [20, 24], [29, 26]], METAL[2]); _l(c, 54, 8, 54, 30, 'rgba(255,255,255,.6)', 1.6); _r(c, 28, 26, 8, 5, k.a); } },
  hammer: { rot: 0, d(c, k) { _r(c, 29, 18, 6, 42, _wood(c, 29, 0, 35, 0)); _r(c, 14, 5, 36, 17, _met(c, 0, 5, 0, 22)); _r(c, 14, 10, 36, 4, k.a, 0); _r(c, 14, 5, 36, 17, null); } },
  mace: { rot: 0, d(c, k) { _r(c, 29, 26, 6, 34, _wood(c, 29, 0, 35, 0)); for (const a of [0, 1, 2, 3, 4, 5, 6, 7]) { const t = a * Math.PI / 4; _p(c, [[32 + Math.cos(t - .3) * 11, 16 + Math.sin(t - .3) * 11], [32 + Math.cos(t) * 18, 16 + Math.sin(t) * 18], [32 + Math.cos(t + .3) * 11, 16 + Math.sin(t + .3) * 11]], METAL[2], 2); } _o(c, 32, 16, 12, 12, _met(c, 20, 6, 44, 28)); _o(c, 32, 16, 4, 4, k.a, 2); } },
  spear: { rot: 45, d(c, k) { _r(c, 30, 14, 4, 48, _wood(c, 30, 0, 34, 0)); _p(c, [[32, 0], [39, 18], [32, 15], [25, 18]], _met(c, 25, 0, 39, 0)); _r(c, 28, 17, 8, 4, k.a); } },
  bow: { rot: 0, d(c, k) { c.beginPath(); c.moveTo(22, 4); c.quadraticCurveTo(62, 32, 22, 60); c.lineWidth = 7; c.strokeStyle = IK; c.stroke(); c.lineWidth = 3.4; c.strokeStyle = WOOD[0]; c.stroke(); _l(c, 22, 4, 22, 60, '#e9e2cf', 1.6); _l(c, 8, 32, 50, 32, IK, 4); _l(c, 8, 32, 50, 32, '#cdb98a', 1.8); _p(c, [[54, 32], [46, 27], [46, 37]], METAL[1], 2); _p(c, [[8, 32], [14, 27], [14, 37]], k.a, 1.6); } },
  crossbow: { rot: 0, d(c, k) { _r(c, 28, 14, 8, 46, _wood(c, 28, 0, 36, 0)); c.beginPath(); c.moveTo(6, 22); c.quadraticCurveTo(32, 4, 58, 22); c.lineWidth = 7; c.strokeStyle = IK; c.stroke(); c.lineWidth = 3.4; c.strokeStyle = METAL[1]; c.stroke(); _l(c, 6, 22, 32, 30, '#e9e2cf', 1.4); _l(c, 58, 22, 32, 30, '#e9e2cf', 1.4); _l(c, 32, 8, 32, 40, IK, 4); _l(c, 32, 8, 32, 40, k.a, 2); _p(c, [[32, 4], [28, 11], [36, 11]], METAL[0], 2); } },
  staff: { rot: 0, d(c, k) { _r(c, 30, 14, 5, 48, _wood(c, 30, 0, 35, 0)); _o(c, 32.5, 12, 10, 10, null, 0); const g = c.createRadialGradient(32, 10, 1, 32, 12, 10); g.addColorStop(0, '#fff'); g.addColorStop(.4, k.al); g.addColorStop(1, k.a); _o(c, 32.5, 12, 8, 8, g); _p(c, [[25, 18], [40, 18], [37, 24], [28, 24]], METAL[1], 2); } },
  wand: { rot: 45, d(c, k) { _r(c, 30, 10, 4, 48, _wood(c, 30, 0, 34, 0)); _r(c, 29, 44, 6, 14, '#2a2018'); _p(c, [[32, 0], [35, 7], [42, 8], [37, 13], [38, 20], [32, 16], [26, 20], [27, 13], [22, 8], [29, 7]], k.a, 2); } },
  pistol: { rot: 0, d(c, k) { _r(c, 6, 18, 46, 13, _met(c, 0, 18, 0, 31)); _r(c, 8, 21, 40, 3, 'rgba(255,255,255,.35)', 0); _p(c, [[34, 31], [48, 31], [44, 56], [30, 56]], '#3a3a42'); _p(c, [[26, 31], [34, 31], [32, 40], [28, 40]], '#2c2c33', 2); _r(c, 2, 20, 6, 8, '#2c2c33', 2); _o(c, 38, 44, 2.5, 2.5, k.a, 0); } },
  revolver: { rot: 0, d(c, k) { _r(c, 6, 18, 44, 10, _met(c, 0, 18, 0, 28)); _o(c, 36, 25, 10, 10, _met(c, 26, 15, 46, 35)); _o(c, 36, 25, 3, 3, '#222', 0); _p(c, [[40, 33], [54, 33], [49, 58], [36, 58]], WOOD[1]); _r(c, 2, 20, 6, 6, '#2c2c33', 2); } },
  rifle: { rot: 0, d(c, k) { _p(c, [[2, 36], [24, 28], [24, 42], [8, 48]], _wood(c, 0, 28, 0, 48)); _r(c, 24, 28, 28, 9, _met(c, 0, 28, 0, 37)); _r(c, 50, 30, 12, 5, '#3a3a42', 2); _r(c, 28, 21, 16, 5, '#2c2c33', 2); _o(c, 30, 23.5, 3, 3, k.a, 0); _r(c, 32, 37, 6, 12, '#3a3a42', 2); } },
  shotgun: { rot: 0, d(c, k) { _p(c, [[2, 36], [22, 28], [22, 42], [8, 48]], _wood(c, 0, 28, 0, 48)); _r(c, 22, 29, 38, 8, _met(c, 0, 29, 0, 37)); _r(c, 22, 37, 24, 6, _wood(c, 0, 37, 0, 43)); _r(c, 56, 30, 6, 6, '#2c2c33', 2); _o(c, 20, 32, 2, 2, k.a, 0); } },
  smg: { rot: 0, d(c, k) { _r(c, 8, 22, 44, 12, _met(c, 0, 22, 0, 34)); _r(c, 50, 25, 12, 5, '#3a3a42', 2); _r(c, 30, 34, 8, 22, '#2c2c33', 2); _p(c, [[16, 34], [26, 34], [24, 52], [14, 52]], '#3a3a42'); _r(c, 4, 24, 6, 8, '#2c2c33', 2); _o(c, 20, 28, 2, 2, k.a, 0); } },
  shield: { rot: 0, d(c, k) { _p(c, [[32, 3], [56, 11], [54, 36], [32, 61], [10, 36], [8, 11]], _g(c, 0, 3, 0, 61, k.al, k.ad, k.a)); _p(c, [[32, 11], [48, 17], [46, 34], [32, 51], [18, 34], [16, 17]], null, 2.4); _l(c, 32, 14, 32, 48, METAL[0], 3); _l(c, 20, 26, 44, 26, METAL[0], 3); _o(c, 32, 26, 4, 4, METAL[1], 1.6); } },
  armor: { rot: 0, d(c, k) { _p(c, [[18, 10], [26, 5], [38, 5], [46, 10], [57, 18], [48, 28], [46, 28], [46, 58], [18, 58], [18, 28], [16, 28], [7, 18]], _met(c, 7, 0, 57, 0)); _r(c, 18, 40, 28, 6, k.a, 2); _l(c, 32, 8, 32, 40, 'rgba(0,0,0,.35)', 2); _l(c, 24, 14, 24, 28, 'rgba(255,255,255,.5)', 2); } },
  vest: { rot: 0, d(c, k) { _p(c, [[19, 8], [27, 5], [37, 5], [45, 8], [54, 16], [47, 26], [45, 26], [45, 58], [19, 58], [19, 26], [17, 26], [10, 16]], _g(c, 0, 5, 0, 58, '#4a4f5c', '#262930')); _r(c, 19, 30, 26, 5, k.a, 2); _r(c, 22, 38, 8, 12, '#1d2026', 1.6); _r(c, 34, 38, 8, 12, '#1d2026', 1.6); _l(c, 32, 8, 32, 30, 'rgba(255,255,255,.18)', 2); } },
  helm: { rot: 0, d(c, k) { c.beginPath(); c.moveTo(12, 40); c.quadraticCurveTo(12, 8, 32, 8); c.quadraticCurveTo(52, 8, 52, 40); c.lineTo(52, 54); c.lineTo(12, 54); c.closePath(); c.fillStyle = _met(c, 12, 0, 52, 0); c.fill(); c.lineWidth = 3; c.strokeStyle = IK; c.stroke(); _r(c, 16, 30, 32, 7, '#14161b', 2); _l(c, 32, 30, 32, 54, IK, 3); _p(c, [[28, 8], [36, 8], [34, 0], [30, 0]], k.a, 2); } },
  cloak: { rot: 0, d(c, k) { _p(c, [[22, 6], [42, 6], [56, 58], [32, 52], [8, 58]], _g(c, 0, 6, 0, 58, k.al, k.ad, k.a)); _l(c, 32, 10, 32, 50, 'rgba(0,0,0,.3)', 2); _o(c, 32, 10, 5, 5, METAL[0], 2.4); } },
  ring: { rot: 0, d(c, k) { _o(c, 32, 40, 16, 16, null, 0); c.beginPath(); c.arc(32, 40, 14, 0, 6.2832); c.lineWidth = 9; c.strokeStyle = IK; c.stroke(); c.lineWidth = 5; c.strokeStyle = '#e2b53a'; c.stroke(); _p(c, [[32, 8], [42, 18], [32, 28], [22, 18]], k.a, 2.4); _l(c, 32, 10, 32, 26, 'rgba(255,255,255,.5)', 1.4); } },
  amulet: { rot: 0, d(c, k) { c.beginPath(); c.moveTo(10, 4); c.quadraticCurveTo(32, 40, 54, 4); c.lineWidth = 5; c.strokeStyle = IK; c.stroke(); c.lineWidth = 2; c.strokeStyle = '#e2b53a'; c.stroke(); _o(c, 32, 42, 13, 13, '#e2b53a'); const g = c.createRadialGradient(30, 40, 1, 32, 42, 9); g.addColorStop(0, '#fff'); g.addColorStop(.35, k.al); g.addColorStop(1, k.ad); _o(c, 32, 42, 8, 8, g, 2); } },
  potion: { rot: 0, d(c, k) { _r(c, 26, 3, 12, 6, WOOD[1], 2.4); _r(c, 27, 9, 10, 12, 'rgba(220,235,255,.55)', 2.6); c.beginPath(); c.arc(32, 41, 18, 0, 6.2832); c.fillStyle = 'rgba(220,235,255,.45)'; c.fill(); c.lineWidth = 3; c.strokeStyle = IK; c.stroke(); c.save(); c.beginPath(); c.arc(32, 41, 15.5, 0, 6.2832); c.clip(); c.fillStyle = _g(c, 0, 30, 0, 58, k.al, k.ad, k.a); c.fillRect(10, 32, 44, 30); c.restore(); _o(c, 25, 36, 3.5, 5, 'rgba(255,255,255,.7)', 0); } },
  scroll: { rot: 0, d(c, k) { _r(c, 14, 14, 36, 38, '#eadfbf'); for (let y = 22; y < 46; y += 6) _l(c, 20, y, 44, y, '#8a7550', 1.6); _o(c, 14, 33, 5, 21, '#d8c79c'); _o(c, 50, 33, 5, 21, '#d8c79c'); _o(c, 14, 33, 2, 8, '#8a7550', 0); _o(c, 32, 50, 5, 5, k.a, 2); } },
  book: { rot: 0, d(c, k) { _r(c, 13, 6, 38, 52, _g(c, 13, 0, 51, 0, k.al, k.ad, k.a)); _r(c, 13, 6, 6, 52, k.ad, 2.4); _r(c, 21, 10, 26, 44, null, 1.8); _o(c, 34, 28, 7, 7, '#e2b53a', 2); _l(c, 34, 36, 34, 48, '#e2b53a', 2.4); _r(c, 46, 28, 5, 8, METAL[1], 2); } },
  torch: { rot: 0, d(c, k) { _r(c, 29, 30, 7, 30, _wood(c, 29, 0, 36, 0)); _r(c, 26, 24, 13, 9, '#2c2420', 2.4); _flame(c, 32.5, 18, 1.25); } },
  flashlight: { rot: 45, d(c, k) { _r(c, 25, 24, 14, 36, '#2f3038'); _r(c, 25, 36, 14, 6, k.a, 1.6); _p(c, [[20, 8], [44, 8], [39, 24], [25, 24]], _met(c, 20, 0, 44, 0)); _o(c, 32, 9, 11, 3.5, '#fff6c8', 2); _l(c, 32, 2, 32, -6, '#ffe58a', 3); } },
  lantern: { rot: 0, d(c, k) { c.beginPath(); c.arc(32, 14, 11, Math.PI, 0); c.lineWidth = 3.4; c.strokeStyle = IK; c.stroke(); _r(c, 19, 16, 26, 4, '#3a3a42'); _r(c, 21, 20, 22, 30, '#ffd77a'); _r(c, 21, 20, 22, 30, null, 2.6); _l(c, 32, 20, 32, 50, IK, 2); _flame(c, 32, 42, .8); _r(c, 17, 50, 30, 6, '#3a3a42'); } },
  key: { rot: 45, d(c, k) { c.beginPath(); c.arc(32, 14, 10, 0, 6.2832); c.lineWidth = 9; c.strokeStyle = IK; c.stroke(); c.lineWidth = 4.6; c.strokeStyle = '#e2b53a'; c.stroke(); _r(c, 29, 24, 6, 34, '#e2b53a'); _r(c, 35, 44, 8, 4, '#e2b53a'); _r(c, 35, 52, 6, 4, '#e2b53a'); } },
  tools: { rot: 0, d(c, k) { _l(c, 14, 50, 46, 18, IK, 9); _l(c, 14, 50, 46, 18, METAL[1], 5); _o(c, 49, 14, 8, 8, METAL[1]); _o(c, 52, 11, 4, 4, '#1a1a1e', 0); _l(c, 50, 50, 18, 18, IK, 9); _l(c, 50, 50, 18, 18, k.a, 5); _p(c, [[10, 6], [22, 8], [24, 20], [14, 20]], METAL[0], 2.4); } },
  bag: { rot: 0, d(c, k) { c.beginPath(); c.moveTo(24, 12); c.quadraticCurveTo(10, 30, 10, 46); c.quadraticCurveTo(10, 60, 32, 60); c.quadraticCurveTo(54, 60, 54, 46); c.quadraticCurveTo(54, 30, 40, 12); c.closePath(); c.fillStyle = _g(c, 10, 12, 54, 60, WOOD[0], WOOD[2], WOOD[1]); c.fill(); c.lineWidth = 3; c.strokeStyle = IK; c.stroke(); _r(c, 22, 10, 20, 6, k.a, 2.4); _l(c, 24, 20, 40, 20, IK, 2); } },
  rope: { rot: 0, d(c, k) { for (const r of [18, 13, 8]) { c.beginPath(); c.ellipse(32, 34, r, r * .72, 0, 0, 6.2832); c.lineWidth = 6; c.strokeStyle = IK; c.stroke(); c.lineWidth = 3; c.strokeStyle = '#d4b878'; c.stroke(); } _l(c, 46, 40, 58, 56, IK, 5); _l(c, 46, 40, 58, 56, '#d4b878', 2.4); } },
  medkit: { rot: 0, d(c, k) { _r(c, 11, 18, 42, 34, '#f1f1f1'); _r(c, 22, 10, 20, 8, null, 3); _r(c, 28, 24, 8, 22, '#d11d2a', 0); _r(c, 21, 31, 22, 8, '#d11d2a', 0); _r(c, 11, 18, 42, 34, null, 3); } },
  grenade: { rot: 0, d(c, k) { _o(c, 32, 40, 16, 19, _g(c, 16, 22, 48, 60, '#6b7a45', '#2d3520')); for (const y of [32, 40, 48]) _l(c, 18, y, 46, y, 'rgba(0,0,0,.35)', 1.6); _r(c, 27, 12, 10, 9, METAL[1], 2.4); _r(c, 37, 14, 12, 4, METAL[1], 2); c.beginPath(); c.arc(50, 22, 6, 0, 6.2832); c.lineWidth = 2.6; c.strokeStyle = IK; c.stroke(); } },
  smoke: { rot: 0, d(c, k) { _r(c, 20, 18, 24, 40, _g(c, 20, 0, 44, 0, '#9aa0ad', '#4b4f5c')); _r(c, 18, 12, 28, 8, METAL[1], 2.4); _o(c, 20, 8, 7, 6, 'rgba(230,230,235,.8)', 0); _o(c, 32, 4, 9, 7, 'rgba(230,230,235,.8)', 0); _o(c, 44, 8, 7, 6, 'rgba(230,230,235,.8)', 0); _r(c, 20, 32, 24, 8, k.a, 0); } },
  orb: { rot: 0, d(c, k) { const g = c.createRadialGradient(26, 24, 2, 32, 32, 22); g.addColorStop(0, '#fff'); g.addColorStop(.3, k.al); g.addColorStop(1, k.ad); _o(c, 32, 30, 20, 20, g); _o(c, 25, 22, 5, 3.5, 'rgba(255,255,255,.75)', 0); _p(c, [[18, 56], [46, 56], [42, 48], [22, 48]], METAL[1], 2.4); } },
  mask: { rot: 0, d(c, k) { _p(c, [[12, 10], [52, 10], [54, 34], [42, 58], [22, 58], [10, 34]], '#e9e6dc'); _p(c, [[18, 26], [29, 29], [27, 35], [17, 33]], '#15151a', 0); _p(c, [[46, 26], [35, 29], [37, 35], [47, 33]], '#15151a', 0); _l(c, 32, 36, 32, 44, 'rgba(0,0,0,.4)', 2); _l(c, 24, 50, 40, 50, '#15151a', 2.4); _l(c, 32, 12, 32, 22, k.a, 3); } },
  candle: { rot: 0, d(c, k) { _r(c, 25, 24, 14, 30, '#efe6cd'); _r(c, 25, 24, 14, 6, null, 2.6); _l(c, 32, 24, 32, 19, IK, 2.4); _flame(c, 32, 14, .8); _o(c, 32, 56, 17, 5, '#6f7788'); } },
  eye: { rot: 0, d(c, k) { c.beginPath(); c.moveTo(4, 32); c.quadraticCurveTo(32, 4, 60, 32); c.quadraticCurveTo(32, 60, 4, 32); c.closePath(); c.fillStyle = '#f2efe6'; c.fill(); c.lineWidth = 3; c.strokeStyle = IK; c.stroke(); _o(c, 32, 32, 11, 11, k.a); _o(c, 32, 32, 5, 5, '#101014', 0); _o(c, 28, 28, 2.4, 2.4, '#fff', 0); } },
  skull: { rot: 0, d(c, k) { _o(c, 32, 26, 20, 19, '#e9e2cf'); _r(c, 21, 38, 22, 16, '#e9e2cf'); _o(c, 24, 28, 5.5, 6.5, '#15151a', 0); _o(c, 40, 28, 5.5, 6.5, '#15151a', 0); _p(c, [[32, 34], [29, 40], [35, 40]], '#15151a', 0); for (const x of [26, 32, 38]) _l(c, x, 44, x, 53, IK, 2); } },
  gem: { rot: 0, d(c, k) { _p(c, [[18, 10], [46, 10], [58, 24], [32, 58], [6, 24]], _g(c, 6, 10, 58, 58, k.al, k.ad, k.a)); _p(c, [[6, 24], [58, 24]], null, 2); _l(c, 18, 10, 24, 24, IK, 2); _l(c, 46, 10, 40, 24, IK, 2); _l(c, 24, 24, 32, 58, IK, 2); _l(c, 40, 24, 32, 58, IK, 2); _p(c, [[18, 10], [32, 10], [28, 24], [24, 24]], 'rgba(255,255,255,.35)', 0); } },
  bolt: { rot: 0, d(c, k) { _p(c, [[38, 2], [14, 36], [28, 36], [22, 62], [50, 26], [35, 26], [44, 2]], _g(c, 0, 2, 0, 62, '#fff6b0', k.a)); } },
  drop: { rot: 0, d(c, k) { c.beginPath(); c.moveTo(32, 3); c.bezierCurveTo(32, 3, 52, 26, 52, 40); c.arc(32, 40, 20, 0, Math.PI); c.bezierCurveTo(12, 26, 32, 3, 32, 3); c.closePath(); c.fillStyle = _g(c, 12, 10, 52, 60, k.al, k.ad, k.a); c.fill(); c.lineWidth = 3; c.strokeStyle = IK; c.stroke(); _o(c, 24, 40, 3.4, 7, 'rgba(255,255,255,.55)', 0); } },
  box: { rot: 0, d(c, k) { _r(c, 9, 16, 46, 38, _wood(c, 9, 16, 55, 54)); _r(c, 9, 16, 46, 38, null, 3); _l(c, 9, 28, 55, 28, WOOD[2], 2.4); _r(c, 28, 24, 8, 12, METAL[1], 2.4); _r(c, 9, 16, 6, 38, k.a, 2); _r(c, 49, 16, 6, 38, k.a, 2); } },
  gear: { rot: 0, d(c, k) { for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.save(); c.translate(32, 32); c.rotate(a); _r(c, -5, -26, 10, 12, METAL[1], 2.6); c.restore(); } _o(c, 32, 32, 19, 19, _met(c, 13, 13, 51, 51)); _o(c, 32, 32, 7, 7, '#1d2026', 2); } },
  d20: { rot: 0, d(c, k) { _p(c, [[32, 3], [56, 17], [56, 47], [32, 61], [8, 47], [8, 17]], _g(c, 8, 3, 56, 61, k.al, k.ad, k.a)); _l(c, 32, 3, 8, 47, IK, 1.8); _l(c, 32, 3, 56, 47, IK, 1.8); _l(c, 8, 47, 56, 47, IK, 1.8); _l(c, 8, 17, 56, 17, 'rgba(0,0,0,.25)', 1.4); c.fillStyle = '#fff'; c.font = '700 17px system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = IK; c.strokeText('20', 32, 36); c.fillText('20', 32, 36); } },
  cross: { rot: 0, d(c, k) { _p(c, [[26, 4], [38, 4], [38, 22], [56, 22], [56, 34], [38, 34], [38, 60], [26, 60], [26, 34], [8, 34], [8, 22], [26, 22]], _g(c, 8, 4, 56, 60, '#fff6c8', '#d9b13b', k.a)); } },
  boots: { rot: 0, d(c, k) { _p(c, [[20, 6], [40, 6], [40, 34], [58, 42], [58, 56], [14, 56], [14, 34], [20, 30]], _g(c, 14, 6, 58, 56, WOOD[0], WOOD[2], WOOD[1])); _r(c, 20, 6, 20, 7, k.a, 2); _l(c, 14, 50, 58, 50, IK, 2.4); } },
  leaf: { rot: 0, d(c, k) { c.beginPath(); c.moveTo(10, 54); c.bezierCurveTo(8, 20, 30, 6, 56, 8); c.bezierCurveTo(58, 34, 42, 56, 10, 54); c.closePath(); c.fillStyle = _g(c, 10, 54, 56, 8, k.ad, k.al, k.a); c.fill(); c.lineWidth = 3; c.strokeStyle = IK; c.stroke(); _l(c, 10, 54, 44, 20, 'rgba(0,0,0,.45)', 2.2); for (const t of [.35, .55, .75]) { const x = 10 + 34 * t, y = 54 - 34 * t; _l(c, x, y, x + 8, y + 2, 'rgba(0,0,0,.3)', 1.4); _l(c, x, y, x - 2, y - 9, 'rgba(0,0,0,.3)', 1.4); } } },
  lute: { rot: 0, d(c, k) { _l(c, 40, 24, 56, 8, IK, 8); _l(c, 40, 24, 56, 8, WOOD[1], 4); _r(c, 50, 2, 10, 8, k.a, 2); _o(c, 24, 42, 17, 15, _g(c, 8, 30, 40, 56, WOOD[0], WOOD[2], WOOD[1])); _o(c, 24, 42, 5.5, 5.5, '#1d1410', 2); _l(c, 14, 54, 36, 30, 'rgba(255,255,255,.25)', 1.2); } },
  /* relíquias de classe: ilustrações originais, mais detalhadas, para os temas de D&D e para itens lendários da mesa */
  legend_sword: { rot: 45, d(c, k) { _aura(c, 32, 24, 28, k.a, .42);
    _p(c, [[32, 0], [38.5, 8], [38.5, 40], [25.5, 40], [25.5, 8]], _g(c, 25.5, 0, 38.5, 0, '#f6f9fd', '#788094', '#c3cad8'), 2.6);
    _l(c, 32, 6, 32, 37, 'rgba(20,24,40,.30)', 1.6); for (const y of [12, 19, 26, 33]) { _l(c, 29.4, y, 34.6, y, k.al, 1.5); }
    _p(c, [[8, 41], [22, 37], [42, 37], [56, 41], [51, 47.5], [41, 43.5], [23, 43.5], [13, 47.5]], _g(c, 8, 37, 56, 47, '#ffeaa4', '#a87a22', '#e0b448'), 2.6);
    _o(c, 32, 40.4, 3.4, 3.4, k.a, 2); _o(c, 31, 39.4, 1, 1, '#fff', 0);
    _r(c, 29, 44, 6, 11, _wood(c, 29, 0, 35, 0), 2.2); for (const y of [46.5, 49.5, 52.5]) _l(c, 29, y, 35, y + 1.2, 'rgba(0,0,0,.45)', 1.2);
    _o(c, 32, 59, 4.6, 4.2, _g(c, 28, 55, 36, 63, '#ffeaa4', '#a87a22', '#e0b448'), 2.4); _o(c, 32, 59, 1.8, 1.8, k.a, 0); } },
  legend_staff: { rot: 0, d(c, k) { c.translate(32, 38); c.scale(.88, .88); c.translate(-32, -38); _aura(c, 32, 12, 24, k.a, .5);
    _r(c, 30, 20, 4, 43, _wood(c, 30, 0, 34, 0), 2.4); for (const y of [30, 40, 50]) _l(c, 29.2, y, 34.8, y + 2.4, 'rgba(0,0,0,.45)', 1.5); _r(c, 28.4, 24, 7.2, 3.6, _g(c, 28, 24, 36, 28, '#ffeaa4', '#a87a22', '#e0b448'), 2);
    c.lineCap = 'round'; for (const [col, w] of [[IK, 6.2], ['#b8c0d0', 3.4]]) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(32, 24); c.bezierCurveTo(14, 22, 14, 6, 22, 2); c.moveTo(32, 24); c.bezierCurveTo(50, 22, 50, 6, 42, 2); c.stroke(); }
    const g = c.createRadialGradient(30, 9, 1, 32, 12, 9.5); g.addColorStop(0, '#fff'); g.addColorStop(.35, k.al); g.addColorStop(1, k.ad); _o(c, 32, 12, 8.6, 8.6, g, 2.4);
    for (const [x, y, r] of [[48, 6, 3], [15, 17, 2.4], [52, 22, 1.8]]) { _l(c, x - r, y, x + r, y, k.al, 1.2); _l(c, x, y - r, x, y + r, k.al, 1.2); } } },
  legend_mace: { rot: 0, d(c, k) { c.translate(32, 40); c.scale(.88, .88); c.translate(-32, -40); _aura(c, 32, 17, 25, k.a, .42);
    _r(c, 29.4, 28, 5.2, 34, _wood(c, 29, 0, 35, 0), 2.4); _o(c, 32, 62, 3.4, 2.6, _g(c, 28, 59, 36, 65, '#ffeaa4', '#a87a22', '#e0b448'), 2); _p(c, [[24, 31], [40, 31], [37, 36], [27, 36]], _g(c, 24, 31, 40, 36, '#ffeaa4', '#a87a22', '#e0b448'), 2.2);
    for (let i = 0; i < 12; i++) { const t = i * Math.PI / 6, L = i % 2 ? 15 : 19; _p(c, [[32 + Math.cos(t - .2) * 10, 17 + Math.sin(t - .2) * 10], [32 + Math.cos(t) * L, 17 + Math.sin(t) * L], [32 + Math.cos(t + .2) * 10, 17 + Math.sin(t + .2) * 10]], i % 2 ? '#d9b44c' : '#fff1b8', 1.8); }
    _o(c, 32, 17, 10.6, 10.6, _g(c, 22, 6, 42, 28, '#fff6c8', '#a87a22', '#e6bd4c'), 2.4); _o(c, 32, 17, 5, 5, k.a, 2); _o(c, 30.6, 15.4, 1.6, 1.6, '#fff', 0); } },
  legend_dagger: { rot: 45, d(c, k) { _aura(c, 32, 22, 22, k.a, .38);
    c.beginPath(); c.moveTo(30, 41); c.bezierCurveTo(21, 31, 36, 19, 29, 2); c.bezierCurveTo(43, 13, 41, 31, 35, 41); c.closePath(); c.fillStyle = _g(c, 24, 0, 42, 0, '#f6f9fd', '#788094', '#c3cad8'); c.fill(); c.lineWidth = 2.6; c.strokeStyle = IK; c.stroke();
    c.beginPath(); c.moveTo(30.4, 38); c.bezierCurveTo(24, 30, 34, 18, 30, 7); c.strokeStyle = k.al; c.lineWidth = 1.5; c.stroke();
    _p(c, [[18, 42], [30, 39], [36, 39], [46, 42], [42, 46.5], [36, 44], [29, 44], [22, 46.5]], _g(c, 18, 39, 46, 47, '#ffeaa4', '#a87a22', '#e0b448'), 2.2);
    _r(c, 29.6, 45, 5, 10, _wood(c, 29, 0, 35, 0), 2.2); _l(c, 29.6, 48, 34.6, 49.4, 'rgba(0,0,0,.45)', 1.2); _l(c, 29.6, 51.6, 34.6, 53, 'rgba(0,0,0,.45)', 1.2);
    _o(c, 32, 58.6, 3.8, 3.8, null, 2.4); _o(c, 32, 58.6, 1.2, 1.2, k.a, 0); } },
  legend_sickle: { rot: 0, d(c, k) { _aura(c, 38, 22, 24, k.a, .38);
    c.lineCap = 'round'; for (const [col, w] of [[IK, 7.4], [WOOD[1], 4.4]]) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(14, 61); c.bezierCurveTo(18, 50, 26, 42, 32, 36); c.stroke(); }
    c.beginPath(); c.moveTo(30, 38); c.bezierCurveTo(6, 30, 14, 4, 52, 3); c.bezierCurveTo(30, 12, 28, 24, 38, 33); c.closePath(); c.fillStyle = _g(c, 8, 4, 50, 36, '#eef6e6', '#6f8a6a', '#bcd3b2'); c.fill(); c.lineWidth = 2.6; c.strokeStyle = IK; c.stroke();
    c.beginPath(); c.moveTo(27, 33); c.bezierCurveTo(13, 26, 20, 11, 42, 6); c.strokeStyle = k.al; c.lineWidth = 1.3; c.stroke();
    for (const [x, y, a] of [[24, 47, -.6], [19, 55, .5]]) { c.save(); c.translate(x, y); c.rotate(a); c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-2, -8, 8, -10, 11, -6); c.bezierCurveTo(8, 2, 3, 3, 0, 0); c.closePath(); c.fillStyle = k.a; c.fill(); c.lineWidth = 1.8; c.strokeStyle = IK; c.stroke(); c.restore(); }
    _o(c, 33, 36, 3.2, 3.2, _g(c, 30, 33, 36, 39, k.al, k.ad), 2); } },
  legend_lute: { rot: 0, d(c, k) { _aura(c, 28, 40, 26, k.a, .3);
    _l(c, 38, 28, 54, 10, IK, 8.4); _l(c, 38, 28, 54, 10, WOOD[1], 4.6); for (const t of [.25, .5, .75]) { const x = 38 + 16 * t, y = 28 - 18 * t; _l(c, x - 2.6, y - 2.4, x + 2.6, y + 2.4, '#d9b44c', 1.4); }
    _p(c, [[49, 7], [60, 1], [63, 8], [53, 14]], WOOD[0], 2.4); for (const [x, y] of [[53, 6], [57, 4.4], [57.6, 9]]) _o(c, x, y, 1.3, 1.3, '#ffeaa4', 1.2); _o(c, 61, 4.6, 1.6, 1.6, k.a, 1);
    c.beginPath(); c.moveTo(24, 24); c.bezierCurveTo(6, 22, 2, 46, 14, 57); c.bezierCurveTo(24, 66, 42, 58, 40, 41); c.bezierCurveTo(39, 31, 32, 25, 24, 24); c.closePath(); c.fillStyle = _g(c, 4, 26, 40, 62, '#d6975a', '#6e421f', '#a9692f'); c.fill(); c.lineWidth = 2.8; c.strokeStyle = IK; c.stroke();
    _o(c, 23, 42, 7.6, 7.6, '#1d1410', 2); _o(c, 23, 42, 10, 10, null, 1.4); c.strokeStyle = '#e0b448'; c.lineWidth = 1.2; _o(c, 23, 42, 5, 5, null, 1.2);
    _l(c, 24, 52, 38, 54.4, '#d9b44c', 2.4); for (const dy of [-1.5, 0, 1.5]) _l(c, 27 + dy, 53 + dy * .1, 52 + dy * .4, 12 + dy * .8, 'rgba(255,248,220,.75)', .8); } },
  sigil: { rot: 0, d(c, k) { _o(c, 32, 32, 26, 26, null, 4.2); c.beginPath(); c.arc(32, 32, 26, 0, 6.2832); c.lineWidth = 2.4; c.strokeStyle = k.a; c.stroke(); _p(c, [[32, 52], [12, 18], [52, 18]], null, 4.2); c.beginPath(); c.moveTo(32, 52); c.lineTo(12, 18); c.lineTo(52, 18); c.closePath(); c.lineWidth = 2.4; c.strokeStyle = k.a; c.stroke(); _o(c, 32, 29, 5, 5, k.a, 2.4); } },
  pentagram: { rot: 0, d(c, k) { const pts = [0, 2, 4, 1, 3].map(i => [32 + Math.sin(i * 1.2566) * 24, 34 - Math.cos(i * 1.2566) * 24]); _o(c, 32, 34, 27, 27, null, 4.2); c.beginPath(); c.arc(32, 34, 27, 0, 6.2832); c.lineWidth = 2.4; c.strokeStyle = k.a; c.stroke(); _p(c, pts, null, 4.2); c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.lineWidth = 2.4; c.strokeStyle = k.a; c.stroke(); } },
  food: { rot: 0, d(c, k) { _p(c, [[8, 38], [56, 38], [50, 56], [14, 56]], '#c78b4a'); _o(c, 32, 36, 24, 14, '#e0a85e'); _o(c, 26, 34, 5, 3, '#f1c98c', 0); _o(c, 38, 38, 4, 2.6, '#f1c98c', 0); } }
};
const GLYPH_NAMES = Object.keys(GLYPHS);

const ICONS = new Map();
function itemIconCanvas(glyph, color, art, px) {
  px = px || 64; const key = [glyph, color, art || '', art && Assets.imgs[art] ? 1 : 0, px].join('|');
  let cv = ICONS.get(key); if (cv) return cv;
  cv = makeCanvas(px, px); const c = cv.getContext('2d'), im = art ? Assets.get(art) : null;
  if (im) { const sc = Math.max(px / im.width, px / im.height), dw = im.width * sc, dh = im.height * sc; c.save(); rrPath(c, 2, 2, px - 4, px - 4, px * .18); c.clip(); c.imageSmoothingQuality = 'high'; c.drawImage(im, (px - dw) / 2, (px - dh) / 2, dw, dh); c.restore(); rrPath(c, 2, 2, px - 4, px - 4, px * .18); c.lineWidth = Math.max(2, px * .05); c.strokeStyle = IK; c.stroke(); }
  else c.drawImage(pixelIcon(glyph, color || '#b9c0cb', px), 0, 0);
  if (!art || im) { ICONS.set(key, cv); if (ICONS.size > 400) ICONS.delete(ICONS.keys().next().value); }
  return cv;
}
/* ---------- estilo 2D de jogo: desenha numa grade pequena (~32-40 px), corta o alfa, reduz as cores (cel-shading),
   põe contorno de 1 px, luz no canto superior esquerdo e sombra no inferior direito; amplia sem suavizar ---------- */
const INK_RGB = [27, 20, 16];
function pixelIcon(glyph, color, px) {
  const k = Math.max(1, Math.round(px / 40)), N = Math.max(16, Math.floor(px / k)), t = makeCanvas(N, N), c = t.getContext('2d', { willReadFrequently: true });
  c.save(); c.translate(N / 2, N / 2); c.scale(.93, .93); c.translate(-N / 2, -N / 2); drawGlyph(c, glyph, color, N); c.restore();
  const im = c.getImageData(0, 0, N, N), d = im.data, M = new Uint8Array(N * N), at = (x, y) => (x < 0 || y < 0 || x >= N || y >= N) ? 0 : M[y * N + x];
  for (let i = 0; i < N * N; i++) { const a = d[i * 4 + 3]; M[i] = a >= 150 ? 2 : a >= 60 ? 1 : 0; }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (M[y * N + x] === 1 && (!at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1) || !at(x, y + 1))) M[y * N + x] = 0;
  const out = c.createImageData(N, N), o = out.data, INK = new Uint8Array(N * N), sol = (x, y) => { const v = at(x, y); return v === 1 || v === 2; };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x, m = M[i];
    if (m === 2) { let r = Math.round(d[i * 4] / 51) * 51, g = Math.round(d[i * 4 + 1] / 51) * 51, b = Math.round(d[i * 4 + 2] / 51) * 51; if (.3 * r + .59 * g + .11 * b < 40) { r = INK_RGB[0]; g = INK_RGB[1]; b = INK_RGB[2]; INK[i] = 1; } o[i * 4] = r; o[i * 4 + 1] = g; o[i * 4 + 2] = b; o[i * 4 + 3] = 255; }
    else if (m === 1) { o[i * 4] = 214; o[i * 4 + 1] = 230; o[i * 4 + 2] = 248; o[i * 4 + 3] = 120; }
    else if (sol(x - 1, y) || sol(x + 1, y) || sol(x, y - 1) || sol(x, y + 1)) { o[i * 4] = INK_RGB[0]; o[i * 4 + 1] = INK_RGB[1]; o[i * 4 + 2] = INK_RGB[2]; o[i * 4 + 3] = 255; INK[i] = 1; M[i] = 3; }
  }
  const edge = (x, y) => at(x, y) === 0 || at(x, y) === 3 || (x >= 0 && y >= 0 && x < N && y < N && INK[y * N + x] === 1);
  const base = o.slice();
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x; if (M[i] !== 2 || INK[i]) continue;
    const lit = edge(x, y - 1) || edge(x - 1, y), dark = edge(x + 1, y) || edge(x, y + 1), f = lit && !dark ? .26 : dark && !lit ? -.3 : 0; if (!f) continue;
    for (let q = 0; q < 3; q++) { const v = base[i * 4 + q]; o[i * 4 + q] = f > 0 ? v + (255 - v) * f : v * (1 + f); }
  }
  c.putImageData(out, 0, 0);
  const cv = makeCanvas(px, px), g2 = cv.getContext('2d'); g2.imageSmoothingEnabled = false; const ox = Math.floor((px - N * k) / 2), oy = Math.floor((px - N * k) / 2); g2.drawImage(t, 0, 0, N, N, ox, oy, N * k, N * k);
  return cv;
}

function drawGlyph(c, glyph, color, S) {
  const g = GLYPHS[glyph] || GLYPHS.box; c.save(); c.scale(S / 64, S / 64); c.lineJoin = 'round'; c.lineCap = 'round';
  if (g.rot) { c.translate(32, 32); c.rotate(g.rot * Math.PI / 180); c.scale(1.2, 1.2); c.translate(-32, -32); }
  const col = /^#[0-9a-f]{6}$/i.test(color) ? color : '#b9c0cb'; try { g.d(c, { a: col, ad: shade(col, -.38), al: shade(col, .38) }); } catch (e) { /* */ }
  c.restore();
}

/* ---------- catálogos ---------- */
const ITEMDB = {}; const ITEM_LISTS = { op: [], dnd: [] };
function I(sys, id, name, cat, slot, glyph, color, stats, desc, extra) { const it = Object.assign({ id: sys + '_' + id, sys, name, cat, slot, glyph, color, stats: stats || '', desc: desc || '' }, extra || {}); ITEMDB[it.id] = it; ITEM_LISTS[sys].push(it); }
const OP = (...a) => I('op', ...a), DN = (...a) => I('dnd', ...a);



/* ---------- inventário / equipamento (dados em C.inv[personagem], itens próprios em C.customItems, ajustes de arte em C.itemOv) ---------- */
function resolveItem(C, id) {
  if (typeof ITEM_ALIAS !== 'undefined' && ITEM_ALIAS[id]) id = ITEM_ALIAS[id];
  const base = ITEMDB[id] || (C && C.customItems || []).find(x => x.id === id); if (!base) return null;
  const ov = C && C.itemOv && C.itemOv[id]; return ov ? Object.assign({}, base, ov) : base;
}
function invOf(C, pid) { C.inv = C.inv || {}; return C.inv[pid] || (C.inv[pid] = []); }
function slotsOf(it) { return it && it.slot ? (it.slot === 'two' ? ['main', 'off'] : [it.slot]) : []; }
function giveItem(C, pid, itemId, qty) {
  const inv = invOf(C, pid), it = resolveItem(C, itemId); if (!it) return null; qty = Math.max(1, qty | 0 || 1);
  const stack = !it.slot && inv.find(e => e.item === itemId); if (stack) { stack.qty += qty; return stack; }
  const e = { id: uid('v'), item: itemId, qty, eq: false, on: true }; inv.push(e); return e;
}
function equipItem(C, pid, iid, on) {
  const inv = invOf(C, pid), e = inv.find(x => x.id === iid); if (!e) return false; const it = resolveItem(C, e.item); if (!it || !it.slot) return false;
  if (!on) { e.eq = false; return true; }
  const need = slotsOf(it);
  for (const o of inv) { if (o === e || !o.eq) continue; const oi = resolveItem(C, o.item); if (!oi) continue; const os = slotsOf(oi); if (os.some(s => need.includes(s) && s !== 'acc')) o.eq = false; }
  if (need.includes('acc')) { const acc = inv.filter(o => o !== e && o.eq && slotsOf(resolveItem(C, o.item)).includes('acc')); while (acc.length >= 2) acc.shift().eq = false; }
  e.eq = true; return true;
}
function equippedOf(C, pid) { return invOf(C, pid).map(e => ({ e, it: resolveItem(C, e.item) })).filter(x => x.e.eq && x.it); }
/* o que vai no token: até 4 ícones pequenos + luz da primeira fonte acesa */
function tokenEquip(C, pid) {
  const list = equippedOf(C, pid).sort((a, b) => SLOT_ORDER.indexOf(a.it.slot) - SLOT_ORDER.indexOf(b.it.slot)), out = {};
  out.eq = list.slice(0, 4).map(x => [x.it.glyph, x.it.color, x.it.art || null]);
  const lt = list.find(x => x.it.light && x.e.on !== false); if (lt) out.lt = { r: lt.it.light[0], color: lt.it.light[1], flicker: !!lt.it.light[2] };
  return out;
}
/* versão enviada ao jogador (inclui dados de itens próprios) */
function invForPlayer(C, pid) {
  return invOf(C, pid).map(e => { const it = resolveItem(C, e.item); return it ? { id: e.id, qty: e.qty, eq: !!e.eq, on: e.on !== false, it: { id: it.id, name: it.name, cat: it.cat, slot: it.slot || null, glyph: it.glyph, color: it.color, stats: it.stats || '', desc: it.desc || '', elem: it.elem || null, light: it.light || null, art: it.art || null, sys: it.sys } } : null; }).filter(Boolean);
}

/* ícones pequenos sobre o token (lado inferior direito) */
function drawEquipBadges(c, t, D, o) {
  const n = t.eq.length, b = D * .36, s = (o && o.s) || 1, px = [32, 64, 128].find(p => p >= b * s * 1.1) || 128;
  for (let i = 0; i < n; i++) {
    const a = (-24 + i * 32) * Math.PI / 180, cx = t.x + Math.cos(a) * D * .5, cy = t.y + Math.sin(a) * D * .5, e = t.eq[i];
    c.save(); c.globalAlpha *= (t.alpha == null ? 1 : t.alpha) * (o && o.ghost ? .45 : 1);
    c.beginPath(); c.arc(cx, cy, b * .58, 0, 6.2832); c.fillStyle = 'rgba(14,12,16,.86)'; c.fill(); c.lineWidth = b * .07; c.strokeStyle = 'rgba(255,255,255,.55)'; c.stroke();
    c.imageSmoothingQuality = 'high'; c.drawImage(itemIconCanvas(e[0], e[1], e[2], px), cx - b * .46, cy - b * .46, b * .92, b * .92); c.restore();
  }
}
