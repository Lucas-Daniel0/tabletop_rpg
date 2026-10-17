'use strict';
/* ===== templates_dnd.js — mapas prontos para D&D (1 bloco = 1 quadrado de 1,5 m / 5 pés). Tudo é editável. ===== */

function dndKit(C, ox, oy, fn) {
  const T = tplHelpers(C, ox, oy, fn), g = C.grid, { el, wall, room, X, Y } = T;
  const lt = (kind, cx, cy, o) => { const l = fn.addLight(X(cx), Y(cy)); Object.assign(l, lightDefaults(kind, g), o || {}); if (o && o.r) l.r = o.r * g; return l; };
  const doorH = (x, y, len) => el('door', x, y - .15, len || 1, .3, { color: '#6b4423' });
  const doorV = (x, y, len) => el('door', x - .15, y, .3, len || 1, { color: '#6b4423' });
  const mon = (name, cx, cy, size, hidden) => { const n = fn.addCreature(X(cx), Y(cy)); n.name = name; n.size = size || 1; n.hidden = hidden !== false; return n; };
  const zone = (cx, cy, w, h, name, verb, tcx, tcy, area) => { const z = fn.addZone(X(cx), Y(cy), w * g, h * g); z.name = name; z.verb = verb; z.targetX = Math.floor(X(tcx) / g) * g + g / 2; z.targetY = Math.floor(Y(tcy) / g) * g + g / 2; z.targetArea = area ? area.id : null; return z; };
  const scatter = (R, n, box, kinds, test) => { for (let i = 0, t = 0; i < n && t < n * 30; t++) { const x = box[0] + R() * (box[2] - box[0]), y = box[1] + R() * (box[3] - box[1]); if (test && !test(x, y)) continue; const k = kinds[(R() * kinds.length) | 0]; k(x, y); i++; } };
  return { T, g, el, wall, room, X, Y, lt, doorH, doorV, mon, zone, scatter };
}

