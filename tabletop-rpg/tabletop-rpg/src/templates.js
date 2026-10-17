'use strict';
/* ===== templates.js — modelos de mapa inspirados nos tabuleiros de Ordem Paranormal ===== */

function tplHelpers(C, ox, oy, fn) {
  const g = C.grid;
  const X = c => ox + c * g, Y = c => oy + c * g;
  const el = (kind, cx, cy, cw, ch, o) => { const d = CATALOG[kind]; const e = fn.addEl(kind, X(cx), Y(cy), (cw == null ? d.cw : cw) * g, (ch == null ? d.ch : ch) * g, o || {}); return e; };
  const wall = (x1, y1, x2, y2, gaps, thick) => { // gaps: [[t0,t1],...] em células ao longo do segmento
    const len = Math.hypot(x2 - x1, y2 - y1); if (!len) return; const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    let pos = 0; const gs = (gaps || []).slice().sort((a, b) => a[0] - b[0]);
    const seg = (a, b) => { if (b - a > .05) { const w = fn.addWall(X(x1 + ux * a), Y(y1 + uy * a), X(x1 + ux * b), Y(y1 + uy * b)); w.thick = thick || 10; } };
    for (const gp of gs) { seg(pos, gp[0]); pos = gp[1]; } seg(pos, len);
  };
  const room = (cx, cy, cw, ch, floor, color, gaps, o) => {
    if (floor) el(floor, cx, cy, cw, ch, color ? { color } : {});
    const gp = gaps || {};
    wall(cx, cy, cx + cw, cy, gp.t); wall(cx + cw, cy, cx + cw, cy + ch, gp.r); wall(cx + cw, cy + ch, cx, cy + ch, gp.b ? gp.b.map(q => [cw - q[1], cw - q[0]]) : null); wall(cx, cy + ch, cx, cy, gp.l ? gp.l.map(q => [ch - q[1], ch - q[0]]) : null);
  };
  const door = (cx, cy, horiz) => { const e = el('door', horiz ? cx : cx, horiz ? cy - .15 : cy, horiz ? 1 : .3, horiz ? .3 : 1); return e; };
  return { g, X, Y, el, wall, room, door };
}

