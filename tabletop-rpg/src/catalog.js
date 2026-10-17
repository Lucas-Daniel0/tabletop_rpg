'use strict';
/* ===== catalog.js — elementos pré-definidos (pixel art procedural) =====
   Referências de estilo: mapas de mesa de Ordem Paranormal (base sombria, laboratório, ilha com vila),
   Moonlighter (cores quentes, contorno, sombras), Enigma do Medo (horror em pixel art, tons frios e sujos).
   Cada elemento: pdraw(P, W, H, o) desenha em pixels de arte (1 célula = PX px).
   o = { color, r (rampa da cor), R (aleatório com semente), time, frame } */

const CATALOG = {};
const CATS = [['floor', 'Pisos'], ['struct', 'Estruturas'], ['furn', 'Mobília'], ['lab', 'Lab / Ritual'], ['nature', 'Natureza'], ['build', 'Construções']];
function defEl(id, cat, name, cw, ch, layer, color, pdraw, extra) {
  CATALOG[id] = Object.assign({ id, cat, name, cw, ch, layer, color, pdraw, pad: layer === 0 ? 0 : 2, clip: layer === 0 }, extra || {});
}
const BONE = RP('#e9e4d2'), IRON = RP('#59606a'), GOLD = RP('#d9a933'), WOODR = RP('#8a5a32');
const hash2 = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + (s | 0) * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

