'use strict';
/* ===== render.js — desenho da cena (mapa, elementos, luz, névoa, tokens) ===== */

const ELCACHE = new Map(); let ELCACHE_PX = 0;
function cacheGet(key) { const v = ELCACHE.get(key); if (v) { ELCACHE.delete(key); ELCACHE.set(key, v); } return v; }
function cachePut(key, ent) {
  ELCACHE.set(key, ent); ELCACHE_PX += ent.px;
  while (ELCACHE_PX > 70e6 && ELCACHE.size > 1) { const k = ELCACHE.keys().next().value; const e = ELCACHE.get(k); ELCACHE_PX -= e.px; ELCACHE.delete(k); }
}

function drawElement(ctx, e, grid, time, s) {
  const def = CATALOG[e.kind]; if (!def) return;
  const col = e.color || def.color, g = grid || 48, AW = Math.max(1, Math.round(e.w / g * PX)), AH = Math.max(1, Math.round(e.h / g * PX)), pad = def.pad == null ? 2 : def.pad;
  const frames = def.frames || 4, frame = def.anim ? Math.floor((time || 0) / 150) % frames : 0, key = [e.kind, AW, AH, col, e.seed | 0, frame].join('|');
  let ent = cacheGet(key);
  if (!ent) {
    const P = new Pix(AW, AH, pad, rng(e.seed | 0));
    if (def.clip) { P.c.beginPath(); P.c.rect(0, 0, AW, AH); P.c.clip(); }
    try { def.pdraw(P, AW, AH, { color: col, r: RP(col), R: P.R, time: time || 0, frame, seed: e.seed | 0 }); } catch (err) { if (typeof console !== 'undefined') console.error('arte falhou:', e.kind, err); }
    ent = { cv: P.cv, px: P.cv.width * P.cv.height }; cachePut(key, ent);
  }
  const sx = e.w / AW, sy = e.h / AH;
  ctx.save();
  if (e.alpha != null && e.alpha < 1) ctx.globalAlpha *= e.alpha;
  ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
  if (e.rot) ctx.rotate(e.rot * Math.PI / 180);
  if (e.flip) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = Math.min(sx, sy) * (s || 1) < 1.05;
  ctx.drawImage(ent.cv, -e.w / 2 - pad * sx, -e.h / 2 - pad * sy, (AW + 2 * pad) * sx, (AH + 2 * pad) * sy);
  ctx.restore();
}

const WALLPAT = {};
function wallPattern(ctx, color) {
  if (WALLPAT[color]) return WALLPAT[color];
  const r = RP(color), P = new Pix(16, 16, 0, rng(5)); P.f(0, 0, 16, 16, r.m);
  for (let y = 0, row = 0; y < 16; y += 4, row++) { P.hl(0, y + 3, 16, r.d2); for (let x = (row % 2) * 4; x < 16; x += 8) P.vl(x, y, 3, r.d2); P.hl(0, y, 16, r.l1); }
  P.noise(0, 0, 16, 16, [r.d1, r.l1], .12); let pat = null; try { pat = ctx.createPattern(P.cv, 'repeat'); if (pat && pat.setTransform && typeof DOMMatrix !== 'undefined') pat.setTransform(new DOMMatrix().scale(3, 3)); } catch (e) { pat = null; }
  return WALLPAT[color] = { pat, r };
}
function drawWall(ctx, w) {
  const t = w.thick || 10, col = w.color && w.color !== '#0b0b0c' ? w.color : '#3a3d48', wp = wallPattern(ctx, col);
  ctx.save(); ctx.lineCap = 'square'; ctx.lineJoin = 'miter';
  const seg = () => { ctx.beginPath(); ctx.moveTo(w.x1, w.y1); ctx.lineTo(w.x2, w.y2); ctx.stroke(); };
  ctx.translate(2, 3); ctx.strokeStyle = 'rgba(6,2,14,.5)'; ctx.lineWidth = t + 4; seg(); ctx.translate(-2, -3);
  ctx.strokeStyle = OUTC; ctx.lineWidth = t + 3; seg();
  ctx.strokeStyle = wp.pat || wp.r.m; ctx.lineWidth = t; seg();
  ctx.strokeStyle = 'rgba(255,238,200,.22)'; ctx.lineWidth = Math.max(1.5, t * .16); ctx.translate(-t * .22, -t * .22); seg();
  ctx.restore();
}