/* 1 — Masmorra: cripta esquecida (56×40) */
function tplDungeon(C, ox, oy, fn) {
  const K = dndKit(C, ox, oy, fn), { g, el, wall, room, lt, doorH, doorV, mon } = K, R = rng(5051);
  const area = fn.addAreaObj(ox, oy, 56 * g, 40 * g, { name: 'Masmorra — Cripta esquecida', color: '#050506', darkness: .8, ambient: '#04050c' });
  const stone = '#3b3d44', dark = '#2c2e35';
  // entrada
  room(2, 3, 9, 8, 'stonefloor', stone, { r: [[3, 5]] }); el('stairs', 3, 4, 1.4, 3, { rot: 0 }); el('column', 6, 4, .8, .8); el('column', 6, 8, .8, .8); el('barrel', 9.6, 3.6, .8, .8); el('crate', 9.5, 9.2, 1, 1); el('cobweb', 2.2, 3.2, 2, 2);
  // corredor 1
  el('stonefloor', 11, 6, 12, 2, { color: dark }); wall(11, 6, 23, 6); wall(11, 8, 23, 8); doorV(11, 7, 1);
  // sala dos guardas
  room(23, 2, 12, 9, 'stonefloor', stone, { l: [[4.5, 6.5]], r: [[3.5, 5.5]], b: [[5, 7]] }); el('table', 26, 5, 3, 1.2, { color: '#4a2f1a' }); [[26.4, 4.3], [27.8, 4.3], [27.2, 6.4], [28.6, 6.4]].forEach((p, i) => el('stool', p[0], p[1], .6, .6, { rot: i * 40 })); el('bed_cell', 31, 2.6, .9, 1.9); el('bed_cell', 32.3, 2.6, .9, 1.9); el('barrel', 24, 2.5, .8, .8); el('crate', 33.2, 8.6, 1, 1); el('blood', 29, 8, 1.6, 1.6, { alpha: .8 });
  doorV(23, 5.5, 1); doorV(35, 4.5, 1); doorH(29, 11, 1);
  // cofre do tesouro
  room(35, 2, 9, 8, 'stonefloor', '#2f2a22', { l: [[2.5, 4.5]] }); [[37, 2.6], [39, 2.6], [41, 2.6]].forEach(p => el('chest', p[0], p[1], 1, .8, { color: '#8a5a2a' })); el('chest', 41.6, 7.6, 1, .8, { color: '#c9a227', rot: 180 }); el('crate', 36.4, 8, 1, 1); el('candles', 38.5, 6, .6, .6);
  // corredor para o ritual
  el('stonefloor', 28, 11, 2, 5.5, { color: dark }); wall(28, 11, 28, 16.5); wall(30, 11, 30, 16.5);
  // sala do ritual
  room(20, 16, 18, 14, 'stonefloor', '#26242c', { t: [[8, 10]], l: [[5.5, 7.5]], r: [[5.5, 7.5]] }); el('ritual', 25, 18.5, 8, 8, { color: '#b3121c' }); el('altar', 27.4, 22, 3.2, 1.4); el('blood', 28.2, 23.6, 2, 2); [[21.6, 17.5], [35.6, 17.5], [21.6, 27.6], [35.6, 27.6]].forEach(p => { el('column', p[0], p[1], .9, .9); el('candles', p[0] + .1, p[1] + 1.2, .6, .6); }); el('cobweb', 20.2, 16.2, 2, 2);
  // corredor para as celas e para o ossuário
  el('stonefloor', 16, 21, 4, 2, { color: dark }); wall(16, 21, 20, 21); wall(16, 23, 20, 23); el('stonefloor', 38, 21, 4, 2, { color: dark }); wall(38, 21, 42, 21); wall(38, 23, 42, 23);
  doorV(20, 21.5, 1); doorV(38, 21.5, 1);
  // celas
  room(2, 16, 14, 14, 'metal', '#23262b', { r: [[5.5, 7.5]] }); wall(2, 21, 9, 21, [[3.6, 4.8]], 8); wall(2, 25, 9, 25, [[3.6, 4.8]], 8); wall(9, 16, 9, 30, [[5, 6.2], [9, 10.2], [13, 14]], 8); wall(9, 22, 16, 22, null, 6);
  [[3, 17], [3, 22], [3, 26.4]].forEach(p => el('bed_cell', p[0], p[1], .9, 1.9, { rot: 90 })); [[10.4, 16.6], [10.4, 23.2], [12.2, 26]].forEach((p, i) => el('bed_cell', p[0], p[1], .9, 1.9, { flip: i % 2 === 0 })); el('bodybag', 13.6, 17, 1, 2); el('barrel', 14.6, 28.4, .8, .8);
  // ossuário
  room(42, 16, 12, 14, 'stonefloor', '#2a2a2e', { l: [[5.5, 7.5]] }); [[44, 17.5], [46.5, 17.5], [49, 17.5], [51.4, 17.5], [44, 26.6], [46.5, 26.6], [49, 26.6], [51.4, 26.6]].forEach(p => el('tomb', p[0], p[1], .9, 1.1)); el('cobweb', 52, 16.2, 2, 2, { flip: true }); el('cobweb', 42.2, 28, 2, 2); el('altar', 47, 21.2, 2.4, 1.2, { color: '#5a5a62' }); el('candles', 47.9, 22.7, .6, .6);
  // luzes e monstros
  [[3.4, 7], [9.2, 5], [24.2, 6], [33.8, 5], [29, 14], [20.6, 22], [37.6, 22], [3, 22]].forEach((p, i) => lt('torch', p[0], p[1], { r: 3.6 }));
  lt('natural', 29, 22.5, { color: '#ff3a3a', r: 6, intensity: .6, flicker: true }); lt('natural', 47, 22, { color: '#8fd8ff', r: 4, intensity: .4, flicker: true }); lt('natural', 39.5, 5, { color: '#ffd24d', r: 4, intensity: .5 });
  mon('Guarda esquelético', 27, 7, 1); mon('Guarda esquelético', 31, 5, 1); mon('Cultista', 26, 22, 1); mon('Cultista', 32, 22, 1); mon('Mímico (baú)', 41.6, 8, 1);
  return area;
}