/* ---------------- PISOS ---------------- */
defEl('concrete', 'floor', 'Concreto', 4, 4, 0, '#686e72', (P, W, H, o) => {
  const r = o.r, R = P.R, S = 32; P.f(0, 0, W, H, r.m);
  for (let y = 0; y < H; y += S) for (let x = 0; x < W; x += S) {
    const t = R(); P.f(x, y, S, S, t < .25 ? r.d1 : t < .82 ? r.m : r.l1);
    P.dith(x, y, S, S, r.d1, .03 + R() * .05); P.hl(x, y, S, r.d3); P.vl(x, y, S, r.d3); P.hl(x + 1, y + 1, S - 1, r.l1); P.vl(x + 1, y + 1, S - 1, r.l1);
  }
  P.noise(0, 0, W, H, [r.d1, r.d2, r.l1], .05);
  for (let i = 0; i < W * H / 1400; i++) P.dithE(R() * W, R() * H, 4 + R() * 9, 3 + R() * 6, r.d2, .3);
  for (let i = 0; i < W * H / 1800; i++) crack(P, R() * W, R() * H, 6 + R() * 20, r.d3);
  for (let i = 0; i < W * H / 2400; i++) { const x = R() * W, y = R() * H; P.f(x, y, 2, 1, r.d3); P.p(x, y + 1, r.l1); }
});
defEl('tiles', 'floor', 'Azulejo (hospital)', 4, 4, 0, '#c4c8be', (P, W, H, o) => {
  const r = o.r, R = P.R; P.f(0, 0, W, H, r.d2);
  for (let y = 0; y < H; y += 8) for (let x = 0; x < W; x += 8) {
    const k = R(), tone = k < .15 ? r.d1 : k < .65 ? r.m : k < .93 ? r.l1 : r.l2;
    P.f(x + 1, y + 1, 7, 7, tone); P.hl(x + 1, y + 1, 7, r.l3); P.vl(x + 1, y + 1, 7, r.l2); P.hl(x + 1, y + 7, 7, r.d1); P.vl(x + 7, y + 1, 7, r.d1);
    if (R() < .12) P.dith(x + 1, y + 1, 7, 7, r.d1, .3);
  }
  P.noise(0, 0, W, H, [r.d1, r.d2], .018);
  for (let i = 0; i < W * H / 2600; i++) { const x = R() * W, y = R() * H; crack(P, x, y, 5 + R() * 8, r.d3); }
  for (let i = 0; i < W * H / 3000; i++) P.dithE(R() * W, R() * H, 3 + R() * 4, 2 + R() * 3, '#6f5a3a', .25);
});
defEl('wood', 'floor', 'Piso de madeira', 4, 4, 0, '#94602f', (P, W, H, o) => {
  const r = o.r, R = P.R, ph = 5; P.f(0, 0, W, H, r.d3);
  for (let y = 0; y < H; y += ph) {
    let x = -Math.floor(R() * 34);
    while (x < W) {
      const len = 22 + Math.floor(R() * 40), k = R(), tone = k < .25 ? r.d1 : k < .65 ? r.m : r.l1, x0 = Math.max(0, x), x1 = Math.min(W, x + len - 1);
      if (x1 > x0) {
        P.f(x0, y, x1 - x0, ph - 1, tone); P.hl(x0, y, x1 - x0, tone === r.l1 ? r.l2 : r.l1); P.hl(x0, y + ph - 2, x1 - x0, r.d1);
        for (let g = 0; g < (x1 - x0) / 7; g++) P.hl(x0 + R() * Math.max(1, x1 - x0 - 4), y + 1 + R() * (ph - 3), 2 + R() * 4, r.d1);
        if (x1 - x0 > 8) { P.p(x0 + 2, y + 2, r.d3); P.p(x1 - 3, y + 2, r.d3); }
      }
      x += len;
    }
  }
  P.noise(0, 0, W, H, [r.d2], .01);
});
defEl('stonefloor', 'floor', 'Pedra / lajes', 4, 4, 0, '#6d7074', (P, W, H, o) => {
  const r = o.r, R = P.R; P.f(0, 0, W, H, r.d3);
  for (let y = 0, row = 0; y < H; y += 11, row++) {
    let x = -Math.floor(R() * 14);
    while (x < W) {
      const w = 13 + Math.floor(R() * 10), k = R(), tone = k < .25 ? r.d1 : k < .7 ? r.m : r.l1;
      P.rr(x + 1, y + 1, w - 1, 10, tone, 2); P.hl(x + 3, y + 1, w - 5, r.l2); P.vl(x + 1, y + 3, 6, r.l1); P.hl(x + 3, y + 10, w - 5, r.d2); P.vl(x + w - 1, y + 3, 6, r.d2);
      P.dith(x + 2, y + 3, w - 3, 6, r.d1, .12);
      if (R() < .1) { P.p(x + 3 + R() * (w - 6), y + 3 + R() * 5, '#4c7a3a'); P.p(x + 4 + R() * (w - 6), y + 4 + R() * 4, '#6fa04c'); }
      if (R() < .08) crack(P, x + 3 + R() * (w - 6), y + 2, 6, r.d3);
      x += w;
    }
  }
});
defEl('metal', 'floor', 'Grade metálica', 4, 4, 0, '#3b4148', (P, W, H, o) => {
  const r = o.r, R = P.R; P.f(0, 0, W, H, r.d3);
  for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) {
    P.f(x + 1, y + 1, 15, 15, r.m); P.hl(x + 1, y + 1, 15, r.l1); P.vl(x + 1, y + 1, 15, r.l1); P.hl(x + 1, y + 15, 15, r.d2); P.vl(x + 15, y + 1, 15, r.d2);
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { const ox = x + 3 + i * 4 + (j % 2) * 2, oy = y + 3 + j * 4; P.f(ox, oy, 3, 1, r.l1); P.f(ox, oy + 1, 3, 1, r.d1); }
    P.p(x + 2, y + 2, r.d3); P.p(x + 14, y + 2, r.d3); P.p(x + 2, y + 14, r.d3); P.p(x + 14, y + 14, r.d3); P.p(x + 1, y + 1, r.l3);
    if (R() < .15) P.dith(x + 1, y + 1, 15, 15, '#5a2d1b', .18);
  }
});
defEl('carpet', 'floor', 'Tapete ornamentado', 4, 3, 0, '#7a2a22', (P, W, H, o) => {
  const r = o.r, R = P.R; P.f(0, 0, W, H, OUTC);
  P.f(1, 1, W - 2, H - 2, r.d2); P.f(3, 3, W - 6, H - 6, GOLD.d1); P.f(4, 4, W - 8, H - 8, r.d1); P.f(6, 6, W - 12, H - 12, GOLD.m); P.f(7, 7, W - 14, H - 14, r.m);
  for (let x = 8; x < W - 8; x += 3) { P.p(x, 5, GOLD.l2); P.p(x, H - 6, GOLD.l2); } for (let y = 8; y < H - 8; y += 3) { P.p(5, y, GOLD.l2); P.p(W - 6, y, GOLD.l2); }
  const cx = W / 2, cy = H / 2, rx = (W - 20) / 2, ry = (H - 20) / 2;
  for (let k = 0; k < 4; k++) { const f = 1 - k * .22; P.poly([[cx, cy - ry * f], [cx + rx * f, cy], [cx, cy + ry * f], [cx - rx * f, cy]], k % 2 ? r.m : (k === 0 ? GOLD.m : r.d1)); }
  P.poly([[cx, cy - 5], [cx + 7, cy], [cx, cy + 5], [cx - 7, cy]], GOLD.l1); P.poly([[cx, cy - 2], [cx + 3, cy], [cx, cy + 2], [cx - 3, cy]], r.d2);
  for (const [qx, qy] of [[11, 11], [W - 12, 11], [11, H - 12], [W - 12, H - 12]]) { P.ell(qx, qy, 3, 3, GOLD.m); P.ell(qx, qy, 1, 1, r.d2); }
  P.dith(7, 7, W - 14, H - 14, r.d2, .1); P.noise(1, 1, W - 2, H - 2, [r.l1, r.d3], .012);
  for (let x = 1; x < W - 1; x += 2) { P.p(x, 0, GOLD.l1); P.p(x, H - 1, GOLD.l1); }
}, { clip: false });
defEl('marble', 'floor', 'Mármore (mansão)', 4, 4, 0, '#cfcabd', (P, W, H, o) => {
  const r = o.r, R = P.R;
  for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) {
    const dark = ((x + y) / 16) % 2 === 0, base = dark ? RP('#35323c') : r; P.f(x, y, 16, 16, dark ? base.m : r.m); P.hl(x, y, 16, dark ? base.l1 : r.l3); P.vl(x, y, 16, dark ? base.l1 : r.l2); P.hl(x, y + 15, 16, dark ? base.d3 : r.d1); P.vl(x + 15, y, 16, dark ? base.d3 : r.d1);
    P.dith(x + 1, y + 1, 14, 14, dark ? base.d1 : r.d1, .1); for (let v = 0; v < 2; v++) { let a = x + 2 + R() * 12, b = y + 1; for (let i = 0; i < 14; i++) { P.p(a, b, dark ? base.l2 : r.d1); b++; a += R() < .5 ? 0 : (R() < .5 ? -1 : 1); } }
  }
});
defEl('cobble', 'floor', 'Paralelepípedo', 4, 4, 0, '#8c8476', (P, W, H, o) => {
  const r = o.r, R = P.R; P.f(0, 0, W, H, r.d3);
  for (let y = 0, row = 0; y < H; y += 8, row++) { let x = (row % 2) * -5 - Math.floor(R() * 3); while (x < W) { const w = 9 + Math.floor(R() * 5), k = R(), tone = k < .25 ? r.d1 : k < .6 ? r.m : k < .88 ? r.l1 : r.l2;
    P.rr(x + 1, y + 1, w - 1, 7, tone, 2); P.hl(x + 2, y + 1, w - 3, tone === r.l2 ? r.l3 : r.l2); P.hl(x + 2, y + 7, w - 3, r.d1); P.vl(x + w - 1, y + 3, 3, r.d1); if (R() < .3) P.dith(x + 2, y + 3, w - 3, 3, r.d1, .3); x += w; } }
  P.noise(0, 0, W, H, [r.d2], .015);
});
defEl('grass', 'floor', 'Grama', 6, 6, 0, '#356b32', (P, W, H, o) => {
  const r = o.r, R = P.R; P.f(0, 0, W, H, r.m);
  for (let i = 0; i < W * H / 200; i++) P.dithE(R() * W, R() * H, 3 + R() * 9, 2 + R() * 6, R() < .55 ? r.d1 : r.l1, .22 + R() * .3);
  for (let i = 0; i < W * H / 52; i++) tuft(P, R() * W, 1 + R() * H, r);
  P.noise(0, 0, W, H, [r.d1, r.l1], .02);
  for (let i = 0; i < W * H / 900; i++) { const x = R() * W, y = R() * H, c = ['#f2ecc8', '#f0c84a', '#e58aa8', '#b7a6f2'][(R() * 4) | 0]; P.p(x, y, c); P.p(x, y + 1, r.d2); }
});
defEl('dirt', 'floor', 'Terra', 5, 5, 0, '#76512f', (P, W, H, o) => {
  const r = o.r, R = P.R; P.f(0, 0, W, H, r.m);
  for (let i = 0; i < W * H / 500; i++) P.dithE(R() * W, R() * H, 5 + R() * 12, 3 + R() * 8, R() < .5 ? r.d1 : r.l1, .55);
  P.noise(0, 0, W, H, [r.d2, r.l1, r.d1], .06);
  for (let i = 0; i < W * H / 420; i++) { const x = R() * W, y = R() * H; P.f(x, y, 2, 1, r.l2); P.hl(x, y + 1, 2, r.d3); }
  for (let i = 0; i < W * H / 1500; i++) { const x = R() * W, y = R() * H; P.hl(x, y, 3 + R() * 3, r.d2); }
});
defEl('trail', 'floor', 'Trilha de terra', 8, 2, 0, '#8a6538', (P, W, H, o) => {
  const r = o.r, R = P.R, ph = R() * 6.28, mid = H / 2, hw = H / 2 - 3;
  for (let x = 0; x < W; x++) {
    const wob = Math.sin(x / 11 + ph) * 2 + Math.sin(x / 4.7 + ph * 2) * .8, taper = Math.min(1, x / 7, (W - 1 - x) / 7), wd = Math.max(0, hw * (.82 + .18 * Math.sin(x / 9)) * taper), yc = mid + wob;
    for (let y = Math.floor(yc - wd - 2); y <= Math.ceil(yc + wd + 2); y++) {
      const d = Math.abs(y + .5 - yc) - wd; if (d > 1.5) continue; const n = R();
      if (d > 0) { if (n < .55) P.p(x, y, r.d2); else if (n < .8) P.p(x, y, r.d1); } else if (d > -1.5) P.p(x, y, n < .5 ? r.d1 : r.m);
      else P.p(x, y, n < .6 ? r.m : n < .85 ? r.l1 : r.d1);
    }
  }
  for (let i = 0; i < W * H / 40; i++) { const x = R() * W, y = mid + (R() - .5) * hw * 1.4; P.p(x, y, R() < .5 ? r.l2 : r.d2); }
  for (const dy of [-2.5, 2.5]) for (let x = 8; x < W - 8; x += 4) if (R() < .7) P.hl(x, mid + dy + Math.sin(x / 11 + ph) * 2, 3, r.d2);
}, { clip: false });
defEl('water', 'floor', 'Lago / água', 5, 4, 0, '#235a78', (P, W, H, o) => {
  const r = o.r, R = P.R, s1 = R() * 6, s2 = R() * 6, s3 = R() * 6, cx = W / 2, cy = H / 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = (x + .5 - cx) / (W / 2), dy = (y + .5 - cy) / (H / 2), a = Math.atan2(dy, dx), d = Math.hypot(dx, dy), thr = 1 - .035 + .05 * Math.sin(3 * a + s1) + .035 * Math.sin(5 * a + s2) + .025 * Math.sin(9 * a + s3);
    if (d > thr) continue; const e = (thr - d) * 14;
    if (e < 1.1) P.p(x, y, '#4a3a2a'); else if (e < 2.1) P.p(x, y, R() < .5 ? '#6b5538' : '#7a6444'); else if (e < 3.2) P.p(x, y, e > 2.6 && bay(x, y) < .5 ? r.l3 : r.l2);
    else { const depth = Math.min(1, (e - 3) / 12); P.p(x, y, depth < bay(x, y) * .9 ? r.l1 : depth > .65 + bay(x, y) * .3 ? r.d1 : r.m); }
  }
  for (let i = 0; i < W * H / 55; i++) { const x = 4 + R() * (W - 8), y = 4 + R() * (H - 8), dx = (x - cx) / (W / 2), dy = (y - cy) / (H / 2); if (dx * dx + dy * dy > .7) continue; P.hl(x, y, 2 + R() * 3, R() < .6 ? r.l2 : r.l3); if (R() < .5) P.hl(x + 1, y + 1, 2, r.d1); }
}, { clip: false });
defEl('blood', 'floor', 'Mancha de sangue', 2, 2, 1, '#7d0d12', (P, W, H, o) => {
  const r = o.r, R = P.R, cx = W / 2 + (R() - .5) * 3, cy = H / 2 + (R() - .5) * 3, n = 7 + (R() * 5 | 0);
  for (let i = 0; i < n; i++) { const a = R() * 6.28, d = R() * W * .22; P.ell(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 3 + R() * W * .13, 2.5 + R() * H * .1, r.d1); }
  for (let i = 0; i < n; i++) { const a = R() * 6.28, d = R() * W * .2; P.ell(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 2 + R() * W * .1, 1.6 + R() * H * .08, r.m); }
  for (let i = 0; i < 7; i++) { const a = R() * 6.28, L = W * (.3 + R() * .4); let x = cx, y = cy; for (let k = 0; k < L; k++) { x += Math.cos(a) * .9; y += Math.sin(a) * .9; if (k % 3 !== 2 || R() < .3) P.p(x, y, k < L * .6 ? r.d1 : r.d2); } P.ell(x, y, 1.2, 1.2, r.m); }
  for (let i = 0; i < 12; i++) { const a = R() * 6.28, d = W * (.3 + R() * .22); P.p(cx + Math.cos(a) * d, cy + Math.sin(a) * d, R() < .6 ? r.m : r.d1); }
  P.p(cx - 3, cy - 3, r.l2); P.p(cx - 2, cy - 3, r.l1); P.p(cx - 3, cy - 2, r.l1); P.dithE(cx, cy, W * .16, H * .16, r.d2, .3);
}, { pad: 0 });