/* ---------- tokens ---------- */
const TOKCACHE = new Map();
function framePath(c, shape, x, y, w, h) {
  c.beginPath();
  if (shape === 'circle') c.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 6.2832);
  else if (shape === 'hex') { const cx = x + w / 2, cy = y + h / 2; for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; const px = cx + Math.cos(a) * w / 2, py = cy + Math.sin(a) * h / 2; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath(); }
  else if (shape === 'rounded') rrPath(c, x, y, w, h, w * .24);
  else c.rect(x, y, w, h);
}
function bakeToken(t, px) {
  const img = t.asset ? Assets.get(t.asset) : null;
  const cv = makeCanvas(px, px), c = cv.getContext('2d');
  const full = t.frame === 'full', ins = px * .06;
  if (full) {
    if (img) {
      const sc = Math.min((px - 2) / img.width, (px - 2) / img.height), dw = img.width * sc, dh = img.height * sc;
      c.drawImage(img, (px - dw) / 2, (px - dh) / 2, dw, dh);
    } else { c.fillStyle = t.color; c.beginPath(); c.ellipse(px / 2, px * .55, px * .26, px * .38, 0, 0, 6.28); c.fill(); }
  } else {
    const x = ins, y = ins, w = px - ins * 2, h = px - ins * 2;
    c.save(); framePath(c, t.frame, x, y, w, h); c.clip();
    if (img) {
      const sc = Math.max(w / img.width, h / img.height) * clamp(t.zoom || 1, 1, 4), dw = img.width * sc, dh = img.height * sc;
      c.drawImage(img, x + (w - dw) / 2 + clamp(t.ox || 0, -1, 1) * Math.max(0, (dw - w) / 2), y + (h - dh) / 2 + clamp(t.oy || 0, -1, 1) * Math.max(0, (dh - h) / 2), dw, dh);
    } else {
      c.fillStyle = lgrad(c, x, y, x + w, y + h, [[0, shade(t.color, .25)], [1, shade(t.color, -.4)]]); c.fillRect(x, y, w, h);
      c.fillStyle = 'rgba(255,255,255,.92)'; c.font = '700 ' + Math.round(px * .46) + 'px system-ui,Segoe UI,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText((t.name || '?').trim().charAt(0).toUpperCase() || '?', px / 2, px / 2 + px * .02);
    }
    c.restore();
  }
  if (t.state === 'dying') { c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(200,10,22,.42)'; c.fillRect(0, 0, px, px); c.globalCompositeOperation = 'source-over'; }
  if (t.state === 'dead') {
    try {
      const d = c.getImageData(0, 0, px, px), a = d.data;
      for (let i = 0; i < a.length; i += 4) { const g = (a[i] * .3 + a[i + 1] * .59 + a[i + 2] * .11) * .72; a[i] = a[i + 1] = a[i + 2] = g; }
      c.putImageData(d, 0, 0);
    } catch (e) { /* ignorar */ }
  }
  if (!full) {
    const x = ins, y = ins, w = px - ins * 2, h = px - ins * 2;
    framePath(c, t.frame, x, y, w, h);
    c.lineWidth = px * .075;
    c.strokeStyle = t.state === 'dying' ? '#d3202c' : t.state === 'dead' ? '#7a7a7a' : t.color; c.stroke();
    c.lineWidth = px * .018; c.strokeStyle = 'rgba(0,0,0,.55)'; framePath(c, t.frame, x + px * .04, y + px * .04, w - px * .08, h - px * .08); c.stroke();
  }
  return cv;
}
function drawSkull(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s / 100, s / 100);
  c.shadowColor = 'rgba(0,0,0,.85)'; c.shadowBlur = 12; c.lineWidth = 4; c.strokeStyle = '#161616'; c.fillStyle = '#ece8dc';
  c.beginPath(); c.ellipse(0, -8, 35, 33, 0, 0, 6.2832); c.fill(); c.stroke();
  rrPath(c, -21, 14, 42, 26, 9); c.fill(); c.stroke();
  c.shadowBlur = 0; c.fillStyle = '#151515';
  c.beginPath(); c.ellipse(-14, -6, 10, 12, 0, 0, 6.28); c.fill(); c.beginPath(); c.ellipse(14, -6, 10, 12, 0, 0, 6.28); c.fill();
  c.beginPath(); c.moveTo(0, 8); c.lineTo(-5, 18); c.lineTo(5, 18); c.closePath(); c.fill();
  c.strokeStyle = '#161616'; c.lineWidth = 2.5; for (let i = -12; i <= 12; i += 8) { c.beginPath(); c.moveTo(i, 24); c.lineTo(i, 38); c.stroke(); }
  c.restore();
}
function drawTokenAt(c, t, x, y, D, o) {
  o = o || {}; const time = o.time || 0, s = o.s || 1;
  const px = [64, 128, 256, 512].find(p => p >= D * s * 1.1) || 512;
  const img = t.asset ? Assets.imgs[t.asset] : null; if (t.asset) Assets.get(t.asset);
  const key = [t.asset, img ? 1 : 0, t.frame, t.zoom || 1, t.ox || 0, t.oy || 0, t.color, (t.name || '?').charAt(0), t.state, px].join('|');
  let cv = TOKCACHE.get(key);
  if (!cv) { cv = bakeToken(t, px); TOKCACHE.set(key, cv); if (TOKCACHE.size > 160) TOKCACHE.delete(TOKCACHE.keys().next().value); }
  c.save();
  let al = t.alpha == null ? 1 : t.alpha; if (o.ghost) al *= .45; c.globalAlpha *= al;
  const pulse = (Math.sin(time / 260) + 1) / 2;
  if (t.state === 'dying') {
    c.save(); c.shadowColor = 'rgba(255,20,30,' + (.55 + pulse * .45) + ')'; c.shadowBlur = (6 + pulse * 14) * s;
    c.drawImage(cv, x - D / 2, y - D / 2, D, D); c.restore();
  }
  c.drawImage(cv, x - D / 2, y - D / 2, D, D);
  if (t.state === 'dead') drawSkull(c, x, y, D * .62);
  if (o.ghost) { c.setLineDash([6, 5]); c.strokeStyle = '#ffd36a'; c.lineWidth = 2 / s; c.beginPath(); c.arc(x, y, D / 2, 0, 6.28); c.stroke(); c.setLineDash([]); }
  c.restore();
}
function drawToken(c, t, grid, o) {
  const D = (t.size || 1) * grid;
  drawTokenAt(c, t, t.x, t.y, D, o);
  if (o.name) {
    const fs = clamp(13 / o.s, grid * .18, grid * .5);
    c.save(); c.font = '600 ' + fs + 'px system-ui,Segoe UI,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'top';
    c.lineWidth = fs * .28; c.strokeStyle = 'rgba(0,0,0,.85)'; c.lineJoin = 'round'; c.fillStyle = t.state === 'dead' ? '#9a9a9a' : '#f2efe6';
    c.strokeText(t.name || '', t.x, t.y + D / 2 + 2); c.fillText(t.name || '', t.x, t.y + D / 2 + 2); c.restore();
  }
  if (o.own) { c.save(); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.5 / o.s; c.setLineDash([5 / o.s, 4 / o.s]); c.beginPath(); c.arc(t.x, t.y, D / 2 + 5 / o.s, 0, 6.28); c.stroke(); c.restore(); }
}