/* 2 — Taverna "O Javali Dourado" (44×30) + andar de cima (anexo) */
function tplTavern(C, ox, oy, fn) {
  const K = dndKit(C, ox, oy, fn), { g, el, wall, room, lt, doorH, doorV, mon, zone, X, Y } = K, R = rng(7733);
  const area = fn.addAreaObj(ox, oy, 46 * g, 32 * g, { name: 'Taverna — O Javali Dourado', color: '#0c0906', darkness: .45, ambient: '#0a0604' });
  el('grass', 0, 0, 46, 32, { color: '#27421f' }); el('trail', 17, 29.4, 12, 2.6, { color: '#7d5b34' });
  // salão
  room(3, 3, 40, 25, 'wood', '#8a5a2e', { b: [[19, 22]], r: [[17, 20]], t: [[34, 36]] }); doorH(19, 28, 3); doorV(43, 17, 3);
  // balcão e prateleiras
  el('counter', 5, 5, 12, .9, { color: '#5a3a20' }); el('shelf', 5, 3.4, 12, .6, { color: '#3a2415' }); el('barrel', 18, 3.6, .9, .9); el('barrel', 19.2, 3.6, .9, .9); el('barrel', 20.4, 3.6, .9, .9);
  [[7, 6.4], [9, 6.4], [11, 6.4], [13, 6.4], [15, 6.4]].forEach(p => el('stool', p[0], p[1], .6, .6, { color: '#6b4423' }));
  // lareira
  el('stonefloor', 33, 3, 9, 4, { color: '#4a4a52' }); el('campfire', 36.6, 4, 1.2, 1.2); el('sofa', 33.6, 7.8, 2.4, 1, { color: '#7a2a1a' }); el('sofa', 39, 7.8, 2.4, 1, { color: '#7a2a1a' });
  // mesas
  [[8, 11], [14, 14], [20, 11], [26, 14], [32, 12], [11, 20], [18, 21], [26, 21], [34, 20]].forEach((p, i) => { const r = i % 3 === 0; el(r ? 'table_round' : 'table', p[0], p[1], r ? 2.2 : 2.4, r ? 2.2 : 1.2, { color: '#5a3a20', rot: r ? 0 : (i % 2) * 90 }); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + i; el('stool', p[0] + (r ? 1.1 : 1.2) + Math.cos(a) * 1.6 - .3, p[1] + (r ? 1.1 : .6) + Math.sin(a) * 1.4 - .3, .6, .6, { color: '#6b4423' }); } });
  el('carpet', 17, 24, 8, 3, { color: '#7a1f1f' });
  // cozinha
  wall(21, 3, 21, 8, [[3, 4.4]]); el('cabinet', 22, 3.4, 1.2, .7); el('counter', 22.4, 6.6, 5, .9, { color: '#7a5a38' }); el('barrel', 29, 3.6, .8, .8); el('crate', 30.2, 3.6, 1, 1);
  // escada para cima
  el('stairs', 40.4, 22, 1.8, 3.6, { rot: 0 });
  // luzes
  [[6, 4], [12, 10], [24, 9], [24, 19], [36, 19], [12, 24], [40, 14]].forEach(p => lt('lamp', p[0], p[1], { r: 5 }));
  lt('natural', 36.6, 4.6, { color: '#ff9a3a', r: 8, intensity: .9, flicker: true }); lt('torch', 19, 27.2, { r: 3.5 }); lt('torch', 24.4, 27.2, { r: 3.5 });
  // andar de cima
  const ax = ox + 46 * g + 6 * g, A = fn.addAreaObj(ax, oy, 30 * g, 18 * g, { name: 'Taverna — Andar de cima', color: '#0a0705', darkness: .55, ambient: '#05060a' });
  const K2 = dndKit(C, ax, oy, fn), e2 = K2.el, r2 = K2.room;
  e2('wood', 0, 0, 30, 18, { color: '#6a4424' }); e2('carpet', 1, 7.4, 28, 2.6, { color: '#5a1f18' });
  [[1, 1], [11, 1], [21, 1]].forEach((p, i) => { r2(p[0], p[1], 8, 6, 'wood', '#8a5a2e', { b: [[3, 4.2]] }); e2('bed_dbl', p[0] + .6, p[1] + .6, 2, 2.2, { color: ['#6a2b2b', '#2b4a6a', '#3a6a2b'][i] }); e2('chest', p[0] + 5.4, p[1] + 4.4, 1, .8); e2('table', p[0] + 5.2, p[1] + .6, 1.6, .9); K2.doorH(p[0] + 3, p[1] + 6, 1.2); });
  [[1, 11], [11, 11]].forEach((p, i) => { r2(p[0], p[1], 8, 6, 'wood', '#8a5a2e', { t: [[3, 4.2]] }); e2('bed_dbl', p[0] + .6, p[1] + 3.2, 2, 2.2, { color: '#6a2b6a' }); e2('bookcase', p[0] + 6, p[1] + 3, 1, 2); K2.doorH(p[0] + 3, p[1], 1.2); });
  e2('stairs', 26, 11, 1.8, 3.6, { rot: 180 }); K2.lt('lamp', 6, 8.6, { r: 5 }); K2.lt('lamp', 18, 8.6, { r: 5 }); K2.lt('lamp', 26, 8.6, { r: 5 });
  zone(40.4, 22, 2, 3.6, 'Andar de cima', 'Subir', 26.8, 12.6, A); // do salão para o andar de cima
  const back = fn.addZone(ax + 26 * g, oy + 11 * g, 2 * g, 3.6 * g); back.name = 'Salão'; back.verb = 'Descer'; back.targetX = Math.floor(X(38.6) / g) * g + g / 2; back.targetY = Math.floor(Y(23.5) / g) * g + g / 2; back.targetArea = area.id;
  mon('Valentão bêbado', 28, 12, 1, false); mon('Informante encapuzado', 38, 6.6, 1, false);
  return area;
}