/* ---------------- ESTRUTURAS ---------------- */
defEl('wallblock', 'struct', 'Bloco de parede', 2, .4, 1, '#3a3d46', (P, W, H, o) => {
  const r = o.r; P.shadowR(0, 1, W, H, 1, 2, .5); P.f(0, 0, W, H, OUTC); P.f(1, 1, W - 2, H - 2, r.d1);
  for (let y = 1, row = 0; y < H - 1; y += 3, row++) { P.hl(1, y + 2, W - 2, r.d3); for (let x = 1 + (row % 2) * 4; x < W - 1; x += 8) P.vl(x, y, 3, r.d3); }
  P.hl(1, 1, W - 2, r.l2); P.hl(1, 2, W - 2, r.l1); P.dith(1, 1, W - 2, H - 2, r.l1, .12); P.hl(1, H - 2, W - 2, r.d3);
});
defEl('door', 'struct', 'Porta de madeira', 1, .3, 1, '#8a5628', (P, W, H, o) => {
  const r = o.r; P.shadowR(0, 0, W, H, 1, 2, .5); P.f(0, 0, W, H, OUTC); P.f(1, 1, W - 2, H - 2, r.m);
  for (let x = 4; x < W - 1; x += 4) P.vl(x, 1, H - 2, r.d2); P.hl(1, 1, W - 2, r.l1); P.hl(1, H - 2, W - 2, r.d1); P.vl(1, 1, H - 2, r.l1);
  P.f(1, 1, 2, H - 2, r.d1); P.f(W - 3, 1, 2, H - 2, r.d1); P.f(W - 5, H / 2 - .5, 2, 1, GOLD.l2); P.p(W - 5, H / 2 - .5, GOLD.m);
});
defEl('door_metal', 'struct', 'Porta de segurança', 1, .3, 1, '#7a838c', (P, W, H, o) => {
  const r = o.r; P.shadowR(0, 0, W, H, 1, 2, .5); P.f(0, 0, W, H, OUTC); P.f(1, 1, W - 2, H - 2, r.m); P.hl(1, 1, W - 2, r.l2); P.hl(1, H - 2, W - 2, r.d2); P.vl(W / 2, 1, H - 2, r.d3);
  P.f(W / 2 - 2, 2, 1, 1, '#4cf0a0'); P.f(W / 2 + 1, 2, 1, 1, '#f04c4c'); P.f(2, 1, 3, 1, '#e6b82e'); P.f(W - 5, 1, 3, 1, '#e6b82e');
});
defEl('window', 'struct', 'Janela', 1, .2, 1, '#8cc6e4', (P, W, H, o) => {
  const r = o.r; P.shadowR(0, 0, W, H, 1, 1, .45); P.f(0, 0, W, H, OUTC); P.f(1, 0, W - 2, H, '#b9a27a'); P.f(2, 1, W - 4, H - 2, r.m); P.grad(2, 1, W - 4, H - 2, r.l1, r.d1, 'd'); P.f(W / 2, 0, 1, H, '#b9a27a'); P.p(3, 1, '#ffffff'); P.p(4, 1, r.l3);
});
defEl('stairs', 'struct', 'Escada', 1.2, 2.4, 1, '#8c5a32', (P, W, H, o) => {
  const r = o.r, R = P.R; P.shadowR(0, 0, W, H, 2, 2, .5); P.f(0, 0, W, H, OUTC);
  P.f(1, 1, W - 2, H - 2, r.d2);
  for (let y = 1, i = 0; y < H - 1; y += 4, i++) { const k = i / (H / 4); P.f(3, y, W - 6, 3, r.m); P.hl(3, y, W - 6, r.l2); P.hl(3, y + 2, W - 6, r.d1); P.hl(3, y + 3, W - 6, r.d3); P.dith(3, y, W - 6, 4, r.d3, k * .6); for (let g = 0; g < 2; g++) P.hl(3 + R() * (W - 9), y + 1, 3, r.d1); }
  P.f(1, 1, 2, H - 2, WOODR.m); P.vl(1, 1, H - 2, WOODR.l1); P.f(W - 3, 1, 2, H - 2, WOODR.d1); P.vl(W - 2, 1, H - 2, WOODR.d2); for (let y = 3; y < H - 3; y += 9) { P.f(0, y, 3, 2, WOODR.l2); P.f(W - 3, y, 3, 2, WOODR.m); }
});
defEl('column', 'struct', 'Pilar', .8, .8, 1, '#5a5f66', (P, W, H, o) => {
  const r = o.r; P.shadowE(W / 2, H / 2, W / 2, H / 2, 2, 2, .5); P.blob(W / 2, H / 2, W / 2 - 1, H / 2 - 1, r); P.ring(W / 2 - .5, H / 2 - .5, W / 2 - 3, H / 2 - 3, r.d1, 1);
});