/* ---------- limites p/ seleção ---------- */
function objBounds(type, o, grid) {
  if (type === 'wall') return { k: 'seg', x1: o.x1, y1: o.y1, x2: o.x2, y2: o.y2 };
  if (type === 'light') return { k: 'circ', x: o.x, y: o.y, r: o.r, light: true, dir: o.dir || 0, spread: o.spread == null ? 360 : o.spread };
  if (type === 'char' || type === 'creature') return { k: 'circ', x: o.x, y: o.y, r: (o.size || 1) * grid / 2, token: true };
  return { k: 'rect', x: o.x, y: o.y, w: o.w, h: o.h, rot: o.rot || 0 };
}

/* ---------- cena completa ---------- */
function renderScene(ctx, W, H, dpr, scene, cam, o) {
  o = o || {};
  const z = cam.z, s = z * dpr, grid = scene.grid || 50, time = o.time || 0, master = !!o.master;
  const L = o.layers || {};
  const vx = cam.x - 40 / z, vy = cam.y - 40 / z, vw = W / s + 80 / z, vh = H / s + 80 / z;
  const seen = (x, y, w, h) => x < vx + vw && x + w > vx && y < vy + vh && y + h > vy;
  const world = () => ctx.setTransform(s, 0, 0, s, -cam.x * s, -cam.y * s);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  world();

  // áreas (fundo)
  for (const a of scene.areas) {
    if (!seen(a.x, a.y, a.w, a.h)) continue;
    ctx.save(); ctx.beginPath(); ctx.rect(a.x, a.y, a.w, a.h); ctx.clip();
    ctx.fillStyle = a.color || '#16181b'; ctx.fillRect(a.x, a.y, a.w, a.h);
    if (a.bg) { const im = Assets.get(a.bg); if (im) { ctx.save(); ctx.imageSmoothingEnabled = a.smooth !== false; if (a.smooth !== false) ctx.imageSmoothingQuality = 'high'; ctx.drawImage(im, a.x, a.y, a.w, a.h); ctx.restore(); } }
    ctx.restore();
  }
  // elementos camada 0
  const els = scene.elements.filter(e => seen(e.x - e.w, e.y - e.h, e.w * 3, e.h * 3));
  const layerOf = e => (CATALOG[e.kind] ? CATALOG[e.kind].layer : 1);
  for (const e of els) if (layerOf(e) === 0) drawElement(ctx, e, grid, time, s);
  // grade
  if (scene.showGrid && L.grid !== false && grid * s > 9) {
    ctx.save(); ctx.lineWidth = 1 / s; ctx.strokeStyle = 'rgba(255,255,255,.07)';
    for (const a of scene.areas) {
      if (!seen(a.x, a.y, a.w, a.h)) continue;
      ctx.beginPath();
      const x0 = Math.max(a.x, Math.floor(vx / grid) * grid), x1 = Math.min(a.x + a.w, vx + vw), y0 = Math.max(a.y, Math.floor(vy / grid) * grid), y1 = Math.min(a.y + a.h, vy + vh);
      for (let x = a.x + Math.ceil((x0 - a.x) / grid) * grid; x <= x1; x += grid) { ctx.moveTo(x, y0); ctx.lineTo(x, y1); }
      for (let y = a.y + Math.ceil((y0 - a.y) / grid) * grid; y <= y1; y += grid) { ctx.moveTo(x0, y); ctx.lineTo(x1, y); }
      ctx.stroke();
    }
    ctx.restore();
  }
  for (const w of scene.walls) if (seen(Math.min(w.x1, w.x2) - 10, Math.min(w.y1, w.y2) - 10, Math.abs(w.x2 - w.x1) + 20, Math.abs(w.y2 - w.y1) + 20)) drawWall(ctx, w);
  for (const e of els) if (layerOf(e) === 1) drawElement(ctx, e, grid, time, s);

  // criaturas (antes da escuridão: o escuro as esconde)
  const tokO = { s, time };
  for (const t of scene.tokens) if (t.kind === 'n') {
    if (t.hidden && !master) continue;
    drawToken(ctx, t, grid, { s, time, name: master || t.nameVis, ghost: t.hidden });
  }
  for (const e of els) if (layerOf(e) === 2) drawElement(ctx, e, grid, time, s);

  // escuridão + luzes
  const lights = scene.lights || [];
  const dark = scene.areas.filter(a => a.darkness > 0);
  const lit = l => l.on !== false && seen(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
  const lInt = l => clamp((l.intensity == null ? 1 : l.intensity) * lightFlick(l, time), 0, 1);
  if (dark.length && o.dark) {
    const k = master && !o.fullLight ? .5 : 1, dc = o.dark.getContext('2d');
    dc.setTransform(1, 0, 0, 1, 0, 0); dc.globalCompositeOperation = 'source-over'; dc.clearRect(0, 0, o.dark.width, o.dark.height);
    dc.setTransform(s, 0, 0, s, -cam.x * s, -cam.y * s);
    for (const a of dark) { dc.fillStyle = rgba(a.ambient || '#04050a', clamp(a.darkness * k, 0, 1)); dc.fillRect(a.x, a.y, a.w, a.h); }
    dc.globalCompositeOperation = 'destination-out';
    for (const l of lights) if (lit(l)) lightPaint(dc, l, lInt(l), lightCutStops, 'cut');
    dc.globalCompositeOperation = 'source-over';
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(o.dark, 0, 0); world();
  }
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (const l of lights) if (lit(l)) lightPaint(ctx, l, lInt(l), lightGlowStops(l.color || '#ffcc77'), 'add');
  ctx.restore();
  for (const l of lights) if (seen(l.x - 40, l.y - 40, 80, 80)) drawLightSprite(ctx, l, grid, time, s);

  // jogadores
  for (const t of scene.tokens) if (t.kind === 'c') drawToken(ctx, t, grid, { s, time, name: true, own: o.ownId === t.id });

  // névoa / áreas cinzentas
  for (const f of scene.fog) {
    const sf = f.soft || 0; if (!seen(f.x - sf, f.y - sf, f.w + sf * 2, f.h + sf * 2)) continue;
    if (f.on === false && !(master && L.fog !== false)) continue;
    const on = f.on !== false;
    ctx.save();
    if (master) { if (L.fog === false) { ctx.restore(); continue; } }
    ctx.globalAlpha = on ? (master ? clamp(f.opacity * .42, .08, .6) : f.opacity) : 0;
    ctx.fillStyle = f.color || '#8a8a8a';
    if (sf > 0 && !master) { ctx.shadowColor = f.color || '#8a8a8a'; ctx.shadowBlur = sf * s; }
    if (f.shape === 'ellipse') { ctx.beginPath(); ctx.ellipse(f.x + f.w / 2, f.y + f.h / 2, f.w / 2, f.h / 2, 0, 0, 6.2832); ctx.fill(); }
    else ctx.fillRect(f.x, f.y, f.w, f.h);
    ctx.restore();
    if (master) {
      ctx.save(); ctx.globalAlpha = on ? .9 : .5; ctx.setLineDash([8 / z, 6 / z]); ctx.lineWidth = 1.5 / z; ctx.strokeStyle = '#b9b9b9';
      if (f.shape === 'ellipse') { ctx.beginPath(); ctx.ellipse(f.x + f.w / 2, f.y + f.h / 2, f.w / 2, f.h / 2, 0, 0, 6.2832); ctx.stroke(); } else ctx.strokeRect(f.x, f.y, f.w, f.h);
      ctx.setLineDash([]); ctx.fillStyle = '#ddd'; ctx.font = (11 / z) + 'px system-ui,sans-serif'; ctx.fillText('Névoa ' + Math.round(f.opacity * 100) + '%' + (on ? '' : ' (off)'), f.x + 5 / z, f.y + 14 / z);
      ctx.restore();
    }
  }

  // sobreposições do mestre
  if (master) {
    const ui = 1 / z;
    if (L.areas !== false) for (const a of scene.areas) {
      ctx.save(); ctx.setLineDash([10 * ui, 7 * ui]); ctx.lineWidth = 2 * ui; ctx.strokeStyle = a.reveal === 'hidden' ? '#a84040' : a.reveal === 'always' ? '#5aa85a' : '#e0a030'; ctx.strokeRect(a.x, a.y, a.w, a.h);
      ctx.setLineDash([]); ctx.font = '600 ' + 12 * ui + 'px system-ui,sans-serif'; const lbl = a.name + (a.darkness > 0 ? '  ☾' : '') + (a.reveal === 'always' ? '  ◉' : a.reveal === 'hidden' ? '  ⊘' : '');
      const tw = ctx.measureText(lbl).width; ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(a.x, a.y - 18 * ui, tw + 12 * ui, 18 * ui); ctx.fillStyle = ctx.strokeStyle; ctx.fillText(lbl, a.x + 6 * ui, a.y - 5 * ui); ctx.restore();
    }
    if (L.zones !== false) for (const zn of scene.zones || []) {
      ctx.save(); ctx.fillStyle = zn.action === 'light' ? 'rgba(255,200,60,.16)' : 'rgba(40,200,255,.16)'; ctx.fillRect(zn.x, zn.y, zn.w, zn.h);
      ctx.strokeStyle = zn.action === 'light' ? '#ffc83c' : '#34c8ff'; ctx.lineWidth = 1.6 * ui; ctx.setLineDash([6 * ui, 4 * ui]); ctx.strokeRect(zn.x, zn.y, zn.w, zn.h); ctx.setLineDash([]);
      ctx.font = '600 ' + 11 * ui + 'px system-ui,sans-serif'; ctx.fillStyle = ctx.strokeStyle; ctx.fillText((zn.locked ? '🔒 ' : '') + (zn.verb || 'Entrar') + (zn.name ? ': ' + zn.name : ''), zn.x + 4 * ui, zn.y + 13 * ui);
      if (zn.action === 'enter' && zn.targetX != null) {
        const cx = zn.x + zn.w / 2, cy = zn.y + zn.h / 2; ctx.globalAlpha = .7; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(zn.targetX, zn.targetY); ctx.stroke();
        ctx.beginPath(); ctx.arc(zn.targetX, zn.targetY, 6 * ui, 0, 6.28); ctx.fill();
      }
      if (zn.action === 'light') for (const id of zn.lightIds || []) { const l = scene.lights.find(q => q.id === id); if (l) { ctx.globalAlpha = .6; ctx.beginPath(); ctx.moveTo(zn.x + zn.w / 2, zn.y + zn.h / 2); ctx.lineTo(l.x, l.y); ctx.stroke(); } }
      ctx.restore();
    }
    if (L.lights !== false) for (const l of scene.lights) {
      const on = l.on !== false, T = LIGHT_TYPES[lightKind(l)], col = on ? (l.color || '#ffcc77') : '#777';
      ctx.save(); ctx.translate(l.x, l.y);
      if ((l.spread || 360) < 359) { // cone: contorno e seta de direção
        ctx.strokeStyle = col; ctx.globalAlpha = on ? .55 : .3; ctx.lineWidth = 1.2 * ui; ctx.setLineDash([5 * ui, 4 * ui]);
        const d = (l.dir || 0) * Math.PI / 180, h2 = l.spread / 2 * Math.PI / 180;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, l.r, d - h2, d + h2); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(Math.cos(d) * 14 * ui, Math.sin(d) * 14 * ui); ctx.lineTo(Math.cos(d) * 30 * ui, Math.sin(d) * 30 * ui); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(Math.cos(d) * 32 * ui, Math.sin(d) * 32 * ui); ctx.lineTo(Math.cos(d - .35) * 24 * ui, Math.sin(d - .35) * 24 * ui); ctx.lineTo(Math.cos(d + .35) * 24 * ui, Math.sin(d + .35) * 24 * ui); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (!T.size) { // fonte natural: sem ícone no jogo, marcador discreto só para o mestre
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.4 * ui; ctx.globalAlpha = on ? .9 : .5; ctx.setLineDash([3 * ui, 3 * ui]); ctx.beginPath(); ctx.arc(0, 0, 8 * ui, 0, 6.28); ctx.stroke(); ctx.setLineDash([]);
        for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 3 * ui, Math.sin(a) * 3 * ui); ctx.lineTo(Math.cos(a) * 12 * ui, Math.sin(a) * 12 * ui); ctx.stroke(); }
      } else if (!on) { ctx.strokeStyle = '#999'; ctx.globalAlpha = .7; ctx.lineWidth = 1.2 * ui; ctx.beginPath(); ctx.arc(0, 0, 10 * ui, 0, 6.28); ctx.stroke(); }
      ctx.restore();
    }
  }
  if (o.overlay) { world(); o.overlay(ctx, z); }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/* seleção: contorno e alças (desenhado em espaço de mundo) */