/* 3 — Estrada na floresta: emboscada (52×36) */
function tplForestRoad(C, ox, oy, fn) {
  const K = dndKit(C, ox, oy, fn), { g, el, lt, mon, X, Y } = K, R = rng(90210);
  const area = fn.addAreaObj(ox, oy, 52 * g, 36 * g, { name: 'Estrada da floresta — Emboscada', color: '#0b160c', darkness: .3, ambient: '#06101c' });
  el('grass', 0, 0, 52, 36, { color: '#1f3f22' });
  const road = (x0, y0, x1, y1, w) => { const len = Math.hypot(x1 - x0, y1 - y0) + 1, ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI; el('trail', (x0 + x1) / 2 - len / 2, (y0 + y1) / 2 - w / 2, len, w, { rot: ang, color: '#7d5b34' }); };
  const pts = [[0, 20], [10, 19], [20, 15.5], [30, 16], [40, 20], [52, 18.5]]; for (let i = 0; i < pts.length - 1; i++) road(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 4);
  // riacho com ponte
  el('water', 26, 0, 4.5, 10, { color: '#2d6d8f' }); el('water', 25.6, 9, 5, 5.2, { color: '#2d6d8f' }); el('water', 25.8, 17.4, 5, 4.4, { color: '#2d6d8f' }); el('water', 26.4, 21, 4.2, 15, { color: '#2d6d8f' });
  el('wood', 25, 14, 6.4, 3.6, { color: '#7a5230' }); el('fence', 25, 13.8, 6.4, .3); el('fence', 25, 17.4, 6.4, .3);
  const nearRoad = (x, y, m) => pts.some((p, i) => i < pts.length - 1 && segDist(x, y, p[0], p[1], pts[i + 1][0], pts[i + 1][1]) < 2.6 + m);
  const nearWater = (x, y) => x > 24 && x < 32 && (y < 14 || y > 17.4);
  let n = 0, t = 0; while (n < 190 && t < 4000) { t++; const x = R() * 52, y = R() * 36; if (nearRoad(x, y, 1) || nearWater(x, y)) continue; const s = 2.2 + R() * 2.2, kind = R() < .65 ? 'tree' : 'pine'; el(kind, x - s / 2, y - s / 2, s, s, { color: kind === 'tree' ? ['#2c6430', '#35703a', '#27582c'][(R() * 3) | 0] : ['#1c4632', '#17402e'][(R() * 2) | 0], rot: R() * 360 }); n++; }
  for (let i = 0; i < 26; i++) { const x = R() * 52, y = R() * 36; if (nearRoad(x, y, .2) || nearWater(x, y)) continue; el(R() < .6 ? 'bush' : 'flowers', x, y, 1, 1, { rot: R() * 360 }); }
  [[12, 24], [18, 11], [36, 25], [42, 14], [8, 14]].forEach(p => el('rock', p[0], p[1], 1.2 + R(), 1.2 + R(), { rot: R() * 360 }));
  el('dead_tree', 33, 12, 2.4, 2.4); el('stumps', 9, 26, 3, 2);
  // carroça tombada
  el('wood', 13.4, 16.6, 4.4, 2.2, { color: '#6a4424', rot: 18 }); el('crate', 12.6, 15.4, 1, 1, { rot: 24 }); el('crate', 18.6, 15.6, 1, 1, { rot: -20 }); el('barrel', 17.6, 19.6, .8, .8); el('barrel', 12, 19.2, .8, .8); el('blood', 15, 17.6, 1.6, 1.6, { alpha: .75 });
  // acampamento dos bandidos (escondido entre árvores)
  el('tent', 40, 5, 2, 2.4, { color: '#6a5a3a' }); el('campfire', 38.4, 7.4, 1, 1); el('crate', 42.6, 6.8, 1, 1);
  lt('natural', 38.9, 7.9, { color: '#ff9a3a', r: 5, intensity: .9, flicker: true }); lt('natural', 15, 17.5, { color: '#ffcf7a', r: 4, intensity: .5, flicker: true }); lt('natural', 27, 6, { color: '#9ad8ff', r: 8, intensity: .35 });
  mon('Bandido (emboscada)', 9, 15, 1); mon('Bandido (emboscada)', 22, 13, 1); mon('Arqueiro bandido', 35, 14, 1); mon('Líder bandido', 38, 18, 1); mon('Lobo', 7, 22, 1);
  return area;
}