/* ---------------- MOBÍLIA ---------------- */
function mattressBed(P, W, H, r, frameHex, pillowHex, blanketHex) {
  const fr = RP(frameHex), pl = RP(pillowHex), bl = RP(blanketHex || r.m);
  P.shadowR(1, 1, W - 1, H - 1, 1, 2, .45); P.f(0, 3, 1, 3, OUTC); P.f(W - 1, 3, 1, 3, OUTC); P.f(0, H - 7, 1, 3, OUTC); P.f(W - 1, H - 7, 1, 3, OUTC);
  P.box(1, 0, W - 2, H, fr, { cut: 2 }); P.rr(3, 2, W - 6, H - 4, r.d2, 1); P.rr(3, 2, W - 6, H - 5, r.m, 1); P.hl(4, 2, W - 8, r.l1);
  P.box(4, 3, W - 8, 6, pl, { cut: 1 }); P.hl(5, 5, W - 10, pl.d1);
  P.f(4, 12, W - 8, H - 17, bl.m); P.hl(4, 12, W - 8, bl.l2); P.hl(4, 13, W - 8, bl.l1); P.hl(4, 14, W - 8, bl.d1); P.f(4, H - 6, W - 8, 1, bl.d1); P.vl(4, 12, H - 17, bl.l1); P.vl(W - 5, 13, H - 17, bl.d1);
  for (let y = 18; y < H - 7; y += 5) P.dith(5, y, W - 10, 1, bl.d2, .7); P.dith(4, 12, W - 8, H - 17, bl.d2, .06);
}
defEl('bed_hosp', 'furn', 'Maca hospitalar', 1, 2, 1, '#8fc08a', (P, W, H, o) => mattressBed(P, W, H, o.r, '#aab2b8', '#f0f1ec', '#a9d4a4'));
defEl('bed_cell', 'furn', 'Cama de cela', 1, 2, 1, '#69733f', (P, W, H, o) => mattressBed(P, W, H, o.r, '#4b4f55', '#cfcbb4', '#7c8a50'));
defEl('bed_dbl', 'furn', 'Cama de casal', 2, 2.2, 1, '#8a3b44', (P, W, H, o) => {
  const r = o.r; P.shadowR(1, 1, W - 1, H - 1, 2, 2, .45); P.box(0, 0, W, H, WOODR, { cut: 2 }); P.f(2, 2, W - 4, 5, WOODR.d1); P.hl(2, 2, W - 4, WOODR.l1);
  P.rr(3, 6, W - 6, H - 9, '#e6e1d2', 1); P.box(4, 7, 12, 7, BONE, { cut: 2 }); P.box(W - 16, 7, 12, 7, BONE, { cut: 2 }); P.dith(6, 9, 8, 3, BONE.d1, .25); P.dith(W - 14, 9, 8, 3, BONE.d1, .25);
  P.f(3, 17, W - 6, H - 20, r.m); P.hl(3, 17, W - 6, r.l2); P.hl(3, 18, W - 6, r.l1); P.f(3, 19, W - 6, 3, r.l1); P.hl(3, 22, W - 6, r.d1); P.vl(3, 17, H - 20, r.l1); P.vl(W - 4, 18, H - 20, r.d1);
  for (let x = 6; x < W - 5; x += 6) P.vl(x, 23, H - 28, r.d1); P.dith(3, 24, W - 6, H - 27, r.d2, .12); P.hl(3, H - 4, W - 6, r.d2);
});
defEl('table', 'furn', 'Mesa de madeira', 2, 1, 1, '#6b4426', (P, W, H, o) => {
  const r = o.r, R = P.R; P.shadowR(1, 1, W - 1, H - 1, 1, 3, .5); P.box(0, 0, W, H - 1, r, { cut: 1 }); P.f(1, H - 3, W - 2, 2, r.d2);
  for (let x = 6; x < W - 4; x += 7) P.vl(x, 2, H - 6, r.d1); P.dith(2, 2, W - 4, H - 6, r.l1, .12);
  P.f(4, 3, 6, 5, '#e8e2cc'); P.hl(4, 3, 6, '#fff'); P.hl(5, 5, 4, '#a9a38c'); P.hl(5, 7, 3, '#a9a38c');
  P.ell(W - 8, 6, 2, 2, '#d8d8d4'); P.ell(W - 8, 6, 1, 1, '#4a2c1c'); P.f(W - 14, 4, 4, 3, RP('#8b2d2f').m); P.hl(W - 14, 4, 4, RP('#8b2d2f').l1);
});
defEl('table_round', 'furn', 'Mesa redonda', 2.2, 2.2, 1, '#7d4d2a', (P, W, H, o) => {
  const r = o.r, R = P.R, cx = W / 2, cy = H / 2; P.shadowE(cx, cy, W / 2, H / 2, 2, 3, .5); P.blob(cx, cy, W / 2 - 1, H / 2 - 1, r, { flat: true });
  P.ring(cx - 1, cy - 1, W / 2 - 4, H / 2 - 4, r.d1, 1); P.ring(cx - 1, cy - 1, W / 2 - 8, H / 2 - 8, r.l1, 1);
  P.f(cx - 8, cy - 5, 6, 5, '#e8e2cc'); P.hl(cx - 8, cy - 5, 6, '#fff'); P.f(cx + 2, cy + 1, 5, 6, '#e3dcc2'); P.hl(cx + 2, cy + 1, 5, '#fff'); P.ell(cx + 5, cy - 5, 2, 2, '#c9c6bd'); P.p(cx + 5, cy - 5, '#3b2418');
});
defEl('chair', 'furn', 'Cadeira', .6, .6, 1, '#963036', (P, W, H, o) => {
  const r = o.r; P.shadowR(1, 1, W - 1, H - 1, 1, 2, .5); P.box(0, 0, W, 3, WOODR, { cut: 1 }); P.box(1, 2, W - 2, H - 2, r, { cut: 2 }); P.dith(3, 5, W - 6, H - 8, r.l1, .25);
});
defEl('stool', 'furn', 'Banco / tamborete', .6, .6, 1, '#8a5a32', (P, W, H, o) => {
  const r = o.r; P.shadowE(W / 2, H / 2, W / 2 - 1, H / 2 - 1, 1, 2, .5); P.blob(W / 2, H / 2, W / 2 - 1, H / 2 - 1, r, { flat: true }); P.ring(W / 2 - .5, H / 2 - .5, W / 2 - 3, H / 2 - 3, r.d1, 1);
});
defEl('desk', 'furn', 'Mesa com computador', 2, 1, 1, '#4b505a', (P, W, H, o) => {
  const r = o.r; P.shadowR(1, 1, W - 1, H - 1, 1, 3, .5); P.box(0, 0, W, H - 1, r, { cut: 1 }); P.f(1, H - 3, W - 2, 2, r.d2);
  P.box(W / 2 - 7, 1, 14, 6, RP('#222831'), { cut: 1 }); P.f(W / 2 - 5, 2, 10, 4, '#30c8f0'); P.grad(W / 2 - 5, 2, 10, 4, '#30c8f0', '#d6faff', 'h', 0, .5); P.f(W / 2 - 4, 3, 5, 1, '#0e5a78');
  P.f(W / 2 - 5, 9, 10, 3, '#1c2026'); P.dith(W / 2 - 5, 9, 10, 3, '#59606a', .5); P.ell(W / 2 + 9, 10, 1.5, 1.5, '#1c2026'); P.f(3, 4, 5, 4, '#e8e2cc'); P.hl(3, 4, 5, '#fff'); P.p(5, 6, '#a9a38c'); P.glow(W / 2, 5, 11, '#30c8f0', .25);
}, { pad: 4 });
defEl('shelf', 'furn', 'Estante de livros', 2, .6, 1, '#4a3020', (P, W, H, o) => {
  const r = o.r, R = P.R; P.shadowR(0, 1, W, H, 1, 2, .5); P.box(0, 0, W, H, r, { cut: 0 }); const cols = ['#a83232', '#3a62a8', '#d3a43a', '#4a8a4a', '#7a4a9a', '#e3dccb', '#b8602a'];
  for (let x = 2; x < W - 2;) { const w = 1 + (R() * 2 | 0), c = RP(cols[R() * cols.length | 0]); P.f(x, 2, w, H - 4, c.m); P.p(x, 2, c.l2); P.p(x + w - 1, H - 3, c.d1); x += w; if (R() < .12) x += 2; }
  P.hl(1, H - 2, W - 2, r.d2);
});
defEl('bookcase', 'furn', 'Estante alta (vista de cima)', 1, 2, 1, '#4a3020', (P, W, H, o) => {
  const r = o.r, R = P.R; P.shadowR(0, 1, W, H, 2, 2, .5); P.box(0, 0, W, H, r, { cut: 1 }); P.f(2, 2, W - 4, H - 4, r.d2);
  const cols = ['#a83232', '#3a62a8', '#d3a43a', '#4a8a4a', '#7a4a9a', '#e3dccb'];
  for (let y = 3; y < H - 4; y += 6) { P.hl(2, y + 5, W - 4, r.l1); for (let x = 3; x < W - 3;) { const w = 1 + (R() * 2 | 0), c = RP(cols[R() * cols.length | 0]); P.f(x, y, w, 5, c.m); P.p(x, y, c.l2); x += w; } }
});
defEl('sofa', 'furn', 'Sofá', 2, 1, 1, '#5a4478', (P, W, H, o) => {
  const r = o.r; P.shadowR(1, 1, W - 1, H - 1, 1, 3, .5); P.box(0, 0, W, H - 1, r, { cut: 2 }); P.f(2, 2, W - 4, 4, r.d1); P.hl(2, 2, W - 4, r.l1);
  P.box(0, 3, 4, H - 4, r, { cut: 1 }); P.box(W - 4, 3, 4, H - 4, r, { cut: 1 });
  for (let i = 0; i < 3; i++) { const x = 5 + i * ((W - 10) / 3); P.box(x, 6, (W - 10) / 3 - 1, H - 9, r, { cut: 1 }); P.dith(x + 2, 8, (W - 10) / 3 - 5, 4, r.l2, .35); }
});
defEl('counter', 'furn', 'Balcão / bar', 4, .9, 1, '#6e2a22', (P, W, H, o) => {
  const r = o.r, R = P.R; P.shadowR(1, 1, W - 1, H - 1, 1, 3, .5); P.box(0, 0, W, H - 1, r, { cut: 1 }); P.f(1, H - 4, W - 2, 3, r.d2); P.hl(2, 2, W - 4, r.l2); P.dith(2, 3, W - 4, 5, r.l1, .12);
  const cols = ['#4cc07a', '#e0a33a', '#7aa8e8', '#c04c64', '#d8d8d0'];
  for (let x = 6; x < W - 6; x += 5 + (R() * 5 | 0)) { const c = RP(cols[R() * cols.length | 0]); P.f(x, 4, 2, 4, c.m); P.p(x, 4, c.l3); P.p(x, 3, c.d1); }
  for (let i = 0; i < 3; i++) { const x = 8 + i * 18; P.f(x, 3, 3, 2, '#c9c6bd'); P.p(x + 1, 2, '#9a978f'); } P.f(W - 12, 4, 6, 4, '#cfcfca'); P.hl(W - 12, 4, 6, '#fff');
});
defEl('pool', 'furn', 'Mesa de sinuca', 3, 1.6, 1, '#3f9a3a', (P, W, H, o) => {
  const r = o.r, R = P.R; P.shadowR(1, 1, W - 1, H - 1, 2, 3, .5); P.box(0, 0, W, H, WOODR, { cut: 2 }); P.f(3, 3, W - 6, H - 6, OUTC); P.f(4, 4, W - 8, H - 8, r.m); P.grad(4, 4, W - 8, H - 8, r.m, r.d1, 'd', 0, .7); P.hl(4, 4, W - 8, r.l1);
  for (const [x, y] of [[3, 3], [W / 2, 2], [W - 4, 3], [3, H - 4], [W / 2, H - 3], [W - 4, H - 4]]) P.ell(x + .5, y + .5, 2.2, 2.2, OUTC);
  const cols = ['#d8403a', '#e8d44a', '#3a62d8', '#f0f0f0', '#222', '#e08a3a']; let k = 0;
  for (let i = 0; i < 4; i++) for (let j = 0; j <= i; j++) { const x = W - 18 - i * 3, y = H / 2 - i * 1.5 + j * 3; P.ell(x, y, 1.4, 1.4, cols[k++ % cols.length]); }
  P.ell(14, H / 2, 1.4, 1.4, '#f4f4f0'); P.line(5, H / 2 + 5, 12, H / 2 + 1, '#d9b57a');
});
defEl('locker', 'furn', 'Armário metálico', .8, .8, 1, '#6f7a84', (P, W, H, o) => {
  const r = o.r; P.shadowR(1, 1, W - 1, H - 1, 1, 2, .5); P.box(0, 0, W, H, r, { cut: 1 }); P.f(W / 2, 1, 1, H - 2, r.d2); for (let y = 3; y < 7; y += 2) { P.hl(2, y, W / 2 - 3, r.d2); P.hl(W / 2 + 2, y, W / 2 - 3, r.d2); }
  P.f(W / 2 - 2, H / 2 + 1, 1, 3, r.d3); P.f(W / 2 + 2, H / 2 + 1, 1, 3, r.d3); P.dith(2, 2, W - 4, H - 4, r.l1, .1);
});
defEl('toilet', 'furn', 'Vaso sanitário', .6, .8, 1, '#e4e6e2', (P, W, H, o) => {
  const r = o.r; P.shadowR(1, 1, W - 1, H - 1, 1, 2, .5); P.box(0, 0, W, 4, r, { cut: 1 }); P.ell(W / 2, 8.5, W / 2 - .5, 5, OUTC); P.ell(W / 2, 8.5, W / 2 - 1.5, 4, r.m); P.ell(W / 2, 9, W / 2 - 3, 3, '#7fb4d4'); P.hl(3, 6, 2, r.l3); P.hl(2, 1, W - 4, r.l3); P.p(W / 2, 2, r.d2);
});
defEl('sink', 'furn', 'Pia', .8, .6, 1, '#d8dad6', (P, W, H, o) => {
  const r = o.r; P.shadowR(1, 1, W - 1, H - 1, 1, 2, .5); P.box(0, 0, W, H, r, { cut: 2 }); P.ell(W / 2, H / 2 + 1, W / 2 - 3, H / 2 - 3, r.d1); P.ell(W / 2, H / 2 + 1, W / 2 - 4, H / 2 - 4, '#8cbfdc'); P.hl(4, 3, W - 8, r.l3); P.f(W / 2 - 1, 1, 2, 2, '#9aa4ae'); P.p(W / 2, 1, '#fff');
});
defEl('crate', 'furn', 'Caixote', 1, 1, 1, '#9a6a36', (P, W, H, o) => {
  const r = o.r, R = P.R; P.shadowR(1, 1, W - 1, H - 1, 1, 2, .5); P.box(0, 0, W, H, r, { cut: 0 }); P.f(3, 3, W - 6, H - 6, r.d1); P.f(4, 4, W - 8, H - 8, r.m);
  P.line(3, 3, W - 4, H - 4, r.d2); P.line(W - 4, 3, 3, H - 4, r.d2); P.line(4, 3, W - 3, H - 4, r.l1); for (const [x, y] of [[1, 1], [W - 2, 1], [1, H - 2], [W - 2, H - 2]]) P.p(x, y, r.d3); P.dith(4, 4, W - 8, H - 8, r.d2, .08);
});
defEl('barrel', 'furn', 'Barril', .8, .8, 1, '#865a2b', (P, W, H, o) => {
  const r = o.r; P.shadowE(W / 2, H / 2, W / 2 - 1, H / 2 - 1, 1, 2, .5); P.blob(W / 2, H / 2, W / 2 - 1, H / 2 - 1, r, { flat: true }); P.ring(W / 2 - .5, H / 2 - .5, W / 2 - 2, H / 2 - 2, IRON.d1, 1); P.ring(W / 2 - .5, H / 2 - .5, W / 2 - 5, H / 2 - 5, r.d2, 1); P.ell(W / 2, H / 2, 2, 2, r.d3); P.p(W / 2 - 3, 3, r.l3);
});
defEl('chest', 'furn', 'Baú', 1, .8, 1, '#8a5a2c', (P, W, H, o) => {
  const r = o.r; P.shadowR(1, 1, W - 1, H - 1, 1, 2, .5); P.box(0, 0, W, H, r, { cut: 1 }); P.hl(1, H / 2, W - 2, r.d3); P.f(3, 1, 2, H - 2, IRON.m); P.f(W - 5, 1, 2, H - 2, IRON.m); P.vl(3, 1, H - 2, IRON.l1); P.vl(W - 5, 1, H - 2, IRON.l1);
  P.f(W / 2 - 1, H / 2 - 2, 3, 4, GOLD.m); P.p(W / 2, H / 2 - 1, OUTC); P.hl(2, 2, W - 4, r.l2);
});
defEl('cabinet', 'furn', 'Armário / cômoda', 1.2, .7, 1, '#7a5230', (P, W, H, o) => {
  const r = o.r; P.shadowR(1, 1, W - 1, H - 1, 1, 3, .5); P.box(0, 0, W, H - 1, r, { cut: 1 }); P.f(1, H - 4, W - 2, 3, r.d2); P.vl(W / 2, 2, H - 6, r.d2); P.f(W / 2 - 3, 4, 1, 3, GOLD.m); P.f(W / 2 + 2, 4, 1, 3, GOLD.m); P.f(3, 3, 4, 3, '#e8e2cc'); P.hl(3, 3, 4, '#fff'); P.ell(W - 5, 5, 2, 2, '#7fb4d4');
});