function tplFacility(C, ox, oy, fn) {
  const g = C.grid, T = tplHelpers(C, ox, oy, fn), { el, wall, room, X, Y } = T;
  const area = fn.addAreaObj(ox, oy, 64 * g, 40 * g, { name: 'Base de contenção', color: '#060607', darkness: .5, ambient: '#05070c' });
  // corredor das celas
  el('concrete', 6, 2, 18, 18.5, { color: '#3f4643' });
  // celas superiores (4) e inferiores (4)
  [6.5, 10.5, 14.5, 18.5].forEach(x => {
    room(x, 2, 3.6, 3.4, 'metal', '#262a2d', { b: [[1, 2.6]] }); el('bed_cell', x + .4, 2.4, .9, 1.9); el('toilet', x + 2.5, 2.3, .6, .8);
    room(x, 16.4, 3.6, 3.4, 'metal', '#262a2d', { t: [[1, 2.6]] }); el('bed_cell', x + .5, 17.2, .9, 1.9, { flip: true }); el('toilet', x + 2.5, 18.6, .6, .8, { rot: 180 });
  });
  // celas do meio (2 linhas x 3)
  [[8, 7], [12.6, 7], [17.2, 7], [8, 11.2], [12.6, 11.2], [17.2, 11.2]].forEach(p => { room(p[0], p[1], 4, 3.4, 'metal', '#262a2d', { r: p[0] > 16 ? [[1, 2.4]] : null, l: p[0] < 9 ? [[1, 2.4]] : null, b: p[0] >= 9 && p[0] < 16 ? [[1.4, 2.6]] : null }); el('bed_cell', p[0] + .5, p[1] + .8, 1, 2); el('toilet', p[0] + 2.8, p[1] + .5, .6, .8); });
  // alcova ritual esquerda
  room(.5, 5.5, 4.5, 4.5, 'stonefloor', '#1a1608', { r: [[1.3, 3.1]] }); el('ritual', 1.1, 5.9, 3.4, 3.4, { color: '#d1a52a' });
  // sala de repouso / cela lateral
  room(1.5, 11.3, 3.2, 3.6, 'metal', '#262a2d', { r: [[1.2, 2.4]] }); el('bed_cell', 2, 11.7, .9, 1.9);
  // salas superiores direita
  room(30, 1, 7.6, 8.5, 'tiles', '#8fb4c0', { b: [[2.4, 3.6]] }); el('labbench', 30.5, 2, 1, 4.5, { rot: 0, w: .9 * g, h: 4.5 * g }); el('labbench', 33.2, 3, .9, 4.2); el('sink', 30.4, 1.3, .8, .6); el('chair', 35.2, 7, .6, .6); el('desk', 34.4, 1.4, 2.4, 1);
  room(37.6, 1, 10.6, 8.5, 'carpet', '#2c1650', { b: [[4.2, 5.8]] }); el('console', 38.4, 1.6, 8.8, 1.3, { color: '#6a37b0' }); el('console', 38.4, 6.8, 4, 1.3, { color: '#6a37b0' }); el('console', 43.2, 6.8, 4, 1.3, { color: '#6a37b0' });
  [[40, 3.6], [42.3, 4.2], [44.6, 3.6], [41.2, 5.3], [43.6, 5.3]].forEach(p => el('chair', p[0], p[1], .7, .7, { color: '#3a2a55' }));
  room(48.2, 1, 8.4, 8.5, 'wood', '#9b5b2a', { b: [[3, 4.2]] }); el('carpet', 49, 2.4, 6.8, 4.4, { color: '#7a2a1a' }); el('table', 50.2, 3.6, 4.4, 1.3, { color: '#3b2314' }); [[50.6, 2.8], [52, 2.8], [53.4, 2.8], [50.6, 5.1], [52, 5.1], [53.4, 5.1]].forEach((p, i) => el('chair', p[0], p[1], .7, .7, { rot: i < 3 ? 180 : 0 })); el('shelf', 48.6, 1.2, 4, .6); el('sofa', 54.6, 6.5, 1.8, .9);
  room(56.6, 1, 6.6, 8.5, 'stonefloor', '#1b3a31', { b: [[2.2, 3.4]] }); el('ritual', 57.2, 1.6, 4.6, 4.6); el('altar', 57.6, 6.8, 2.2, 1.2); el('blood', 59.8, 6.4, 2, 2); el('shelf', 61, 1.2, 2, .6, { rot: 90 }); el('candles', 60.8, 7.4, .6, .6);
  // corredor superior
  el('concrete', 24, 9.5, 39.4, 2.5, { color: '#3b413f' });
  // grande salão
  room(30, 12.2, 33, 14.6, 'concrete', '#4f5754', { t: [[1, 2.2], [8, 9.5], [17, 18.4]], l: [[4, 6]] });
  [[35, 15], [40.3, 15.3], [45.6, 15], ].forEach(p => { el('table', p[0], p[1], 1.2, 5.2, { rot: 0, color: '#101214', w: 1.2 * g, h: 5.2 * g }); for (let i = 0; i < 4; i++) { el('chair', p[0] - .8, p[1] + .5 + i * 1.3, .6, .6, { rot: 90 }); el('chair', p[0] + 1.4, p[1] + .5 + i * 1.3, .6, .6, { rot: 270 }); } });
  el('table_round', 55.3, 14.5, 2.4, 2.4, { color: '#6a4325' }); [0, 1, 2, 3, 4].forEach(i => { const a = i / 5 * 6.28; el('chair', 56.5 + Math.cos(a) * 1.9 - .35, 15.7 + Math.sin(a) * 1.9 - .35, .7, .7, { rot: a * 57.3 + 90 }); });
  el('table', 57.2, 20, 1.2, 3.2, { color: '#4a2f1a', w: 1.2 * g, h: 3.2 * g }); el('sofa', 60.4, 19.8, 1, 2.3, { rot: 90 }); el('chair', 55.8, 21, .7, .7, { color: '#b32028' });
  el('stairs', 24.4, 20, 2.4, 1.4, { rot: 90 }); el('column', 33, 24.2, .8, .8); el('column', 49, 24.2, .8, .8);
  // ala médica
  room(30, 27, 20, 11, 'tiles', '#d4d6c8', { t: [[16, 18]] });
  [31.2, 35.6, 40].forEach(x => el('bed_hosp', x, 28, 1.2, 2.3)); [31.2, 35.6, 40].forEach(x => el('bed_hosp', x, 33.2, 1.2, 2.3, { rot: 180 }));
  el('counter', 43.4, 30.6, 6, .9, { color: '#d7dad2' }); el('locker', 48.6, 28, .8, .8, { color: '#6c7a84' }); el('sink', 48.4, 35.8, .8, .6);
  // lounge / bar
  room(10, 24, 18, 13.6, 'wood', '#5a3a22', { r: [[9, 11.2]], b: [[4, 6]] }); el('counter', 10.4, 24.4, 17.2, .9, { color: '#8a1218' });
  [[12.5, 28], [16.5, 29.8], [12, 32.6], [17, 33.4]].forEach((p, i) => { el('table', p[0], p[1], 1.4, 1.4, { color: '#c8a21d', rot: i * 12 }); el('chair', p[0] - .7, p[1] + .4, .6, .6, { color: '#d6b02a' }); el('chair', p[0] + 1.5, p[1] + .5, .6, .6, { color: '#d6b02a', rot: 180 }); });
  el('pool', 20.6, 29, 3.2, 1.7, { rot: 90, w: 3.2 * g, h: 1.7 * g }); el('barrel', 26.4, 25.2, .8, .8); el('crate', 26.4, 35.4, 1, 1);
  // arsenal
  room(50.6, 27, 12.4, 10.8, 'metal', '#171a1d', { t: [[1, 2.4]] }); el('table', 53, 31, 8.4, 1.5, { color: '#11201a' }); el('locker', 51.2, 28, .8, .8, { color: '#3e4a52' }); el('locker', 52.2, 28, .8, .8, { color: '#3e4a52' }); el('crate', 61, 28, 1, 1, { color: '#3d4a2e' });
  // luzes
  const lt = (kind, x, y, o) => { const l = fn.addLight(x, y); Object.assign(l, lightDefaults(kind, g), o || {}); return l; };
  [[33, 5], [43, 5], [52, 5], [60, 5], [12, 10], [20, 10], [20, 6], [45, 19], [58, 18], [40, 32], [20, 30], [57, 32], [3, 8]].forEach((p, i) => lt('ceiling', X(p[0]), Y(p[1]), { r: (i % 3 ? 5 : 6.5) * g }));
  lt('led', X(59.8), Y(4), { color: '#ff3030', r: 4.5 * g, flicker: true, intensity: .9, spread: 140, dir: 180 });
  lt('torch', X(2.8), Y(8), { r: 3.5 * g });
  // exemplo: zona de escada + criatura oculta
  const zt = fn.addZone(X(24.4), Y(20), 1.4 * g, 2.4 * g); zt.name = 'Subsolo (escada)'; zt.verb = 'Descer'; zt.targetX = X(22), zt.targetY = Y(30); zt.targetArea = area.id;
  const n = fn.addCreature(X(59.8), Y(4.6)); n.name = 'Manifestação'; n.hidden = true;
  return area;
}