/* 4 — Praça da vila medieval (56×40) */
function tplVillage(C, ox, oy, fn) {
  const K = dndKit(C, ox, oy, fn), { g, el, wall, lt, mon, doorH, X, Y } = K, R = rng(31337);
  const area = fn.addAreaObj(ox, oy, 56 * g, 40 * g, { name: 'Vila — Praça do mercado', color: '#101c10', darkness: 0, ambient: '#0a1020' });
  el('grass', 0, 0, 56, 40, { color: '#2d5a2a' });
  el('cobble', 16, 10, 24, 20, { color: '#8a8478' }); el('trail', 0, 18, 18, 4, { color: '#7d5b34' }); el('trail', 38, 18, 18, 4, { color: '#7d5b34' }); el('trail', 26, 0, 4, 12, { color: '#7d5b34', rot: 0 }); el('trail', 26, 28, 4, 12, { color: '#7d5b34' });
  el('well', 27.2, 19.2, 1.6, 1.6); el('column', 22, 15, .8, .8); el('column', 33, 15, .8, .8);
  // barracas do mercado
  [[18, 12], [21.6, 12], [25.2, 11.4], [29, 12], [32.6, 12], [18, 26], [21.6, 26], [29, 26.4], [32.6, 26]].forEach((p, i) => { el('tent', p[0], p[1], 2, 2, { color: ['#b8321f', '#2b5a8a', '#c9a227', '#3a7a4a'][i % 4] }); el('table', p[0] + .2, p[1] + 2, 1.6, .8, { color: '#6b4423' }); el('crate', p[0] - .2, p[1] + 2.9, .8, .8); el('barrel', p[0] + 1.4, p[1] + 2.9, .7, .7); });
  // casas
  [[4, 3, 'house_l', '#a83a22'], [10, 6, 'house_s', '#b8321f'], [42, 3, 'house_l', '#c1622a'], [48, 7, 'house_s', '#a82e1c'], [4, 28, 'house_l', '#b0301e'], [11, 31, 'house_s', '#c23b24'], [42, 29, 'house_l', '#a83a22'], [49, 32, 'house_s', '#b8321f'], [3, 12, 'house_s', '#c1622a'], [49, 14, 'house_s', '#a82e1c'], [3, 22, 'house_s', '#b0301e'], [50, 23, 'house_s', '#c23b24']].forEach((h, i) => el(h[2], h[0], h[1], h[2] === 'house_l' ? 4.4 : 2.6, h[2] === 'house_l' ? 3.4 : 2.6, { color: h[3], rot: [0, 90, 0, 180][i % 4] }));
  el('manor', 20, 0.4, 5, 5.6, { color: '#6a6a74', rot: 0 }); el('tower', 31, 2, 2.4, 2.4, { color: '#d8d1bf' }); el('barn', 40, 33.4, 5, 3.6, { color: '#cb5c1c', rot: 90 });
  for (let i = 0; i < 6; i++) { el('fence', 2 + i * 3, 37.6, 3, .3); el('fence', 34 + i * 3, 37.6, 3, .3); }
  el('field', 14, 34, 9, 3.4, { color: '#7aa02a' }); el('field', 24, 34, 8, 3.4, { color: '#4a9a2a' });
  for (let i = 0; i < 40; i++) { const x = R() * 56, y = R() * 40; if ((x > 14 && x < 41 && y > 9 && y < 31) || Math.abs(y - 20) < 3 || (x > 25 && x < 31 && (y < 12 || y > 28))) continue; const s = 2 + R() * 1.6; el(R() < .6 ? 'tree' : 'pine', x - s / 2, y - s / 2, s, s, { rot: R() * 360 }); }
  [[8, 20], [46, 20], [28, 9.5], [28, 30.5], [17, 11], [38, 11], [17, 29], [38, 29]].forEach(p => lt('post', p[0], p[1], { r: 6, intensity: .7 }));
  mon('Ladrão de bolsos', 24, 18, 1); mon('Guarda da vila', 19, 20, 1, false); mon('Mercador', 22, 14.6, 1, false);
  return area;
}