/* ---------------- LABORATÓRIO / RITUAL ---------------- */
defEl('labbench', 'lab', 'Bancada de laboratório', 4, .9, 1, '#2e98a4', (P, W, H, o) => {
  const r = o.r, R = P.R; P.shadowR(1, 1, W - 1, H - 1, 1, 3, .5); P.box(0, 0, W, H - 1, r, { cut: 1 }); P.f(1, H - 4, W - 2, 3, r.d2); P.hl(2, 2, W - 4, r.l2);
  const cols = ['#5ae88a', '#e86aa0', '#e8d45a', '#6ab0f0'];
  for (let x = 6; x < W - 26; x += 9) { const c = RP(cols[R() * cols.length | 0]); P.ell(x + 2, 6, 2.5, 2.5, '#cfe6ee'); P.ell(x + 2, 6, 1.6, 1.6, c.m); P.p(x + 1, 5, '#fff'); }
  P.box(W - 22, 2, 7, 8, RP('#2a2f36'), { cut: 1 }); P.f(W - 20, 3, 3, 2, '#7ad8f0'); P.ell(W - 9, 6, 3, 3, '#cfcfca'); P.ell(W - 9, 6, 2, 2, '#8a8a88');
  for (let k = 0; k < 4; k++) { P.f(W - 36 + k * 3, 3, 2, 6, '#dfe9ec'); P.f(W - 36 + k * 3, 6, 2, 3, cols[k]); }
});
defEl('altar', 'lab', 'Altar ritualístico', 2, 1.2, 1, '#3a3640', (P, W, H, o) => {
  const r = o.r, R = P.R; P.shadowR(1, 1, W - 1, H - 1, 2, 3, .55); P.box(0, 0, W, H, r, { cut: 2 }); P.f(3, 3, W - 6, H - 6, r.d2); P.f(4, 4, W - 8, H - 8, r.m); P.dith(4, 4, W - 8, H - 8, r.d1, .25);
  const cx = W / 2, cy = H / 2, red = RP('#d2202a'); P.ring(cx, cy, 6, 5, red.m, 1); P.line(cx - 8, cy, cx + 8, cy, red.l1); P.line(cx, cy - 6, cx, cy + 6, red.l1); P.ell(cx, cy, 1.2, 1.2, red.l3);
  for (const [x, y] of [[3, 3], [W - 4, 3], [3, H - 4], [W - 4, H - 4]]) { P.f(x - 1, y - 1, 3, 3, '#e8e0c8'); P.p(x, y - 2, '#ffd36a'); P.p(x, y - 3, '#ff9a2e'); P.glow(x, y - 2, 6, '#ffb04a', .45); } P.glow(cx, cy, 9, '#ff3040', .35);
}, { pad: 5 });
defEl('candles', 'lab', 'Velas', .6, .6, 1, '#efe5c8', (P, W, H, o) => {
  const f = o.frame | 0; P.glow(W / 2, H / 2, 8, '#ffb04a', .5);
  [[2, 5, 4], [6, 3, 5], [6, 7, 3]].forEach(([x, y, h], i) => { P.f(x, y, 2, 2, '#f0e8d0'); P.p(x, y, '#fff'); P.p(x + 1, y + 1, '#c9c0a4'); const fl = (f + i) % 3; P.p(x, y - 1, fl === 0 ? '#fff0a0' : '#ffd24a'); P.p(x + (fl === 1 ? 1 : 0), y - 2, '#ff9a2e'); });
}, { anim: true, pad: 6, frames: 3 });
defEl('ritual', 'lab', 'Círculo ritualístico', 4, 4, 0, '#c1202a', (P, W, H, o) => {
  const r = o.r, R = P.R, cx = W / 2, cy = H / 2, rad = Math.min(W, H) / 2 - 2, pts = [];
  P.glow(cx, cy, rad + 3, r.m, .4);
  P.ring(cx, cy, rad, rad, r.d1, 2); P.ring(cx, cy, rad - 2, rad - 2, r.m, 1); P.ring(cx, cy, rad - 7, rad - 7, r.m, 1); P.ring(cx, cy, rad - 8, rad - 8, r.d1, 1);
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; pts.push([cx + Math.cos(a) * (rad - 3), cy + Math.sin(a) * (rad - 3)]); }
  for (let i = 0; i < 5; i++) { const a = pts[i], b = pts[(i + 2) % 5]; P.line(a[0], a[1], b[0], b[1], r.d1); P.line(a[0] + 1, a[1], b[0] + 1, b[1], r.m); }
  for (let i = 0; i < 32; i++) { const a = i * Math.PI * 2 / 32, rr = rad - 4.5; if (i % 2) P.f(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 2, 1, r.l2); else P.p(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, r.l1); }
  for (const p of pts) { P.ell(p[0], p[1], 2, 2, r.d1); P.p(p[0], p[1], r.l3); } P.dith(0, 0, W, H, r.d2, .0); P.ell(cx, cy, 2, 2, r.l2);
  for (let i = 0; i < W * H / 120; i++) P.p(cx + (R() - .5) * W * .9, cy + (R() - .5) * H * .9, r.d2);
}, { clip: false, pad: 3 });
defEl('console', 'lab', 'Console holográfico', 4, 1.4, 1, '#5c3a98', (P, W, H, o) => {
  const r = o.r, R = P.R; P.shadowR(1, 1, W - 1, H - 1, 1, 3, .5); P.box(0, 0, W, H - 2, r, { cut: 2 }); P.f(3, 3, W - 6, 9, RP('#1c1730').m); P.f(4, 4, W - 8, 7, '#2a1f4a');
  for (let x = 6; x < W - 8; x += 5) { const h = 2 + (R() * 5 | 0); P.f(x, 11 - h, 3, h, ['#40e0f0', '#e060d8', '#f0d860'][R() * 3 | 0]); } P.hl(4, 4, W - 8, '#7a62b8');
  for (let x = 4; x < W - 5; x += 4) { P.f(x, 14, 3, 2, ['#40e0f0', '#e060d8', '#f0d860', '#60f090'][R() * 4 | 0]); } P.glow(W / 2, 8, 22, '#8a60f0', .3);
}, { pad: 6 });
defEl('tank', 'lab', 'Tanque de contenção', 1.4, 1.4, 1, '#3c9a6a', (P, W, H, o) => {
  const r = o.r, R = P.R, cx = W / 2, cy = H / 2; P.shadowE(cx, cy, W / 2, H / 2, 2, 3, .5); P.ell(cx, cy, W / 2, H / 2, OUTC); P.ell(cx, cy, W / 2 - 1, H / 2 - 1, IRON.m); P.ell(cx, cy, W / 2 - 3, H / 2 - 3, r.d2); P.ell(cx, cy, W / 2 - 4, H / 2 - 4, r.m);
  P.dithE(cx, cy + 3, W / 2 - 5, H / 2 - 5, r.d1, .5); P.ell(cx + 1, cy + 1, 5, 4, r.d3); P.ell(cx - 1, cy, 3, 2, r.d3); for (let i = 0; i < 6; i++) P.p(cx + (R() - .5) * W * .5, cy + (R() - .5) * H * .5, r.l3);
  P.hl(cx - 6, cy - 6, 4, '#ffffff'); P.p(cx - 7, cy - 5, '#ffffff'); P.glow(cx, cy, W * .9, r.l1, .3);
}, { pad: 6 });
defEl('bodybag', 'lab', 'Saco de cadáver', 1, 2, 1, '#454a52', (P, W, H, o) => {
  const r = o.r; P.shadowR(1, 1, W - 3, H - 2, 1, 2, .5); P.box(2, 0, W - 4, H, r, { cut: 3 }); P.vl(W / 2, 3, H - 6, r.d3); for (let y = 4; y < H - 4; y += 2) P.p(W / 2 + 1, y, r.l2); P.hl(4, 6, W - 8, r.d2); P.hl(4, H - 9, W - 8, r.d2); P.dith(3, 2, W - 6, H - 4, r.l1, .12);
});
defEl('cobweb', 'lab', 'Teia de aranha', 2, 2, 2, '#d8d8e0', (P, W, H, o) => {
  P.c.save(); P.c.globalAlpha = .65; const r = o.r; for (let i = 0; i <= 4; i++) { const a = i * Math.PI / 8; P.line(0, 0, Math.cos(a) * W, Math.sin(a) * H, r.m); }
  for (let k = 1; k <= 5; k++) { const rr = k * W / 5.5; let px = rr, py = 0; for (let i = 1; i <= 4; i++) { const a = i * Math.PI / 8, nx = Math.cos(a) * rr * .93, ny = Math.sin(a) * rr * .93; P.line(px, py, nx, ny, r.l1); px = nx; py = ny; } } P.c.restore();
}, { pad: 0 });