function tplIsland(C, ox, oy, fn) {
  const g = C.grid, T = tplHelpers(C, ox, oy, fn), { el, X, Y } = T, R = rng(20261014);
  const area = fn.addAreaObj(ox, oy, 66 * g, 46 * g, { name: 'Ilha — vila', color: '#0c1d10', darkness: .38, ambient: '#04101c' });
  const cx = 33, cy = 23, rx = 17, ry = 11.4;
  el('grass', 0, 0, 66, 46, { color: '#1e3f22' });
  // trechos livres (estradas, campos e construções) onde não nascem árvores
  const roads = [[0, 16, 16, 18.5], [16, 18.5, 18, 21], [49, 24, 66, 30], [33, 34.4, 29, 46], [33, 11.6, 27, 0], [21, 29, 12, 37], [44, 14, 58, 6]];
  const holes = [[5.5, 2.5, 14, 12.5], [19.5, 0, 24.5, 7.5], [11.5, 5.5, 17.5, 9.5], [10.5, 29.5, 27.5, 37], [46, 18.5, 61, 30.5], [39.5, 6.5, 46.5, 11.8], [4.5, 22.5, 10.5, 27.5], [23, 27.5, 28.5, 32.5], [15, 27, 20, 31]];
  const blocked = (x, y, m) => roads.some(r => segDist(x, y, r[0], r[1], r[2], r[3]) < 2.6 + m) || holes.some(r => x > r[0] - m && x < r[2] + m && y > r[1] - m && y < r[3] + m);
  // floresta densa fora da vila
  let tries = 0, trees = 0;
  while (trees < 520 && tries < 6000) {
    tries++; const x = R() * 66, y = R() * 46, nx = (x - cx) / (rx + 5), ny = (y - cy) / (ry + 4.5);
    if (nx * nx + ny * ny < 1.0 || blocked(x, y, 1.2)) continue; const s = 2.4 + R() * 2.2, kind = R() < .72 ? 'tree' : 'pine';
    const base = kind === 'tree' ? ['#2c6430', '#35703a', '#27582c', '#4a7a2e', '#3a6a3a'][(R() * 5) | 0] : ['#1c4632', '#17402e', '#22503a'][(R() * 3) | 0];
    el(kind, x - s / 2, y - s / 2, s, s, { color: base, rot: R() * 360 }); trees++;
  }
  // estrada em anel + saídas
  const N = 22;
  for (let i = 0; i < N; i++) {
    const a0 = i / N * 6.2832, a1 = (i + 1) / N * 6.2832, x0 = cx + Math.cos(a0) * rx, y0 = cy + Math.sin(a0) * ry, x1 = cx + Math.cos(a1) * rx, y1 = cy + Math.sin(a1) * ry;
    const len = Math.hypot(x1 - x0, y1 - y0) + 1.4, ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
    el('trail', (x0 + x1) / 2 - len / 2, (y0 + y1) / 2 - 1.15, len, 2.3, { rot: ang, color: '#7d5b34' });
  }
  const road = (x0, y0, x1, y1, w) => { const len = Math.hypot(x1 - x0, y1 - y0) + 1, ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI; el('trail', (x0 + x1) / 2 - len / 2, (y0 + y1) / 2 - w / 2, len, w, { rot: ang, color: '#7d5b34' }); };
  roads.forEach((r, i) => road(r[0], r[1], r[2], r[3], i === 1 ? 2 : 2.3));
  // casas ao redor da vila
  for (let i = 0; i < 34; i++) {
    const a = i / 34 * 6.2832 + R() * .05, inner = i % 3 === 0, rr = inner ? .8 : 1.17, hx = cx + Math.cos(a) * rx * rr, hy = cy + Math.sin(a) * ry * rr;
    if (Math.cos(a) > .93 && Math.abs(Math.sin(a)) < .2) continue;
    const s = 1.8 + R() * .5; el('house_s', hx - s / 2, hy - s / 2, s, s, { rot: [0, 90, 0, 90, 180][(R() * 5) | 0], color: ['#b8321f', '#a82e1c', '#c23b24', '#b0301e'][(R() * 4) | 0] });
  }
  // construções maiores
  const big = el('house_l', 41, 8, 3.8, 2.8, { color: '#c1622a' });
  el('barn', 21, 1.2, 1.8, 5.2, { color: '#cb5c1c' }); el('house_l', 13, 6.4, 3.2, 2.4, { color: '#a83a22', rot: 0 }); el('field', 7, 4.2, 5.4, 3.6, { color: '#4a9a2a' }); el('field', 7, 8.2, 5.4, 3, { color: '#7aa02a' });
  el('stumps', 12, 31, 6, 4.4, { color: '#6b4a2c' }); el('stumps', 20, 33, 6, 4.4, { color: '#6b4a2c' });
  el('manor', 49, 24.6, 3.6, 4.8, { color: '#262a36' }); el('tower', 57.5, 20.2, 2.4, 2.4, { color: '#d8d1bf' }); el('house_s', 16.4, 14.5, 1.8, 1.8, { color: '#b8321f' });
  el('cave', 3, 3, 4.2, 4.2, { color: '#4f5a45' }); el('well', 31.6, 33.4, 1, 1); el('tent', 24.2, 29.5, 1.8, 2.2, { color: '#8a7a50' }); el('tent', 26.6, 30.2, 1.8, 2.2, { color: '#6a7a5a' }); el('campfire', 25.5, 28.5, 1, 1);
  el('arch', 17, 28.4, 3, .7, { rot: 35 }); el('arch', 61.5, 29.2, 3, .7, { rot: 80 }); el('tomb', 7.5, 24.5, .8, 1); el('tomb', 8.7, 25, .8, 1); el('tomb', 6.3, 25.2, .8, 1);
  for (let i = 0; i < 5; i++) el('fence', 6 + i * 3, 12.4, 3, .3); for (let i = 0; i < 3; i++) el('fence', 6, 3 + i * 3, 3, .3, { rot: 90 });
  // névoa central
  [[0, 0, 11], [-3, 1.6, 8], [2.6, -2, 8.5], [1, 3, 7]].forEach((p, i) => el('cloud', cx + p[0] - p[2] / 2, cy + p[1] - p[2] / 2, p[2], p[2], { color: '#e6eaee', alpha: .88 }));
  const fogZone = fn.addFog(X(cx - 7), Y(cy - 6), 14 * g, 12 * g); fogZone.shape = 'ellipse'; fogZone.opacity = .93; fogZone.soft = 40; fogZone.on = false;
  // luzes (janelas, fogueira, vaga-lumes)
  const lt = (kind, x, y, o) => { const l = fn.addLight(x, y); Object.assign(l, lightDefaults(kind, g), o || {}); return l; };
  lt('natural', X(25.5), Y(28.5), { r: 5 * g, color: '#ff9a3a', flicker: true, intensity: .95 });
  [[44, 10], [14.5, 8], [51, 27]].forEach(p => lt('torch', X(p[0]), Y(p[1]), { r: 3.8 * g }));
  [[20, 4], [34, 12], [47, 18], [20, 22], [43, 30], [30, 33]].forEach(p => lt('natural', X(p[0]), Y(p[1]), { r: 3.5 * g, color: '#ffcf7a', intensity: .8, flicker: false }));
  lt('natural', X(cx), Y(cy), { color: '#9ad8ff', r: 9 * g, intensity: .55, flicker: true });
  [[12, 12], [54, 12], [8, 36], [58, 38], [30, 4]].forEach(p => lt('natural', X(p[0]), Y(p[1]), { color: '#d8ffb0', r: 2.5 * g, intensity: .5, flicker: true }));
  // interior da casa grande (anexo ligado por zonas Entrar/Sair)
  const ax = ox + 66 * g + 6 * g, A = fn.addAreaObj(ax, oy, 18 * g, 13 * g, { name: 'Interior — Casa do prefeito', color: '#120d09', darkness: .55, ambient: '#05060a' });
  const ex = (kind, cx2, cy2, w, h, o) => { const d = CATALOG[kind]; return fn.addEl(kind, ax + cx2 * g, oy + cy2 * g, (w == null ? d.cw : w) * g, (h == null ? d.ch : h) * g, o || {}); };
  ex('wood', 0, 0, 18, 13, { color: '#7a4a28' }); ex('carpet', 4, 4, 9, 6, { color: '#5a1f18' }); ex('table', 6.4, 5.6, 4.2, 1.6, { color: '#3a2415' }); [[6.8, 4.9], [8.4, 4.9], [10, 4.9], [6.8, 7.3], [8.4, 7.3], [10, 7.3]].forEach((p, i) => ex('chair', p[0], p[1], .7, .7, { rot: i < 3 ? 180 : 0 }));
  ex('bed_dbl', .8, .8, 2, 2.2, { color: '#6a2b2b' }); ex('shelf', 14, .5, 3.4, .6); ex('shelf', .6, 10.8, 3, .6); ex('sofa', 13.8, 9.8, 3.2, 1.1, { color: '#3a4a5e' }); ex('candles', 12.5, 1.2, .6, .6); ex('barrel', 16.6, 6.4, .8, .8); ex('stairs', 3.6, 10.4, 1.5, 2.4, { rot: 90 });
  [[0, 0, 18, 0], [18, 0, 18, 13], [18, 13, 0, 13], [0, 13, 0, 0]].forEach(q => { const w = fn.addWall(ax + q[0] * g, oy + q[1] * g, ax + q[2] * g, oy + q[3] * g); w.thick = 12; });
  ex('door', 8.5, 12.7, 1.4, .35);
  const il = lt('lamp', ax + 12.8 * g, oy + 1.5 * g, { r: 6 * g, intensity: .95 }); const il2 = lt('ceiling', ax + 8.5 * g, oy + 6 * g, { r: 5 * g, color: '#ffd9a0', intensity: .75 });
  const zin = fn.addZone(X(41.4), Y(10.8), 3 * g, 1 * g); zin.name = 'Casa do prefeito'; zin.verb = 'Entrar'; zin.targetX = ax + 9.2 * g + g / 2 - g / 2 + 0, zin.targetY = oy + 11.2 * g + g / 2; zin.targetArea = A.id; zin.targetX = Math.floor((ax + 9 * g) / g) * g + g / 2; zin.targetY = Math.floor((oy + 11 * g) / g) * g + g / 2;
  const zout = fn.addZone(ax + 7.5 * g, oy + 11.6 * g, 3 * g, 1.4 * g); zout.name = 'Vila'; zout.verb = 'Sair'; zout.targetX = Math.floor(X(42.8) / g) * g + g / 2; zout.targetY = Math.floor(Y(11.9) / g) * g + g / 2; zout.targetArea = area.id;
  const lamp = fn.addZone(ax + 12 * g, oy + 0.6 * g, 1.5 * g, 1.5 * g); lamp.action = 'light'; lamp.name = 'Lampião'; lamp.lightIds = [il.id]; lamp.verb = '';
  const cr = fn.addCreature(X(cx), Y(cy - 1)); cr.name = 'Sombra na névoa'; cr.hidden = true;
  return area;
}