/* 5 — Covil do dragão: caverna (54×40) */
function tplCave(C, ox, oy, fn) {
  const K = dndKit(C, ox, oy, fn), { g, el, lt, mon, X, Y } = K, R = rng(66601);
  const area = fn.addAreaObj(ox, oy, 54 * g, 40 * g, { name: 'Caverna — Covil do dragão', color: '#040303', darkness: .85, ambient: '#05030a' });
  // piso de terra + paredes de rocha irregulares (elipse com ondulação)
  el('dirt', 0, 0, 54, 40, { color: '#4a3a2c' }); el('dirt', 5, 5, 40, 30, { color: '#54422f', alpha: .7 });
  const inside = (x, y) => { const a = Math.atan2((y - 20) / 17, (x - 27) / 24), w = 1 + .08 * Math.sin(a * 5 + 1) + .06 * Math.sin(a * 11), nx = (x - 27) / (24 * w), ny = (y - 20) / (17 * w); return nx * nx + ny * ny < 1; };
  const rockC = ['#4a4a52', '#3e3e46', '#55555e', '#35353d'];
  const rk = (x, y, k) => el('rock', x - k / 2, y - k / 2, k, k, { rot: R() * 360, color: rockC[(R() * rockC.length) | 0] });
  for (let y = -1; y < 41; y += 1.7) for (let x = -1; x < 55; x += 1.7) { const px = x + R() * 1.2, py = y + R() * 1.2; if (!inside(px, py)) rk(px, py, 2.2 + R() * 1.6); }
  for (let i = 0; i < 26; i++) { let x = 2 + R() * 50, y = 2 + R() * 36; if (inside(x, y) && Math.hypot(x - 28, y - 21) > 7) rk(x, y, .8 + R() * 1.1); }
  // lago subterrâneo
  el('water', 24, 18, 9, 6, { color: '#1f4a66' }); el('water', 26, 22, 6, 4, { color: '#1f4a66' });
  // tesouro do dragão
  [[38, 14], [40, 13], [41.5, 15], [39, 16.4]].forEach(p => el('chest', p[0], p[1], 1, .8, { color: ['#c9a227', '#8a5a2a'][(R() * 2) | 0], rot: R() * 40 })); el('crate', 42.4, 12.4, 1, 1); el('barrel', 36.6, 12.2, .8, .8); el('blood', 34, 18, 2, 2, { alpha: .6 });
  [[9.6, 22.4], [11.2, 23.4]].forEach(p => el('tomb', p[0], p[1], .8, 1)); el('campfire', 7.6, 19.2, 1, 1); el('cobweb', 11.6, 9.8, 2, 2); el('cobweb', 30, 6.2, 2, 2, { flip: true }); el('dead_tree', 14, 30, 2, 2);
  lt('torch', 8.8, 19.2, { r: 4 }); lt('natural', 8, 19.6, { color: '#ff9a3a', r: 5, intensity: .8, flicker: true }); lt('natural', 40, 14.5, { color: '#ffd24d', r: 6, intensity: .7, flicker: true }); lt('natural', 28, 21, { color: '#5ac8ff', r: 6, intensity: .45, flicker: true }); lt('natural', 24, 8, { color: '#a455e8', r: 4, intensity: .5 }); lt('natural', 14, 26, { color: '#3ec06e', r: 3.5, intensity: .45 });
  mon('Dragão jovem', 40, 15, 4); mon('Kobold', 12, 13, 1); mon('Kobold', 14, 24, 1); mon('Kobold', 30, 9, 1); mon('Morcego gigante', 20, 20, 1);
  return area;
}

const DND_TEMPLATES = {
  dungeon: { name: 'Masmorra — cripta esquecida', icon: '🗝', fn: tplDungeon, note: 'salas, celas, ossuário, ritual e cofre' },
  tavern: { name: 'Taverna — O Javali Dourado (2 andares)', icon: '🍺', fn: tplTavern, note: 'salão, cozinha e quartos com escada' },
  forestroad: { name: 'Estrada da floresta — emboscada', icon: '🌲', fn: tplForestRoad, note: 'carroça tombada, ponte e bandidos' },
  village: { name: 'Vila medieval — praça do mercado', icon: '🏘', fn: tplVillage, note: 'barracas, casas, poço e torre' },
  cave: { name: 'Caverna — covil do dragão', icon: '🐉', fn: tplCave, note: 'lago subterrâneo e tesouro' }
};