/* ---------------- NATUREZA ---------------- */
function leafCluster(P, cx, cy, rx, ry, r, R, n) {
  const blobs = []; for (let i = 0; i < n; i++) { const a = R() * 6.28, d = R() * .55; blobs.push([cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, rx * (.34 + R() * .2), ry * (.34 + R() * .2)]); }
  blobs.sort((a, b) => a[1] - b[1]);
  for (const b of blobs) P.ell(b[0], b[1], b[2] + 1, b[3] + 1, r.d3);
  for (const b of blobs) { P.ell(b[0], b[1], b[2], b[3], r.d1); P.ell(b[0] - b[2] * .08, b[1] - b[3] * .15, b[2] * .84, b[3] * .8, r.m); P.ell(b[0] - b[2] * .25, b[1] - b[3] * .35, b[2] * .5, b[3] * .4, r.l1); P.dithE(b[0] - b[2] * .3, b[1] - b[3] * .4, b[2] * .28, b[3] * .22, r.l2, .8); }
}
defEl('tree', 'nature', 'Árvore', 2.4, 2.4, 1, '#38783a', (P, W, H, o) => {
  const r = o.r, R = P.R; P.shadowE(W / 2 + 2, H / 2 + 3, W / 2 - 1, H / 2 - 2, 0, 0, .45); leafCluster(P, W / 2, H / 2, W / 2 + 1, H / 2 + 1, r, R, 11);
  for (let i = 0; i < W * H / 40; i++) { const x = R() * W, y = R() * H, dx = (x - W / 2) / (W / 2), dy = (y - H / 2) / (H / 2); if (dx * dx + dy * dy < .6) P.p(x, y, R() < .5 ? r.l2 : r.d2); }
}, { pad: 4 });
defEl('pine', 'nature', 'Pinheiro sombrio', 2, 2, 1, '#245a42', (P, W, H, o) => {
  const r = o.r, R = P.R, cx = W / 2, cy = H / 2; P.shadowE(cx + 2, cy + 3, W / 2 - 1, H / 2 - 2, 0, 0, .45);
  for (let layer = 0; layer < 4; layer++) { const rad = (W / 2 - 1) * (1 - layer * .22), n = 9, pts = []; for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n + layer * .3, rr = i % 2 ? rad * .58 : rad; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    P.poly(pts.map(p => [p[0] + (p[0] > cx ? .6 : -.6), p[1] + (p[1] > cy ? .6 : -.6)]), r.d3); P.poly(pts, [r.d1, r.m, r.l1, r.l2][layer]); for (let i = 0; i < n * 2; i += 2) P.line(cx, cy, pts[i][0] * .5 + cx * .5, pts[i][1] * .5 + cy * .5, [r.d2, r.d1, r.m, r.l1][layer]); }
  P.ell(cx, cy, 1.5, 1.5, '#4a3a2a'); P.p(cx - 1, cy - 1, r.l3);
}, { pad: 4 });
defEl('dead_tree', 'nature', 'Árvore morta', 2, 2, 1, '#4a3d34', (P, W, H, o) => {
  const r = o.r, R = P.R, cx = W / 2, cy = H / 2; P.shadowE(cx + 1, cy + 3, W / 2 - 3, H / 2 - 4, 0, 0, .4);
  const br = (x, y, a, L, t) => { for (let i = 0; i < L; i++) { x += Math.cos(a); y += Math.sin(a); P.f(x, y, t, t, i < L * .5 ? r.d2 : r.d1); P.p(x - 1, y - 1, OUTC); if (R() < .05 && L > 5) br(x, y, a + (R() - .5) * 2, L * .5, 1); a += (R() - .5) * .35; } };
  for (let i = 0; i < 4; i++) br(cx, cy, -.4 + i * 1.5 + R() * .8, W * (.28 + R() * .2), 2); P.ell(cx, cy, 3, 3, OUTC); P.ell(cx, cy, 2, 2, r.m); P.p(cx - 1, cy - 1, r.l2);
}, { pad: 4 });
defEl('bush', 'nature', 'Arbusto', 1, 1, 1, '#468a3c', (P, W, H, o) => {
  const r = o.r, R = P.R; P.shadowE(W / 2 + 1, H / 2 + 2, W / 2 - 1, H / 2 - 2, 0, 0, .45); leafCluster(P, W / 2, H / 2, W / 2, H / 2, r, R, 4); if (R() < .5) for (let i = 0; i < 4; i++) P.p(3 + R() * (W - 6), 3 + R() * (H - 6), '#d83a4a');
});
defEl('flowers', 'nature', 'Flores', 1, 1, 1, '#4a8a3a', (P, W, H, o) => {
  const r = o.r, R = P.R; for (let i = 0; i < 5; i++) tuft(P, 2 + R() * (W - 4), 4 + R() * (H - 5), r); for (let i = 0; i < 7; i++) { const x = 2 + R() * (W - 4), y = 2 + R() * (H - 4), c = ['#f2ecc8', '#f0c84a', '#e86a98', '#a98af2'][R() * 4 | 0]; P.p(x, y, c); P.p(x + 1, y, c); P.p(x, y - 1, '#fff7'); }
});
defEl('rock', 'nature', 'Rocha', 1, 1, 1, '#757a7e', (P, W, H, o) => {
  const r = o.r, R = P.R, cx = W / 2, cy = H / 2, n = 7, pts = []; for (let i = 0; i < n; i++) { const a = i * 6.28 / n + R() * .3, rr = (W / 2 - 1) * (.78 + R() * .22); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  P.shadowE(cx + 1, cy + 2, W / 2 - 1, H / 2 - 2, 0, 0, .45); P.poly(pts.map(p => [p[0] + (p[0] > cx ? .8 : -.8), p[1] + (p[1] > cy ? .8 : -.8)]), r.d3); P.poly(pts, r.m);
  P.poly([pts[0], pts[1], [cx, cy], pts[n - 1]], r.l1); P.poly([pts[3], pts[4], [cx, cy], pts[2]], r.d1); P.hl(cx - 4, cy - 4, 3, r.l3); P.line(cx, cy, pts[3][0], pts[3][1], r.d2); P.dith(cx - 3, cy, 6, 4, r.d2, .3);
});
defEl('field', 'nature', 'Plantação', 4, 3, 0, '#58a032', (P, W, H, o) => {
  const r = o.r, R = P.R, soil = RP('#6a4426'); P.f(0, 0, W, H, soil.m);
  for (let y = 0; y < H; y += 5) { P.f(0, y, W, 2, soil.d1); P.hl(0, y + 4, W, soil.d2); for (let x = 0; x < W; x += 3 + (R() * 2 | 0)) { P.f(x, y - 2, 2, 3, r.m); P.p(x, y - 2, r.l2); P.p(x + 1, y - 1, r.d1); P.p(x + (R() < .5 ? 2 : -1), y - 3, r.l1); } }
  P.dith(0, 0, W, H, soil.d2, .08);
});
defEl('stumps', 'nature', 'Tocos / lenha', 4, 3, 1, '#7a5430', (P, W, H, o) => {
  const r = o.r, R = P.R; for (let i = 0; i < 9; i++) { const x = 4 + R() * (W - 8), y = 4 + R() * (H - 8), s = 2 + R() * 2.5; P.shadowE(x, y, s, s, 1, 2, .45); P.ell(x, y, s + 1, s + 1, r.d3); P.ell(x, y, s, s, r.m); P.ring(x, y, s - 1, s - 1, r.d1, 1); P.p(x - s * .4, y - s * .4, r.l2); P.p(x, y, r.d2); }
  for (let i = 0; i < 5; i++) { const x = R() * W, y = R() * H, a = R() * 3.14; P.line(x, y, x + Math.cos(a) * 5, y + Math.sin(a) * 5, r.d2); }
});
defEl('fence', 'nature', 'Cerca de madeira', 3, .3, 1, '#7a5230', (P, W, H, o) => {
  const r = o.r; P.shadowR(0, 1, W, H - 1, 1, 2, .4); P.f(0, 1, W, 1, OUTC); P.f(0, 1, W, 2, r.m); P.hl(0, 1, W, r.l1); P.hl(0, 3, W, r.d1); for (let x = 1; x < W; x += 11) { P.f(x, 0, 3, H, OUTC); P.f(x, 0, 2, H - 1, r.m); P.p(x, 0, r.l2); P.vl(x + 1, 1, H - 2, r.d1); }
});
defEl('campfire', 'nature', 'Fogueira', 1, 1, 1, '#ff9a2e', (P, W, H, o) => {
  const f = o.frame | 0, cx = W / 2, cy = H / 2, st = RP('#6e6e72'); P.glow(cx, cy, 14, '#ff8a2a', .55);
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; P.ell(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6, 2.2, 2, OUTC); P.ell(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6, 1.6, 1.4, i % 2 ? st.m : st.l1); P.p(cx + Math.cos(a) * 6 - 1, cy + Math.sin(a) * 6 - 1, st.l3); }
  P.line(cx - 5, cy + 3, cx + 4, cy - 3, '#4a2c18'); P.line(cx + 5, cy + 3, cx - 4, cy - 3, '#5a3a20'); P.ell(cx, cy, 4, 3, '#c83a14');
  const sh = [0, 1, 0, -1][f % 4], H1 = [6, 7, 6, 8][f % 4]; P.poly([[cx - 3, cy + 2], [cx + sh - 1, cy - H1], [cx + 3, cy + 2]], '#ff7a1e'); P.poly([[cx - 2, cy + 2], [cx + sh, cy - H1 + 2], [cx + 2, cy + 2]], '#ffc23a'); P.poly([[cx - 1, cy + 2], [cx + sh, cy - 2], [cx + 1, cy + 2]], '#fff2a0');
  P.p(cx + 5 + sh * 2, cy - 7 - f % 3, '#ffb04a'); P.p(cx - 5 - sh, cy - 5 - (f + 1) % 3, '#ff7a1e');
}, { anim: true, pad: 8, frames: 4 });
defEl('tent', 'nature', 'Barraca de acampamento', 2, 2.4, 1, '#a8955a', (P, W, H, o) => {
  const r = o.r, R = P.R, cx = W / 2; P.shadowR(3, 3, W - 4, H - 5, 2, 3, .45);
  P.rr(2, 1, W - 4, H - 6, OUTC, 2); P.f(3, 2, cx - 3, H - 8, r.l1); P.f(cx, 2, cx - 3, H - 8, r.d1); P.grad(3, 2, cx - 3, H - 8, r.l1, r.m, 'h', 0, .8); P.grad(cx, 2, cx - 3, H - 8, r.d1, r.d2, 'h', .1, 1);
  P.vl(cx - 1, 2, H - 8, r.l3); P.vl(cx, 2, H - 8, r.d3); for (let y = 9; y < H - 9; y += 8) { P.hl(3, y, cx - 3, r.d1); P.hl(cx, y, cx - 3, r.d3); }
  P.poly([[cx - 6, H - 5], [cx + 6, H - 5], [cx, H - 17]], OUTC); P.poly([[cx - 4, H - 6], [cx + 4, H - 6], [cx, H - 14]], '#1a1420'); P.line(cx - 6, H - 5, cx, H - 17, r.l2); P.line(cx + 6, H - 5, cx, H - 17, r.d3);
  for (const [x, y, dx] of [[2, 3, -1], [W - 3, 3, 1], [2, H - 8, -1], [W - 3, H - 8, 1]]) { P.line(x, y, x + dx * 2, y + 1, '#d8cfae'); P.p(x + dx * 2, y + 1, OUTC); }
}, { pad: 4 });
defEl('well', 'nature', 'Poço', 1, 1, 1, '#797d82', (P, W, H, o) => {
  const r = o.r, cx = W / 2, cy = H / 2; P.shadowE(cx, cy, W / 2 - 1, H / 2 - 1, 1, 2, .5); P.blob(cx, cy, W / 2 - 1, H / 2 - 1, r, { flat: true }); P.ell(cx, cy, W / 2 - 4, H / 2 - 4, OUTC); P.ell(cx, cy, W / 2 - 5, H / 2 - 5, '#17394e'); P.hl(cx - 3, cy - 2, 4, '#3c7a9a');
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; P.f(cx + Math.cos(a) * (W / 2 - 2.5), cy + Math.sin(a) * (H / 2 - 2.5), 1, 1, r.d2); } P.f(0, cy - 1, W, 2, WOODR.m); P.hl(0, cy - 1, W, WOODR.l1);
});
defEl('arch', 'nature', 'Portal de madeira', 3, .7, 1, '#9a5226', (P, W, H, o) => {
  const r = o.r; P.shadowR(0, 2, W, H - 2, 1, 3, .45); P.box(0, 1, W, 4, r, { cut: 1 }); P.hl(2, 2, W - 4, r.l2); P.box(0, 0, 5, H, r, { cut: 1 }); P.box(W - 5, 0, 5, H, r, { cut: 1 }); P.f(W / 2 - 4, 5, 1, 4, '#d8d0b8'); P.f(W / 2 + 3, 5, 1, 4, '#d8d0b8'); P.box(W / 2 - 4, 8, 8, 3, RP('#7a5a38'), { cut: 0 });
});
defEl('cave', 'nature', 'Entrada de caverna', 3, 3, 1, '#58634e', (P, W, H, o) => {
  const r = o.r, R = P.R, cx = W / 2, cy = H / 2 + 2, n = 12, pts = []; for (let i = 0; i < n; i++) { const a = i * 6.28 / n, rr = (W / 2 - 2) * (.82 + R() * .18); pts.push([W / 2 + Math.cos(a) * rr, H / 2 + Math.sin(a) * rr * .92]); }
  P.shadowE(cx + 2, cy + 3, W / 2 - 2, H / 2 - 4, 0, 0, .5); P.poly(pts.map(p => [p[0] + (p[0] > cx ? 1 : -1), p[1] + (p[1] > cy ? 1 : -1)]), OUTC); P.poly(pts, r.m);
  for (let i = 0; i < 9; i++) { const a = R() * 6.28, d = R() * (W / 2 - 6); P.poly([[W / 2 + Math.cos(a) * d - 4, H / 2 + Math.sin(a) * d - 3], [W / 2 + Math.cos(a) * d + 3, H / 2 + Math.sin(a) * d - 4], [W / 2 + Math.cos(a) * d + 4, H / 2 + Math.sin(a) * d + 2], [W / 2 + Math.cos(a) * d - 3, H / 2 + Math.sin(a) * d + 3]], R() < .5 ? r.l1 : r.d1); }
  P.dith(2, 2, W - 4, H - 4, r.d2, .12); P.ell(cx, cy + 1, 9, 7, OUTC); P.ell(cx, cy + 1, 8, 6, '#0b0710'); P.dithE(cx, cy - 2, 8, 3, '#241c2c', .6); P.hl(cx - 7, cy - 6, 5, r.l2);
});
defEl('cloud', 'nature', 'Névoa decorativa', 4, 4, 2, '#dfe6ec', (P, W, H, o) => {
  const r = o.r, R = P.R; P.c.save();
  for (let i = 0; i < 60; i++) { P.c.globalAlpha = .06 + R() * .04; const a = R() * 6.28, d = Math.sqrt(R()) * .42; P.ell(W / 2 + Math.cos(a) * W * d, H / 2 + Math.sin(a) * H * d, 6 + R() * 14, 5 + R() * 10, r.m); }
  for (let i = 0; i < 24; i++) { P.c.globalAlpha = .12; const a = R() * 6.28, d = Math.sqrt(R()) * .38; P.dithE(W / 2 + Math.cos(a) * W * d, H / 2 + Math.sin(a) * H * d, 5 + R() * 9, 4 + R() * 6, r.l3, .35); } P.c.restore();
}, { pad: 0 });
defEl('tomb', 'nature', 'Lápide', .8, 1, 1, '#7d8286', (P, W, H, o) => {
  const r = o.r, R = P.R; P.shadowR(1, 2, W - 2, H - 2, 1, 2, .5); P.f(1, H - 5, W - 2, 5, '#5a4030'); P.dith(1, H - 5, W - 2, 5, '#3a281c', .4);
  P.rr(1, 0, W - 2, H - 3, OUTC, 3); P.rr(2, 1, W - 4, H - 5, r.m, 2); P.hl(4, 1, W - 8, r.l2); P.vl(2, 3, H - 8, r.l1); P.vl(W - 3, 3, H - 8, r.d1); P.f(W / 2 - 1, 3, 2, 6, r.d2); P.f(W / 2 - 3, 5, 6, 2, r.d2); P.p(3, H - 6, '#4c7a3a'); P.p(4, H - 7, '#6fa04c'); P.p(W - 5, 8, '#4c7a3a');
});