function drawSelection(ctx, b, z, handles) {
  const ui = 1 / z; ctx.save(); ctx.strokeStyle = '#ff4d5a'; ctx.fillStyle = '#fff'; ctx.lineWidth = 1.6 * ui;
  if (b.k === 'rect') {
    ctx.translate(b.x + b.w / 2, b.y + b.h / 2); ctx.rotate((b.rot || 0) * Math.PI / 180);
    ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);
    if (handles) {
      const hs = 4.5 * ui; const pts = handlePoints(b, true);
      for (const p of pts) { ctx.beginPath(); ctx.rect(p.lx - hs, p.ly - hs, hs * 2, hs * 2); ctx.fill(); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(0, -b.h / 2); ctx.lineTo(0, -b.h / 2 - 24 * ui); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -b.h / 2 - 24 * ui, 5 * ui, 0, 6.28); ctx.fill(); ctx.stroke();
    }
  } else if (b.k === 'seg') {
    ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke();
    for (const p of [[b.x1, b.y1], [b.x2, b.y2]]) { ctx.beginPath(); ctx.arc(p[0], p[1], 5 * ui, 0, 6.28); ctx.fill(); ctx.stroke(); }
  } else if (b.k === 'circ') {
    ctx.setLineDash([6 * ui, 4 * ui]);
    if (b.light && b.spread < 359) { const d = b.dir * Math.PI / 180, h2 = b.spread / 2 * Math.PI / 180; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.arc(b.x, b.y, b.r, d - h2, d + h2); ctx.closePath(); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.28); ctx.stroke(); }
    ctx.setLineDash([]);
    if (b.light) { for (const hp of lightHandles(b)) { ctx.fillStyle = hp.k === 'rad' ? '#fff' : hp.k === 'dir' ? '#ffd24a' : '#7fd8ff'; ctx.beginPath(); ctx.arc(hp.x, hp.y, 5 * ui, 0, 6.28); ctx.fill(); ctx.stroke(); } }
    else if (!b.token) { ctx.beginPath(); ctx.arc(b.x + b.r, b.y, 5 * ui, 0, 6.28); ctx.fill(); ctx.stroke(); }
  }
  ctx.restore();
}
function handlePoints(b, local) { // 8 alças no espaço local centrado
  const hw = b.w / 2, hh = b.h / 2;
  return [['nw', -hw, -hh], ['n', 0, -hh], ['ne', hw, -hh], ['e', hw, 0], ['se', hw, hh], ['s', 0, hh], ['sw', -hw, hh], ['w', -hw, 0]].map(p => ({ id: p[0], lx: p[1], ly: p[2] }));
}

/* alças da luz selecionada: raio (branca), direção (amarela) e abertura (azul), em coordenadas de mundo */
function lightHandles(b) {
  const d = (b.dir || 0) * Math.PI / 180, out = [{ k: 'rad', x: b.x + Math.cos(d) * b.r, y: b.y + Math.sin(d) * b.r }, { k: 'dir', x: b.x + Math.cos(d) * b.r * .5, y: b.y + Math.sin(d) * b.r * .5 }];
  if (b.spread < 359) { const a = d + b.spread / 2 * Math.PI / 180; out.push({ k: 'spr', x: b.x + Math.cos(a) * b.r * .8, y: b.y + Math.sin(a) * b.r * .8 }); }
  return out;
}