/* ---------------- CONSTRUÇÕES (telhados vistos de cima) ---------------- */
function shingleRows(P, x, y, w, h, hex, vert) {
  const r = RP(hex), dk = r.d2, lt = r.l1; P.f(x, y, w, h, hex);
  if (!vert) {
    for (let j = 0, row = 0; j < h; j += 3, row++) { P.hl(x, y + j + 2, w, dk); P.hl(x, y + j, w, lt); for (let i = (row % 2) * 3; i < w; i += 6) P.vl(x + i, y + j, 3, r.d1); }
  } else {
    for (let j = 0, col = 0; j < w; j += 3, col++) { P.vl(x + j + 2, y, h, dk); P.vl(x + j, y, h, lt); for (let i = (col % 2) * 3; i < h; i += 6) P.hl(x + j, y + i, 3, r.d1); }
  }
  P.dith(x, y, w, h, r.d1, .06);
}
function gable(P, x, y, w, h, hex, vert, R) {
  const r = RP(hex); P.shadowR(x, y, w, h, 3, 3, .5); P.f(x - 1, y - 1, w + 2, h + 2, OUTC);
  if (!vert) {
    const hf = Math.floor(h / 2); shingleRows(P, x, y, w, hf, r.m, false); shingleRows(P, x, y + hf, w, h - hf, r.d1, false); P.f(x, y + hf - 1, w, 2, r.l2); P.hl(x, y + hf + 1, w, r.d3); P.hl(x, y, w, r.l2); P.hl(x, y + h - 1, w, r.d3); P.vl(x, y, h, r.l1); P.vl(x + w - 1, y, h, r.d3);
    P.dith(x, y + hf + 2, w, 3, r.d3, .35);
  } else {
    const wf = Math.floor(w / 2); shingleRows(P, x, y, wf, h, r.m, true); shingleRows(P, x + wf, y, w - wf, h, r.d1, true); P.f(x + wf - 1, y, 2, h, r.l2); P.vl(x + wf + 1, y, h, r.d3); P.vl(x, y, h, r.l2); P.vl(x + w - 1, y, h, r.d3); P.hl(x, y, w, r.l1); P.hl(x, y + h - 1, w, r.d3);
    P.dith(x + wf + 2, y, 3, h, r.d3, .35);
  }
  if (R && R() < .8) for (let i = 0; i < 3; i++) P.dithE(x + R() * w, y + R() * h, 2 + R() * 3, 1.5 + R() * 2, '#4a6a3a', .35);
}
function chimney(P, x, y) { const c = RP('#a8826a'); P.shadowR(x, y, 7, 7, 2, 3, .55); P.box(x, y, 7, 7, c, { cut: 0 }); P.f(x + 2, y + 2, 3, 3, '#120a10'); P.p(x + 1, y + 1, c.l3); P.hl(x + 2, y + 5, 3, c.d1); }
defEl('house_s', 'build', 'Casa pequena (telhado)', 2, 2, 1, '#b8362a', (P, W, H, o) => { gable(P, 1, 1, W - 3, H - 3, o.color, false, P.R); chimney(P, W - 10, 3); }, { pad: 4 });
defEl('house_l', 'build', 'Casa grande (telhado)', 3.4, 2.6, 1, '#c8682c', (P, W, H, o) => {
  const R = P.R; gable(P, 1, 1, W - 3, H - 3, o.color, false, R); gable(P, Math.floor(W * .55), 1, Math.floor(W * .3), H - 3, o.color, true, R); chimney(P, 6, 4); chimney(P, W - 12, H - 12);
}, { pad: 4 });
defEl('barn', 'build', 'Celeiro', 1.8, 5, 1, '#c85e20', (P, W, H, o) => { gable(P, 1, 1, W - 3, H - 3, o.color, true, P.R); for (let y = 8; y < H - 6; y += 12) { P.f(W / 2 - 3, y, 6, 3, OUTC); P.f(W / 2 - 2, y + 1, 4, 1, '#3a2a30'); } }, { pad: 4 });
defEl('manor', 'build', 'Mansão (telhado de ardósia)', 5, 5.6, 1, '#58628a', (P, W, H, o) => {
  const R = P.R; gable(P, 1, 1, W - 3, Math.floor(H * .5), o.color, false, R); gable(P, Math.floor(W * .5), Math.floor(H * .42), Math.floor(W * .46), H - Math.floor(H * .42) - 3, o.color, true, R); gable(P, 1, Math.floor(H * .52), Math.floor(W * .42), Math.floor(H * .4), shade(o.color, .08), false, R);
  chimney(P, 10, 6); chimney(P, W - 16, 8); chimney(P, W - 20, H - 18); P.ell(W * .22, H * .75, 4, 4, OUTC); P.ell(W * .22, H * .75, 3, 3, '#5a6078'); P.p(W * .22 - 1, H * .75 - 1, '#9aa0bc');
}, { pad: 4 });
defEl('tower', 'build', 'Torre / moinho', 2.2, 2.2, 2, '#ddd5c0', (P, W, H, o) => {
  const r = o.r, cx = W / 2, cy = H / 2, rad = W / 2 - 1, n = 8, red = RP('#b8302a'); P.shadowE(cx + 2, cy + 3, rad, rad, 0, 0, .45);
  const pts = []; for (let i = 0; i < n; i++) { const a = i * 6.28 / n + .39; pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]); } P.poly(pts.map(p => [p[0] + (p[0] > cx ? 1 : -1), p[1] + (p[1] > cy ? 1 : -1)]), OUTC);
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n], lit = (i + 1) % n < 4 ? 1 : 0; P.poly([[cx, cy], a, b], i % 2 ? (lit ? red.l1 : red.d1) : (lit ? r.l2 : r.d1)); P.line(cx, cy, a[0], a[1], i % 2 ? red.d2 : r.d2); }
  P.polyO(pts, OUTC); P.ell(cx, cy, 2, 2, GOLD.m); P.p(cx - 1, cy - 1, GOLD.l3);
}, { pad: 4 });

function catalogByCat() {
  return CATS.map(([id, label]) => ({ id, label, items: Object.values(CATALOG).filter(d => d.cat === id) }));
}
