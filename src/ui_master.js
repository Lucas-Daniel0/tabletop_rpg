'use strict';
/* ===== ui_master.js — editor e mesa do mestre ===== */

async function startMaster(opts) {
  opts = opts || {}; const cloudCamp = opts.cloud || null;
  if (cloudCamp) store.set('vtt-last', { role: 'master', id: cloudCamp.row.id, name: cloudCamp.row.name || '' });
  const root = $('#root'); root.innerHTML = '';
  const cfg = cloudCamp ? { mode: 'online', url: CLOUD.url, key: CLOUD.key, code: cloudCamp.row.code, cloud: true } : Object.assign({ mode: 'online', url: CLOUD.url, key: CLOUD.key, code: genCode() }, store.get('vtt-cfg', {}));
  let C = newCampaign();
  const fixC = () => { for (const k of ['areas', 'elements', 'walls', 'zones', 'fog', 'lights', 'creatures']) C[k] = C[k] || []; C.characters = C.characters || {}; };
  if (cloudCamp) {
    C = Object.assign(newCampaign(), cloudCamp.row.data || {}); if (cloudCamp.row.name && (!C.name || C.name === 'Nova campanha')) C.name = cloudCamp.row.name; C.characters = {}; for (const p of (C.pcs || [])) C.characters[p.id] = p; fixC();
    Assets.clear(); for (const id in (cloudCamp.assets || {})) Assets.data[id] = cloudCamp.assets[id];
  } else {
    const saved = await DB.get('campaign');
    if (saved && saved.campaign) { C = Object.assign(newCampaign(), saved.campaign); fixC(); Assets.clear(); for (const id in (saved.assets || {})) Assets.data[id] = saved.assets[id]; }
  }
  let net = null, tool = 'select', sel = [], preview = false, tab = 'catalog', catSel = 'house_s', cat = 'floor', sessErr = '';
  const layers = { zones: true, fog: true, lights: true, areas: true, grid: true };
  const opt = { wallThick: 10, wallColor: '#0b0b0c', fogShape: 'rect', fogOpacity: .85, fogSoft: 24, zoneAction: 'enter', lightKind: 'torch', lightR: 5, lightColor: '#ff9a3a', lightInt: .95, lightDir: 0, lightSpread: 360, lightFlicker: true };
  let hist = [], redo = [], altKey = false, spaceDown = false, cursor = null, wallLast = null, drag = null, pickTarget = null;

  const eng = new MasterEngine(C, {
    send: (m, to) => { if (net) net.send(m, to); },
    onChange: () => { save(); stage.dirty = true; },
    onPlayers: () => { renderPlayers(); if (preview) renderBanner(); }, onMove: () => { stage.dirty = true; }
  });

  window.__dbgM = { C: () => C, eng };
  /* ---------- estrutura da tela ---------- */
  const cv = h('canvas', { class: 'stage' });
  const header = h('header', { id: 'top' }), toolsEl = h('aside', { id: 'tools' }), optBar = h('div', { id: 'optbar' });
  const panel = h('aside', { id: 'panel' }), footer = h('footer', { id: 'areasbar' });
  const empty = h('div', { class: 'emptystate' });
  const banner = h('div', { class: 'banner', hidden: true });
  let pv = { type: 'all', id: null }; // ponto de vista da pré-visualização: todos os jogadores | um jogador | "como se alguém estivesse na área X"
  const pvOpt = () => pv.type === 'char' && C.characters[pv.id] ? { char: pv.id } : pv.type === 'area' && C.areas.some(a => a.id === pv.id) ? { area: pv.id } : null;
  function renderBanner() {
    banner.innerHTML = '';
    const chars = Object.values(C.characters), opts = [['all', 'Todos os jogadores']].concat(chars.map(c => ['c:' + c.id, '👤 ' + c.name]), C.areas.map(a => ['a:' + a.id, '📍 Como se alguém estivesse em "' + a.name + '"' + (a.reveal === 'hidden' ? ' (oculta)' : '')]));
    const cur = pv.type === 'char' ? 'c:' + pv.id : pv.type === 'area' ? 'a:' + pv.id : 'all';
    const sel_ = h('select', { value: cur, onchange: e => { const v = e.target.value; pv = v === 'all' ? { type: 'all', id: null } : { type: v[0] === 'c' ? 'char' : 'area', id: v.slice(2) }; renderBanner(); focusPreview(); stage.dirty = true; } }, opts.map(o => h('option', { value: o[0] }, o[1])));
    const vs = visibleAreaSet(C, pvOpt() || {}), n = C.areas.filter(a => vs.has(a.id)).length;
    banner.append(h('span', {}, 'Visão do jogador · '), sel_, h('span', { class: 'muted sm' }, n ? n + ' área(s) visível(is)' : 'nenhuma área visível — ninguém está em uma área revelada'), h('button', { class: 'btn small', onclick: () => focusPreview() }, '⌖ Ir até lá'), h('button', { class: 'btn small', onclick: () => setPreview(false) }, 'Voltar ao editor'));
  }
  function focusPreview() {
    const vs = visibleAreaSet(C, pvOpt() || {}); const p = pvOpt();
    if (p && p.char) { const ch = C.characters[p.char]; if (ch) { stage.centerOn(ch.x, ch.y); return; } }
    const as = C.areas.filter(a => vs.has(a.id)); if (as.length) { const a = as[0]; stage.focusRect(a.x - 40, a.y - 40, a.w + 80, a.h + 80, 20); }
  }
  const stageWrap = h('main', { id: 'stagewrap' }, cv, banner, empty);
  root.append(h('div', { id: 'app' }, header, toolsEl, h('div', { id: 'center' }, optBar, stageWrap), panel, footer));
  const stage = new Stage(cv);

  /* ---------- persistência / histórico ---------- */
  let saveT = null;
  let cloudState = 'saved', cloudDirty = false;
  async function cloudSave() {
    if (!cloudCamp || !cloudDirty) return; cloudDirty = false; cloudState = 'saving'; paintCloud();
    try { await Cloud.saveCampaign(cloudCamp.row.id, C, Assets.data); cloudState = cloudDirty ? 'saving' : 'saved'; }
    catch (e) { cloudDirty = true; if (cloudState !== 'error') toast('Não consegui salvar na nuvem: ' + friendlyAuthError(e), 4500); cloudState = 'error'; }
    paintCloud();
  }
  function paintCloud() { const el = $('#cloudstate'); if (el) { el.textContent = cloudState === 'saving' ? '☁ salvando…' : cloudState === 'error' ? '☁ erro ao salvar' : '☁ salvo'; el.className = 'cloudstate ' + cloudState; } }
  function save() {
    clearTimeout(saveT);
    if (cloudCamp) { cloudDirty = true; if (cloudState === 'saved') { cloudState = 'saving'; paintCloud(); } saveT = setTimeout(cloudSave, 2500); }
    else saveT = setTimeout(() => DB.set('campaign', { campaign: C, assets: Assets.data }), 700);
  }
  async function leaveToHome(next) {
    clearTimeout(saveT); if (cloudCamp) { cloudDirty = true; await cloudSave(); if (cloudState === 'error') { toast('Não saiu: não consegui salvar. Tente de novo.', 4000); return; } }
    else DB.set('campaign', { campaign: C, assets: Assets.data });
    if (net) stopSession(); stage.destroy(); APP.guard = null; (typeof next === 'function' ? next : goHome)();
  }
  /* o logo, o menu do perfil e "Sair" passam por aqui: salva e avisa se a sessão está ao vivo */
  APP.guard = go => {
    const run = () => leaveToHome(go);
    if (net && eng.live) askConfirm('A sessão está ao vivo. Sair agora desconecta os jogadores. Salvar e sair mesmo assim?', run, 'Salvar e sair'); else run();
  };
  function snap() { return JSON.stringify(Object.assign({}, C, { characters: undefined })); }
  function pushHist() { const s = snap(); if (hist[hist.length - 1] !== s) { hist.push(s); if (hist.length > 60) hist.shift(); redo = []; } }
  function restore(s) { const o = JSON.parse(s), chars = C.characters; Object.assign(C, o); C.characters = chars; sel = sel.filter(x => findObj(x)); changed(); refreshAll(); }
  function undo() { let s; do { s = hist.pop(); } while (s !== undefined && s === snap() && hist.length); if (s === undefined) return; redo.push(snap()); restore(s); }
  function redoIt() { const s = redo.pop(); if (!s) return; hist.push(snap()); restore(s); }
  function changed(o) { stage.dirty = true; save(); eng.soon(); if (o && o.tokens) eng.pos(); }

  /* ---------- helpers de objetos ---------- */
  const LISTS = { area: () => C.areas, el: () => C.elements, wall: () => C.walls, zone: () => C.zones, fog: () => C.fog, light: () => C.lights, creature: () => C.creatures };
  const findObj = s => s.t === 'char' ? C.characters[s.id] : (LISTS[s.t] ? LISTS[s.t]().find(o => o.id === s.id) : null);
  const isSel = (t, id) => sel.some(s => s.t === t && s.id === id);
  const typeName = { area: 'Área', el: 'Elemento', wall: 'Parede', zone: 'Zona', fog: 'Névoa', light: 'Luz', creature: 'Criatura', char: 'Jogador' };
  const snapV = v => C.snap && !altKey ? Math.round(v / (C.grid / 2)) * (C.grid / 2) : v;
  const snapC = v => C.snap && !altKey ? snapToken(C, v) : v;
  const areaOf = (x, y) => areaAtPoint(C.areas, x, y);
  const G = () => C.grid;
  const rnd32 = () => (Math.random() * 4294967295) | 0;
  function addEl(kind, x, y, w, hh, extra) { const e = Object.assign({ id: uid('e'), kind, x, y, w, h: hh, rot: 0, flip: false, color: null, alpha: 1, seed: rnd32(), locked: false }, extra || {}); C.elements.push(e); return e; }
  function addWall(x1, y1, x2, y2) { const w = { id: uid('w'), x1, y1, x2, y2, thick: opt.wallThick, color: opt.wallColor }; C.walls.push(w); return w; }
  function addZone(x, y, w, hh) { const z = { id: uid('z'), name: '', x, y, w, h: hh, action: opt.zoneAction, verb: '', targetX: null, targetY: null, targetArea: null, lightIds: [], locked: false, on: true }; C.zones.push(z); return z; }
  function addFog(x, y, w, hh) { const f = { id: uid('f'), shape: opt.fogShape, x, y, w, h: hh, opacity: opt.fogOpacity, soft: opt.fogSoft, color: '#8a8a8a', on: true }; C.fog.push(f); return f; }
  function addLight(x, y) { const l = { id: uid('l'), kind: opt.lightKind, x, y, r: opt.lightR * G(), color: opt.lightColor, intensity: opt.lightInt, dir: opt.lightDir, spread: opt.lightSpread, on: true, flicker: opt.lightFlicker }; C.lights.push(l); return l; }
  function setOptKind(k) { const d = lightDefaults(k, G()); opt.lightKind = k; opt.lightR = d.r / G(); opt.lightColor = d.color; opt.lightInt = d.intensity; opt.lightDir = d.dir; opt.lightSpread = d.spread; opt.lightFlicker = d.flicker; }
  function addCreature(x, y) { const n = newCreature(x, y); n.name = 'Criatura ' + (C.creatures.length + 1); C.creatures.push(n); return n; }
  function addAreaObj(x, y, w, hh, extra) { const a = newArea(C, x, y, w, hh, extra); C.areas.push(a); return a; }
  function select(list) { sel = list; refreshAll(); stage.dirty = true; if (list.length) { if (tab !== 'inspect' && tab !== 'players') { /* mantém */ } } }
  function selectAndInspect(list) { sel = list; if (tool === 'element') tool = 'select'; if (list.length) tab = 'inspect'; refreshAll(); stage.dirty = true; }
  function deleteSel() {
    if (!sel.length) return; pushHist();
    for (const s of sel) {
      if (s.t === 'char') { const cx = C.characters[s.id]; if (net && cx && !cx.pc) net.send({ t: 'kick' }, s.id); delete C.characters[s.id]; if (cx && !cx.pc) delete eng.players[s.id]; }
      else { const L = LISTS[s.t](); const i = L.findIndex(o => o.id === s.id); if (i >= 0) L.splice(i, 1); }
    }
    sel = []; changed(); eng.broadcast(); refreshAll();
  }
  function duplicateSel() {
    if (!sel.length) return; pushHist(); const out = [], off = G() / 2;
    for (const s of sel) {
      if (s.t === 'char') continue; const o = findObj(s); if (!o) continue; const c = JSON.parse(JSON.stringify(o)); c.id = uid(s.t[0]);
      if ('x' in c) { c.x += off; c.y += off; } if ('x1' in c) { c.x1 += off; c.x2 += off; c.y1 += off; c.y2 += off; } if (s.t === 'el') c.seed = rnd32(); if (c.name && s.t !== 'area') c.name += ' (cópia)';
      LISTS[s.t]().push(c); out.push({ t: s.t, id: c.id });
    }
    sel = out; changed(); refreshAll();
  }
  function focusObj(s) {
    const o = findObj(s); if (!o) return;
    if ('w' in o) stage.focusRect(o.x - 80, o.y - 80, o.w + 160, o.h + 160, 40);
    else if (s.t === 'wall') stage.centerOn((o.x1 + o.x2) / 2, (o.y1 + o.y2) / 2); else stage.centerOn(o.x, o.y);
  }
  function fitAll() {
    if (!C.areas.length) { stage.centerOn(0, 0, 1); return; }
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const a of C.areas) { x0 = Math.min(x0, a.x); y0 = Math.min(y0, a.y); x1 = Math.max(x1, a.x + a.w); y1 = Math.max(y1, a.y + a.h); }
    stage.focusRect(x0, y0, x1 - x0, y1 - y0, 60);
  }

  /* ---------- desenho ---------- */
  stage.drawFn = (ctx, W, H, dpr, t, dark) => {
    let scene, o;
    if (preview) { const v = buildView(C, pvOpt()); scene = { grid: v.grid, showGrid: v.showGrid, tokenScale: v.tokenScale, areas: v.areas, elements: v.elements, walls: v.walls, zones: [], fog: v.fog, lights: v.lights, tokens: v.tokens }; o = { master: false, time: t, dark, ownId: pv.type === 'char' ? pv.id : null }; }
    else { scene = masterScene(C); o = { master: true, time: t, dark, layers, overlay: drawOverlay }; }
    o.base = stage.base; o.reuse = stage.reuse;
    renderScene(ctx, W, H, dpr, scene, stage.cam, o);
    return sceneAnimated(scene);
  };
  const boundsType = t => (t === 'char' || t === 'creature' || t === 'wall' || t === 'light') ? t : 'rect';
  function drawOverlay(ctx, z) {
    const ui = 1 / z;
    for (const s of sel) { const o = findObj(s); if (!o) continue; drawSelection(ctx, objBounds(boundsType(s.t), o, G()), z, sel.length === 1 && s.t === 'el'); }
    if (drag && drag.mode === 'rect') {
      const r = rectOf(drag.start, drag.cur); ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.strokeStyle = '#fff'; ctx.setLineDash([6 * ui, 4 * ui]); ctx.lineWidth = 1.5 * ui;
      if (tool === 'fog' && opt.fogShape === 'ellipse') { ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, r.y + r.h / 2, r.w / 2, r.h / 2, 0, 0, 6.28); ctx.fill(); ctx.stroke(); } else { ctx.fillRect(r.x, r.y, r.w, r.h); ctx.strokeRect(r.x, r.y, r.w, r.h); }
      ctx.setLineDash([]); ctx.fillStyle = '#fff'; ctx.font = 12 * ui + 'px system-ui'; ctx.fillText((r.w / G()).toFixed(1) + ' × ' + (r.h / G()).toFixed(1) + ' células', r.x + 4 * ui, r.y + r.h + 14 * ui); ctx.restore();
    }
    if (tool === 'element' && cursor && !preview) {
      const def = CATALOG[catSel]; if (def) {
        let r; if (drag && drag.mode === 'place' && drag.sized) r = rectOf(drag.start, drag.cur); else r = { x: snapV(cursor[0] - def.cw * G() / 2), y: snapV(cursor[1] - def.ch * G() / 2), w: def.cw * G(), h: def.ch * G() };
        ctx.save(); ctx.globalAlpha = .6; drawElement(ctx, { kind: catSel, x: r.x, y: r.y, w: r.w, h: r.h, rot: 0, seed: 7, color: null, alpha: 1 }, G(), 0, z * stage.dpr); ctx.restore();
        ctx.save(); ctx.strokeStyle = '#ff4d5a'; ctx.setLineDash([5 * ui, 4 * ui]); ctx.lineWidth = 1.2 * ui; ctx.strokeRect(r.x, r.y, r.w, r.h); ctx.restore();
      }
    }
    if (tool === 'wall' && wallLast && cursor) { ctx.save(); ctx.strokeStyle = '#ff4d5a'; ctx.lineWidth = opt.wallThick; ctx.globalAlpha = .6; ctx.beginPath(); ctx.moveTo(wallLast[0], wallLast[1]); ctx.lineTo(snapV(cursor[0]), snapV(cursor[1])); ctx.stroke(); ctx.restore(); }
    if ((tool === 'light') && cursor) {
      const px = snapV(cursor[0]), py = snapV(cursor[1]), lp = { id: '_', kind: opt.lightKind, x: px, y: py, r: opt.lightR * G(), color: opt.lightColor, intensity: opt.lightInt, dir: opt.lightDir, spread: opt.lightSpread, on: true, flicker: false };
      ctx.save(); ctx.globalAlpha = .75; ctx.globalCompositeOperation = 'screen'; lightPaint(ctx, lp, lp.intensity, lightGlowStops(lp.color), 'add'); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = .8; drawLightSprite(ctx, lp, G(), 0, z * stage.dpr); ctx.restore();
      ctx.save(); ctx.strokeStyle = opt.lightColor; ctx.setLineDash([6 * ui, 5 * ui]); ctx.lineWidth = 1.5 * ui; ctx.beginPath();
      if (lp.spread < 359) { const d = lp.dir * Math.PI / 180, h2 = lp.spread / 2 * Math.PI / 180; ctx.moveTo(px, py); ctx.arc(px, py, lp.r, d - h2, d + h2); ctx.closePath(); } else ctx.arc(px, py, lp.r, 0, 6.28);
      ctx.stroke(); ctx.restore();
    }
    if (pickTarget) { ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.font = '600 ' + 13 * ui + 'px system-ui'; const w = ctx.measureText('Clique no destino da zona').width; if (cursor) { ctx.fillText('Clique no destino da zona', cursor[0] + 12 * ui, cursor[1] - 10 * ui); } ctx.restore(); }
  }
  function rectOf(a, b) { return { x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), w: Math.abs(a[0] - b[0]), h: Math.abs(a[1] - b[1]) }; }

  /* ---------- seleção por clique ---------- */
  function hitsAt(w) {
    const z = stage.cam.z, g = G(), out = [], tol = 6 / z;
    for (const ch of Object.values(C.characters)) if (dist(w[0], w[1], ch.x, ch.y) <= (ch.size || 1) * g / 2 + 3 / z) out.push({ t: 'char', id: ch.id });
    for (let i = C.creatures.length - 1; i >= 0; i--) { const n = C.creatures[i]; if (dist(w[0], w[1], n.x, n.y) <= (n.size || 1) * g / 2 + 3 / z) out.push({ t: 'creature', id: n.id }); }
    if (layers.lights) for (const l of C.lights) if (dist(w[0], w[1], l.x, l.y) <= 13 / z) out.push({ t: 'light', id: l.id });
    if (layers.zones) for (let i = C.zones.length - 1; i >= 0; i--) { const q = C.zones[i]; if (inR(w[0], w[1], q)) out.push({ t: 'zone', id: q.id }); }
    for (let i = C.elements.length - 1; i >= 0; i--) {
      const e = C.elements[i]; if (e.locked) continue;
      const [lx, ly] = rotPoint(w[0], w[1], e.x + e.w / 2, e.y + e.h / 2, e.rot || 0);
      if (lx >= e.x - tol && lx <= e.x + e.w + tol && ly >= e.y - tol && ly <= e.y + e.h + tol) out.push({ t: 'el', id: e.id });
    }
    for (const q of C.walls) if (segDist(w[0], w[1], q.x1, q.y1, q.x2, q.y2) <= (q.thick || 10) / 2 + 5 / z) out.push({ t: 'wall', id: q.id });
    if (layers.fog) for (let i = C.fog.length - 1; i >= 0; i--) {
      const f = C.fog[i]; let inside = inR(w[0], w[1], f);
      if (inside && f.shape === 'ellipse') { const nx = (w[0] - f.x - f.w / 2) / (f.w / 2), ny = (w[1] - f.y - f.h / 2) / (f.h / 2); inside = nx * nx + ny * ny <= 1; }
      if (inside) out.push({ t: 'fog', id: f.id });
    }
    for (let i = C.areas.length - 1; i >= 0; i--) {
      const a = C.areas[i], inLabel = w[0] >= a.x && w[0] <= a.x + 150 / z && w[1] >= a.y - 20 / z && w[1] <= a.y;
      const nearEdge = inR(w[0], w[1], { x: a.x - tol, y: a.y - tol, w: a.w + 2 * tol, h: a.h + 2 * tol }) && !inR(w[0], w[1], { x: a.x + tol, y: a.y + tol, w: a.w - 2 * tol, h: a.h - 2 * tol });
      if (inLabel || nearEdge) out.push({ t: 'area', id: a.id });
    }
    return out;
  }
  function handleAt(px, py) { // px,py em coordenadas de mundo
    if (sel.length !== 1) return null; const s = sel[0], o = findObj(s); if (!o) return null;
    const z = stage.cam.z, r = 9 / z;
    if (s.t === 'wall') { if (dist(px, py, o.x1, o.y1) < r) return { k: 'seg', i: 1 }; if (dist(px, py, o.x2, o.y2) < r) return { k: 'seg', i: 2 }; return null; }
    if (s.t === 'light') { const hs = lightHandles(objBounds('light', o, G())); for (const k of ['spr', 'dir', 'rad']) { const hp = hs.find(q => q.k === k); if (hp && dist(px, py, hp.x, hp.y) < r) return { k }; } return null; }
    if (s.t === 'char' || s.t === 'creature') return null;
    const cx = o.x + o.w / 2, cy = o.y + o.h / 2, rot = (o.rot || 0) * Math.PI / 180, co = Math.cos(rot), si = Math.sin(rot);
    const toW = (lx, ly) => [cx + lx * co - ly * si, cy + lx * si + ly * co];
    if (s.t === 'el') { const p = toW(0, -o.h / 2 - 24 / z); if (dist(px, py, p[0], p[1]) < r) return { k: 'rot' }; }
    for (const hp of handlePoints({ w: o.w, h: o.h })) { const p = toW(hp.lx, hp.ly); if (dist(px, py, p[0], p[1]) < r) return { k: 'size', id: hp.id }; }
    return null;
  }

  /* ---------- ponteiro ---------- */
  const ptrs = new Map(); let pinch = null;
  cv.addEventListener('contextmenu', e => { e.preventDefault(); if (!drag && tool !== 'select' && tool !== 'hand') setTool('select'); });
  cv.addEventListener('wheel', e => { e.preventDefault(); stage.zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : .89); }, { passive: false });
  cv.addEventListener('pointerdown', e => {
    cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); altKey = e.altKey;
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 }; drag = null; return; }
    onDown(e);
  });
  cv.addEventListener('pointermove', e => {
    altKey = e.altKey; if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && ptrs.size === 2) {
      const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
      stage.cam.x -= (cx - pinch.cx) / stage.cam.z; stage.cam.y -= (cy - pinch.cy) / stage.cam.z; stage.zoomAt(cx, cy, d / pinch.d); pinch = { d, cx, cy }; return;
    }
    cursor = stage.toWorld(e.clientX, e.clientY);
    if (drag) onMove(e); else if (['element', 'wall', 'light'].includes(tool) || pickTarget) stage.dirty = true;
  });
  const upH = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (drag) onUp(e); };
  cv.addEventListener('pointerup', upH); cv.addEventListener('pointercancel', upH);
  cv.addEventListener('dblclick', () => { if (tool === 'wall') { wallLast = null; stage.dirty = true; } });
  cv.addEventListener('pointerleave', () => { cursor = null; stage.dirty = true; });

  function onDown(e) {
    const w = stage.toWorld(e.clientX, e.clientY); cursor = w;
    const panning = e.button === 1 || e.button === 2 || spaceDown || tool === 'hand' || preview;
    if (panning) { drag = { mode: 'pan', x: e.clientX, y: e.clientY, cx: stage.cam.x, cy: stage.cam.y }; return; }
    if (pickTarget) {
      const z = C.zones.find(q => q.id === pickTarget);
      if (z) { pushHist(); z.targetX = snapC(w[0]); z.targetY = snapC(w[1]); const a = areaOf(z.targetX, z.targetY); z.targetArea = a ? a.id : null; toast('Destino definido' + (a ? ' em "' + a.name + '"' : ' (fora de qualquer área!)')); changed(); }
      pickTarget = null; cv.style.cursor = ''; buildInspector(); return;
    }
    switch (tool) {
      case 'select': {
        const hh = handleAt(w[0], w[1]);
        if (hh) { pushHist(); const o = findObj(sel[0]); drag = { mode: 'handle', h: hh, orig: JSON.parse(JSON.stringify(o)), s: sel[0] }; return; }
        const hits = hitsAt(w); let hit = hits[0];
        if (e.altKey && hits.length > 1) { const cur = hits.findIndex(q => isSel(q.t, q.id)); hit = hits[(cur + 1) % hits.length]; }
        if (hit) {
          if (e.shiftKey) { if (isSel(hit.t, hit.id)) sel = sel.filter(q => !(q.t === hit.t && q.id === hit.id)); else sel.push(hit); }
          else if (!isSel(hit.t, hit.id)) sel = [hit];
          pushHist(); tab = (tab === 'catalog' || tab === 'objects') ? 'inspect' : tab; refreshAll();
          drag = { mode: 'move', start: w, moved: false, orig: sel.map(s => { const o = findObj(s); return { s, v: JSON.parse(JSON.stringify(o)) }; }) };
        } else { if (sel.length) { sel = []; refreshAll(); } drag = { mode: 'pan', x: e.clientX, y: e.clientY, cx: stage.cam.x, cy: stage.cam.y }; }
        stage.dirty = true; break;
      }
      case 'area': case 'zone': case 'fog': drag = { mode: 'rect', start: [snapV(w[0]), snapV(w[1])], cur: [snapV(w[0]), snapV(w[1])] }; break;
      case 'element': drag = { mode: 'place', start: [snapV(w[0]), snapV(w[1])], cur: [snapV(w[0]), snapV(w[1])], sx: e.clientX, sy: e.clientY, sized: false }; break;
      case 'wall': {
        const p = [snapV(w[0]), snapV(w[1])]; pushHist();
        if (wallLast && (wallLast[0] !== p[0] || wallLast[1] !== p[1])) { addWall(wallLast[0], wallLast[1], p[0], p[1]); changed(); refreshLists(); }
        wallLast = p; stage.dirty = true; break;
      }
      case 'light': { pushHist(); const l = addLight(snapV(w[0]), snapV(w[1])); changed(); selectAndInspect([{ t: 'light', id: l.id }]); break; }
      case 'creature': { pushHist(); const n = addCreature(snapC(w[0]), snapC(w[1])); tool = 'select'; cv.style.cursor = ''; changed(); selectAndInspect([{ t: 'creature', id: n.id }]); break; }
    }
  }
  function onMove(e) {
    const w = stage.toWorld(e.clientX, e.clientY); cursor = w;
    if (drag.mode === 'pan') { stage.cam.x = drag.cx - (e.clientX - drag.x) / stage.cam.z; stage.cam.y = drag.cy - (e.clientY - drag.y) / stage.cam.z; stage.dirty = true; return; }
    if (drag.mode === 'rect') { drag.cur = [snapV(w[0]), snapV(w[1])]; stage.dirty = true; return; }
    if (drag.mode === 'place') { drag.cur = [snapV(w[0]), snapV(w[1])]; if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 8) drag.sized = true; stage.dirty = true; return; }
    if (drag.mode === 'move') {
      const dx = w[0] - drag.start[0], dy = w[1] - drag.start[1]; if (!drag.moved && Math.hypot(dx, dy) * stage.cam.z < 3) return; drag.moved = true;
      let tokMoved = false;
      for (const it of drag.orig) {
        const o = findObj(it.s); if (!o) continue; const v = it.v;
        if (it.s.t === 'char' || it.s.t === 'creature') { o.x = snapC(v.x + dx); o.y = snapC(v.y + dy); tokMoved = true; }
        else if (it.s.t === 'wall') { const sx = snapV(v.x1 + dx) - v.x1, sy = snapV(v.y1 + dy) - v.y1; o.x1 = v.x1 + sx; o.y1 = v.y1 + sy; o.x2 = v.x2 + sx; o.y2 = v.y2 + sy; }
        else { o.x = snapV(v.x + dx); o.y = snapV(v.y + dy); }
      }
      changed({ tokens: tokMoved }); return;
    }
    if (drag.mode === 'handle') { applyHandle(w); changed(); return; }
  }
  function applyHandle(w) {
    const o = findObj(drag.s), v = drag.orig, hh = drag.h; if (!o) return;
    if (hh.k === 'seg') { const x = snapV(w[0]), y = snapV(w[1]); if (hh.i === 1) { o.x1 = x; o.y1 = y; } else { o.x2 = x; o.y2 = y; } }
    else if (hh.k === 'rad') { o.r = Math.max(G() * .5, dist(w[0], w[1], o.x, o.y)); }
    else if (hh.k === 'dir') { let a = Math.atan2(w[1] - o.y, w[0] - o.x) * 180 / Math.PI; if (C.snap && !altKey) a = Math.round(a / 15) * 15; o.dir = ((Math.round(a) % 360) + 360) % 360; }
    else if (hh.k === 'spr') { const a = Math.atan2(w[1] - o.y, w[0] - o.x) * 180 / Math.PI; const df = Math.abs(((a - (o.dir || 0)) % 360 + 540) % 360 - 180); let sp = df * 2; if (C.snap && !altKey) sp = Math.round(sp / 5) * 5; o.spread = sp >= 340 ? 360 : clamp(sp, 10, 340); }
    else if (hh.k === 'rot') {
      const cx = v.x + v.w / 2, cy = v.y + v.h / 2; let a = Math.atan2(w[1] - cy, w[0] - cx) * 180 / Math.PI + 90; if (C.snap && !altKey) a = Math.round(a / 15) * 15; o.rot = ((a % 360) + 360) % 360;
    } else if (hh.k === 'size') {
      const cx = v.x + v.w / 2, cy = v.y + v.h / 2, rot = v.rot || 0, p = rotPoint(w[0], w[1], cx, cy, rot), id = hh.id, mn = G() * .25;
      let L = v.x, R = v.x + v.w, T = v.y, B = v.y + v.h; const sx = snapV(p[0]), sy = snapV(p[1]);
      if (id.includes('w')) L = Math.min(sx, R - mn); if (id.includes('e')) R = Math.max(sx, L + mn);
      if (id.includes('n')) T = Math.min(sy, B - mn); if (id.includes('s')) B = Math.max(sy, T + mn);
      const ncx = (L + R) / 2, ncy = (T + B) / 2, wc = rotPoint(ncx, ncy, cx, cy, -rot);
      o.w = R - L; o.h = B - T; o.x = wc[0] - o.w / 2; o.y = wc[1] - o.h / 2;
    }
  }
  function onUp(e) {
    const d = drag; drag = null; const g = G();
    if (d.mode === 'rect') {
      const r = rectOf(d.start, d.cur); pushHist();
      if (tool === 'area') {
        if (r.w < g * 2 || r.h < g * 2) { r.x = d.start[0]; r.y = d.start[1]; r.w = 14 * g; r.h = 10 * g; }
        const a = addAreaObj(r.x, r.y, r.w, r.h); changed(); setTool('select'); selectAndInspect([{ t: 'area', id: a.id }]);
      } else if (tool === 'zone') {
        if (r.w < g * .5 || r.h < g * .5) { r.x = d.start[0]; r.y = d.start[1]; r.w = 2 * g; r.h = 2 * g; }
        const z = addZone(r.x, r.y, r.w, r.h); changed(); setTool('select'); selectAndInspect([{ t: 'zone', id: z.id }]);
      } else if (tool === 'fog') {
        if (r.w < g * .5 || r.h < g * .5) { r.x = d.start[0] - 2 * g; r.y = d.start[1] - 2 * g; r.w = 4 * g; r.h = 4 * g; }
        const f = addFog(r.x, r.y, r.w, r.h); changed(); setTool('select'); selectAndInspect([{ t: 'fog', id: f.id }]);
      }
      return;
    }
    if (d.mode === 'place') {
      const def = CATALOG[catSel]; if (!def) return; pushHist(); let r;
      if (d.sized) { r = rectOf(d.start, d.cur); if (r.w < g * .15 || r.h < g * .15) d.sized = false; }
      if (!d.sized) r = { x: snapV(d.start[0] - def.cw * g / 2), y: snapV(d.start[1] - def.ch * g / 2), w: def.cw * g, h: def.ch * g };
      const el = addEl(catSel, r.x, r.y, r.w, r.h); changed(); sel = [{ t: 'el', id: el.id }]; refreshLists(); return;
    }
    if (d.mode === 'move' || d.mode === 'handle') { changed({ tokens: true }); eng.broadcast(); if (d.mode === 'handle' || d.moved) { buildInspector(); refreshLists(); } else buildInspector(); }
  }

  /* ---------- teclado ---------- */
  const keydown = e => {
    if (!document.body.contains(cv)) { removeEventListener('keydown', keydown); removeEventListener('keyup', keyup); return; }
    const typing = /INPUT|TEXTAREA|SELECT/.test((e.target.tagName || '')); if (typing && e.key !== 'Escape') return;
    const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
    if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? redoIt() : undo(); return; }
    if (mod && k === 'y') { e.preventDefault(); redoIt(); return; }
    if (mod && k === 'd') { e.preventDefault(); duplicateSel(); return; }
    if (k === ' ') { spaceDown = true; e.preventDefault(); return; }
    if (k === 'escape') { wallLast = null; pickTarget = null; if (tool !== 'select') setTool('select'); else { sel = []; refreshAll(); } stage.dirty = true; return; }
    if (k === 'enter' && tool === 'wall') { wallLast = null; stage.dirty = true; return; }
    if (k === 'delete' || k === 'backspace') { e.preventDefault(); deleteSel(); return; }
    const wasd = !mod && k.length === 1 && 'wasd'.includes(k) && sel.some(x => x.t === 'char' || x.t === 'creature'); // com um personagem/criatura selecionado, WASD move (sem selecionar, continuam os atalhos de ferramenta)
    if ((k.startsWith('arrow') || wasd) && sel.length) {
      e.preventDefault(); pushHist(); const st = e.shiftKey ? G() : G() / 2, L = k === 'arrowleft' || k === 'a', R = k === 'arrowright' || k === 'd', U = k === 'arrowup' || k === 'w', Dn = k === 'arrowdown' || k === 's', dx = L ? -st : R ? st : 0, dy = U ? -st : Dn ? st : 0;
      for (const s of sel) { const o = findObj(s); if (!o) continue; if ('x1' in o) { o.x1 += dx; o.x2 += dx; o.y1 += dy; o.y2 += dy; } else { o.x += dx; o.y += dy; } }
      changed({ tokens: true }); buildInspector(); return;
    }
    const map = { v: 'select', h: 'hand', a: 'area', e: 'element', w: 'wall', z: 'zone', f: 'fog', l: 'light', c: 'creature' };
    if (!mod && map[k]) setTool(map[k]);
  };
  const keyup = e => { if (e.key === ' ') spaceDown = false; };
  addEventListener('keydown', keydown); addEventListener('keyup', keyup);

  /* ---------- ferramentas / barras ---------- */
  const TOOLS = [['select', '↖', 'Selecionar (V)'], ['hand', '✥', 'Mover mapa (H)'], ['area', '⬚', 'Desenhar área / anexo (A)'], ['element', '▣', 'Colocar elemento (E)'], ['wall', '╱', 'Parede (W)'], ['zone', '⇆', 'Zona interativa (Z)'], ['fog', '☁', 'Névoa / área cinzenta (F)'], ['light', '☀', 'Luz (L)'], ['creature', '☠', 'Criatura (C)']];
  function setTool(t) {
    tool = t; wallLast = null; pickTarget = null; drag = null; if (t === 'element') { tab = 'catalog'; } else if (tab === 'catalog' && false) { /* mantém */ } refreshAll(); panel.classList.toggle('armed', t === 'element');
    cv.style.cursor = t === 'hand' ? 'grab' : t === 'select' ? '' : 'crosshair'; stage.dirty = true;
  }
  function renderTools() {
    toolsEl.innerHTML = ''; TOOLS.forEach(([id, ic, tip]) => toolsEl.append(h('button', { class: 'tool' + (tool === id ? ' on' : ''), title: tip, onclick: () => setTool(id) }, h('span', { class: 'ic' }, ic), h('span', { class: 'tl' }, tip.replace(/ \(.\)$/, '').split(' ')[0]))));
    toolsEl.append(h('div', { class: 'sp' }), h('button', { class: 'tool', title: 'Importar imagem como mapa', onclick: () => importMapImage() }, h('span', { class: 'ic' }, '🖼'), h('span', { class: 'tl' }, 'Imagem')));
  }
  function renderOptions() {
    optBar.innerHTML = ''; const o = [];
    if (tool === 'element') { const d = CATALOG[catSel]; o.push(h('span', {}, 'Elemento: ', h('b', {}, d ? d.name : '—')), h('span', { class: 'muted' }, 'Clique = colocar · Arraste = definir tamanho · botão direito ou Esc = sair'), h('button', { class: 'btn small optbar-x', onclick: () => setTool('select') }, '✕ Concluir')); }
    else if (tool === 'wall') { o.push(h('label', {}, 'Espessura ', h('input', { type: 'range', min: 4, max: 24, step: 1, value: opt.wallThick, oninput: e => opt.wallThick = +e.target.value })), h('span', { class: 'muted' }, 'Clique para cada ponto · duplo clique/Enter termina')); }
    else if (tool === 'fog') { o.push(h('label', {}, 'Forma ', h('select', { onchange: e => opt.fogShape = e.target.value, value: opt.fogShape }, h('option', { value: 'rect' }, 'Retângulo'), h('option', { value: 'ellipse' }, 'Elipse'))), h('label', {}, 'Opacidade ', h('input', { type: 'range', min: .1, max: 1, step: .05, value: opt.fogOpacity, oninput: e => opt.fogOpacity = +e.target.value })), h('span', { class: 'muted' }, 'Arraste para criar uma área cinzenta')); }
    else if (tool === 'zone') { o.push(h('label', {}, 'Ação ', h('select', { onchange: e => opt.zoneAction = e.target.value, value: opt.zoneAction }, h('option', { value: 'enter' }, 'Entrar / Sair (teleporta)'), h('option', { value: 'light' }, 'Ligar / apagar luz'))), h('span', { class: 'muted' }, 'Arraste um retângulo sobre a porta, casa, escada…')); }
    else if (tool === 'light') {
      const sl = (lbl, min, max, step, key, fmt) => { const out = h('b', {}, fmt(opt[key])); return h('label', {}, lbl + ' ', h('input', { type: 'range', min, max, step, value: opt[key], oninput: e => { opt[key] = +e.target.value; out.textContent = fmt(opt[key]); stage.dirty = true; } }), out); };
      o.push(h('span', { class: 'chips' }, LIGHT_ORDER.map(k => h('button', { class: 'chip sm' + (opt.lightKind === k ? ' on' : ''), title: LIGHT_TYPES[k].note || LIGHT_TYPES[k].name, onclick: () => { setOptKind(k); renderOptions(); stage.dirty = true; } }, LIGHT_TYPES[k].name))),
        sl('Raio', 1, 14, .5, 'lightR', v => v + ' cél.'), sl('Intensidade', .1, 1, .05, 'lightInt', v => Math.round(v * 100) + '%'), sl('Direção', 0, 345, 15, 'lightDir', v => v + '°'), sl('Abertura', 15, 360, 15, 'lightSpread', v => v >= 360 ? '360° (todas)' : v + '°'),
        h('label', {}, 'Cor ', h('input', { type: 'color', value: opt.lightColor, oninput: e => { opt.lightColor = e.target.value; stage.dirty = true; } })),
        h('span', { class: 'muted' }, 'Clique para posicionar · a luz fura as áreas com "Escuridão"'));
    }
    else if (tool === 'area') o.push(h('span', { class: 'muted' }, 'Arraste para desenhar uma área (sala, anexo, interior de casa). Cada área é uma parte do mesmo mapa.'));
    else if (tool === 'creature') o.push(h('span', { class: 'muted' }, 'Clique para colocar. Criaturas nascem ocultas dos jogadores.'));
    else if (pickTarget) o.push(h('b', {}, 'Clique no mapa para definir o destino da zona'));
    if (o.length && tool !== 'element' && tool !== 'select' && tool !== 'hand') o.push(h('button', { class: 'btn small optbar-x', onclick: () => setTool('select') }, '✕ Concluir (Esc)'));
    optBar.hidden = !o.length; optBar.append(...o);
  }
  function renderHeader() {
    header.innerHTML = '';
    const nameIn = h('input', { type: 'text', class: 'cname', value: C.name, oninput: e => { C.name = e.target.value; save(); eng.soon(); } });
    const menuBtn = h('button', { class: 'btn small', onclick: () => popMenu(menuBtn, (cloudCamp ? [['← Início (salva e sai)', () => navHome()]] : (Cloud.user ? [['← Início', () => navHome()]] : [['← Início', () => navHome()]])).concat([
      ['Nova campanha', () => askConfirm('Começar uma campanha nova? A atual será apagada deste navegador (exporte antes se quiser guardar).', newCamp, 'Apagar e começar')],
      ['Exportar campanha (.json)', exportCamp], ['Importar campanha (.json)', importCamp], ['Enquadrar todo o mapa', fitAll]])) }, 'Campanha ▾');
    const chip = (k, label, tip) => h('button', { class: 'chip sm' + (layers[k] ? ' on' : ''), title: tip, onclick: () => { layers[k] = !layers[k]; stage.dirty = true; renderHeader(); } }, label);
    const live = !!(net && eng.live);
    header.append(
      brandLink(22),
      menuBtn, nameIn, cloudCamp ? h('span', { id: 'cloudstate', class: 'cloudstate ' + cloudState }, cloudState === 'saving' ? '☁ salvando…' : cloudState === 'error' ? '☁ erro ao salvar' : '☁ salvo') : null,
      h('button', { class: 'btn small', title: 'Desfazer (Ctrl+Z)', onclick: undo }, '↶'), h('button', { class: 'btn small', title: 'Refazer', onclick: redoIt }, '↷'),
      h('button', { class: 'chip sm' + (C.snap ? ' on' : ''), title: 'Alinhar à grade', onclick: () => { C.snap = !C.snap; save(); renderHeader(); } }, 'Imã'),
      h('button', { class: 'chip sm' + (C.showGrid ? ' on' : ''), title: 'Mostrar grade aos jogadores', onclick: () => { C.showGrid = !C.showGrid; changed(); renderHeader(); } }, 'Grade'),
      h('span', { class: 'sep' }), h('span', { class: 'muted sm' }, 'Ver:'), chip('areas', 'Áreas', 'Contornos das áreas'), chip('zones', 'Zonas', 'Zonas interativas'), chip('fog', 'Névoa', 'Névoas'), chip('lights', 'Luzes', 'Luzes'),
      h('span', { class: 'grow' }),
      h('button', { class: 'btn small' + (preview ? ' primary' : ''), onclick: () => setPreview(!preview) }, preview ? '◉ Visão do jogador' : '👁 Ver como jogador'),
      h('button', { class: 'btn small ' + (live ? 'live' : ''), onclick: () => { tab = 'session'; renderPanel(); } }, live ? '● Sessão ' + cfg.code : 'Iniciar sessão'),
      h('button', { class: 'btn small panel-toggle', onclick: () => panel.classList.toggle('open') }, '☰'));
  }
  function setPreview(on) {
    preview = on; banner.hidden = !on;
    if (on) { // sem jogadores e sem área sempre visível, o preview ficaria preto: começa "como se alguém estivesse" na área em foco
      const vs = visibleAreaSet(C); if (pv.type === 'all' && !vs.size && C.areas.length) { const c = stage.cam, a = areaAtPoint(C.areas, c.x + stage.cssW / 2 / c.z, c.y + stage.cssH / 2 / c.z) || C.areas[0]; pv = { type: 'area', id: a.id }; }
      renderBanner();
    }
    renderHeader(); renderEmpty(); stage.dirty = true;
  }

  /* ---------- barra de áreas ---------- */
  function renderAreasBar() {
    footer.innerHTML = '';
    footer.append(h('span', { class: 'muted sm' }, 'Áreas:'));
    for (const a of C.areas) footer.append(h('button', { class: 'chip' + (isSel('area', a.id) ? ' on' : ''), title: 'Clique: ir até a área · Duplo clique: editar', onclick: () => { focusObj({ t: 'area', id: a.id }); }, ondblclick: () => selectAndInspect([{ t: 'area', id: a.id }]) },
      (a.reveal === 'always' ? '◉ ' : a.reveal === 'hidden' ? '⊘ ' : '') + a.name));
    const addBtn = h('button', { class: 'chip add', onclick: () => popMenu(addBtn, [['A partir de uma imagem…', () => importMapImage()], ['Área em branco (anexo)…', newBlankArea], ['Desenhar no mapa…', () => setTool('area')]], true) }, '＋ Área / anexo');
    footer.append(addBtn);
  }
  async function newBlankArea() {
    const r = await mapDialog({ title: 'Novo mapa em branco', cw: 12, ch: 10, name: C.areas.length ? 'Anexo ' + C.areas.length : 'Mapa principal', ok: 'Criar mapa' }); if (!r) return;
    pushHist(); const a = addAreaObj(freeSpotX(C), 0, r.cw * G(), r.ch * G()); a.name = r.name || (C.areas.length === 1 ? 'Mapa principal' : 'Anexo ' + (C.areas.length - 1));
    changed(); eng.broadcast(); stage.focusRect(a.x - 80, a.y - 80, a.w + 160, a.h + 160, 40); selectAndInspect([{ t: 'area', id: a.id }]);
  }
  async function importMapImage(replaceArea) {
    const f = await pickFile(IMG_ACCEPT); if (!f) return; let img;
    try { img = await loadImgFile(f); } catch (e) { toast('Não consegui abrir a imagem: ' + (e && e.message || 'formato inválido')); return; }
    const cur = replaceArea && replaceArea.w ? { cw: Math.round(replaceArea.w / G() * 2) / 2, ch: Math.round(replaceArea.h / G() * 2) / 2 } : {};
    const r = await mapDialog({ title: replaceArea ? 'Trocar imagem do mapa' : 'Mapa a partir de imagem', img, cw: cur.cw, ch: cur.ch, name: replaceArea ? replaceArea.name : (f.name || 'Mapa').replace(/\.[^.]+$/, '').slice(0, 30), ok: replaceArea ? 'Aplicar' : 'Criar mapa' }); if (!r) return;
    try {
      toast('Processando imagem…'); const m = await processMapImage(img, r.cw, r.ch, r), id = uid('m'); Assets.put(id, m.data); pushHist();
      if (replaceArea) { replaceArea.bg = id; replaceArea.w = r.cw * G(); replaceArea.h = r.ch * G(); replaceArea.smooth = !r.pixel; if (r.name) replaceArea.name = r.name; changed(); eng.broadcast(); buildInspector(); return; }
      const a = addAreaObj(freeSpotX(C), 0, r.cw * G(), r.ch * G(), { bg: id, smooth: !r.pixel, name: r.name || 'Mapa' });
      if (C.areas.length === 1 && !r.name) a.name = 'Mapa principal';
      changed(); eng.broadcast(); stage.focusRect(a.x - 40, a.y - 40, a.w + 80, a.h + 80, 20); selectAndInspect([{ t: 'area', id: a.id }]); toast('Mapa criado (' + r.cw + '×' + r.ch + ' blocos, ' + m.w + '×' + m.h + ' px, ' + Math.round(m.ppb) + ' px/bloco' + (m.original ? ', original' : '') + ').', 4500);
    } catch (e) { console.error(e); toast('Falha ao processar a imagem.'); }
  }

  /* ---------- campanha: nova / exportar / importar ---------- */
  function resetState() { sel = []; hist = []; redo = []; eng.setCampaign(C); eng.players = {}; refreshAll(); fitAll(); stage.dirty = true; }
  function newCamp() { Assets.clear(); const keep = C.characters; C = newCampaign(); C.characters = {}; Object.keys(keep).forEach(k => { const c = keep[k]; C.characters[k] = c; }); DB.set('campaign', { campaign: C, assets: {} }); resetState(); }
  function exportCamp() { downloadText((C.name || 'campanha').replace(/[^\w\-]+/g, '_') + '.tabletop.json', JSON.stringify({ app: 'tabletop', v: 1, campaign: Object.assign({}, C, { characters: {} }), assets: Assets.data })); }
  async function importCamp() {
    const f = await pickFile('.json,application/json'); if (!f) return;
    try {
      const o = JSON.parse(await f.text()); if (!o.campaign) throw 0; const keep = C.characters;
      Assets.clear(); for (const id in (o.assets || {})) Assets.data[id] = o.assets[id];
      C = Object.assign(newCampaign(), o.campaign); for (const k of ['areas', 'elements', 'walls', 'zones', 'fog', 'lights', 'creatures']) C[k] = C[k] || []; C.characters = keep;
      for (const ch of Object.values(C.characters)) if (ch.asset && !Assets.has(ch.asset)) ch.asset = ch.asset; save(); resetState(); eng.broadcast(); toast('Campanha importada.');
    } catch (e) { toast('Arquivo de campanha inválido.'); }
  }

  /* ---------- painel lateral ---------- */
  const tabs = [['catalog', 'Catálogo'], ['objects', 'Objetos'], ['inspect', 'Inspetor'], ['players', 'Jogadores'], ['session', 'Sessão']];
  const panelBody = h('div', { class: 'pbody' });
  function renderPanel() {
    panel.innerHTML = '';
    panel.append(h('div', { class: 'ptabs' }, tabs.map(([id, l]) => h('button', { class: 'ptab' + (tab === id ? ' on' : ''), onclick: () => { if (tool === 'element' && id !== 'catalog') { tool = 'select'; cv.style.cursor = ''; renderTools(); renderOptions(); stage.dirty = true; } tab = id; renderPanel(); } }, l))), panelBody);
    panelBody.innerHTML = '';
    if (tab === 'catalog') buildCatalog(); else if (tab === 'objects') buildObjects(); else if (tab === 'inspect') buildInspector(); else if (tab === 'players') renderPlayers(); else buildSession();
  }
  const thumbs = {};
  function thumbOf(def) {
    if (thumbs[def.id]) return thumbs[def.id];
    const S = 76, c = h('canvas', { width: S * 2, height: S * 2, style: 'width:' + S + 'px;height:' + S + 'px' }), x = c.getContext('2d'), g = 48;
    const ww = def.cw * g, hh = def.ch * g, sc = Math.min((S * 2 - 12) / ww, (S * 2 - 12) / hh, 2.4);
    x.fillStyle = '#1a1c21'; x.fillRect(0, 0, S * 2, S * 2); x.save(); x.translate((S * 2 - ww * sc) / 2, (S * 2 - hh * sc) / 2); x.scale(sc, sc);
    try { drawElement(x, { kind: def.id, x: 0, y: 0, w: ww, h: hh, rot: 0, seed: 11, color: null, alpha: 1 }, g, 450, sc * 2); } catch (e) { /* */ } x.restore();
    return thumbs[def.id] = c;
  }
  function buildCatalog() {
    const cats = catalogByCat();
    panelBody.append(
      h('div', { class: 'chips' }, cats.map(c => h('button', { class: 'chip sm' + (cat === c.id ? ' on' : ''), onclick: () => { cat = c.id; renderPanel(); } }, c.label)).concat(h('button', { class: 'chip sm' + (cat === 'lights' ? ' on' : ''), onclick: () => { cat = 'lights'; renderPanel(); } }, 'Luzes'))),
      cat === 'lights' ? h('div', { class: 'cgrid' }, LIGHT_ORDER.map(k => {
        const c = lightThumb(k), el = h('button', { class: 'citem' + (opt.lightKind === k && tool === 'light' ? ' on' : ''), title: LIGHT_TYPES[k].note || LIGHT_TYPES[k].name, onclick: () => { if (tool === 'light' && opt.lightKind === k) { setTool('select'); return; } setOptKind(k); setTool('light'); } }, h('canvas', { width: c.width, height: c.height, style: c.getAttribute('style') }), h('span', {}, LIGHT_TYPES[k].name));
        el.firstChild.getContext('2d').drawImage(c, 0, 0); return el;
      })) : h('div', { class: 'cgrid' }, (cats.find(c => c.id === cat) || cats[0]).items.map(d => {
        const c = thumbOf(d); const el = h('button', { class: 'citem' + (catSel === d.id && tool === 'element' ? ' on' : ''), title: d.name, onclick: () => { if (tool === 'element' && catSel === d.id) { setTool('select'); return; } catSel = d.id; setTool('element'); } }, h('canvas', { width: c.width, height: c.height, style: c.getAttribute('style') }), h('span', {}, d.name));
        el.firstChild.getContext('2d').drawImage(c, 0, 0); return el;
      })),
      h('div', { class: 'lbl' }, 'Mapas prontos — Ordem Paranormal'),
      h('div', { class: 'btncol' },
        h('button', { class: 'btn', onclick: () => loadTemplate('facility') }, '🏚 Base de contenção (celas, ala médica, laboratório, ritual)'),
        h('button', { class: 'btn', onclick: () => loadTemplate('island') }, '🏝 Vila da ilha (floresta, casas, névoa central)')),
      h('div', { class: 'lbl' }, 'Mapas prontos — D&D'),
      h('div', { class: 'btncol' }, Object.entries(DND_TEMPLATES).map(([k, t]) => h('button', { class: 'btn', title: t.note, onclick: () => loadTemplate(k) }, t.icon + ' ' + t.name))),
      h('p', { class: 'muted sm' }, 'Os modelos entram como uma área nova (anexo). Tudo neles é editável: mova, redimensione, troque cores.'));
  }
  function loadTemplate(name) {
    if (tool !== 'select') setTool('select'); pushHist(); const tf = name === 'facility' ? tplFacility : name === 'island' ? tplIsland : DND_TEMPLATES[name].fn;
    const a = tf(C, freeSpotX(C), 0, { addEl, addWall, addZone, addFog, addLight, addAreaObj, addCreature });
    changed(); eng.broadcast(); sel = [{ t: 'area', id: a.id }]; refreshAll(); stage.focusRect(a.x - 60, a.y - 60, a.w + 120, a.h + 120, 30); toast('Modelo adicionado como nova área. Tudo é editável.');
  }

  /* --- objetos --- */
  function buildObjects() {
    const sec = (title, list, t, label, extra) => {
      if (!list.length) return null;
      return h('div', { class: 'osec' }, h('div', { class: 'lbl' }, title + ' (' + list.length + ')'), list.map((o, i) => h('div', { class: 'orow' + (isSel(t, o.id) ? ' on' : ''), onclick: () => { selectAndInspect([{ t, id: o.id }]); focusObj({ t, id: o.id }); } },
        h('span', { class: 'on-name' }, label(o, i)), extra ? extra(o) : null)));
    };
    panelBody.append(
      sec('Áreas', C.areas, 'area', o => o.name),
      sec('Zonas interativas', C.zones, 'zone', (o, i) => (o.action === 'light' ? '💡 ' : '⇆ ') + (o.name || (o.verb || 'Zona') + ' ' + (i + 1)), o => h('button', { class: 'mini', title: 'Ligar/desligar zona', onclick: ev => { ev.stopPropagation(); pushHist(); o.on = o.on === false; changed(); renderPanel(); } }, o.on === false ? '○' : '●')),
      sec('Criaturas', C.creatures, 'creature', o => o.name, o => h('button', { class: 'mini', title: 'Mostrar/ocultar dos jogadores', onclick: ev => { ev.stopPropagation(); pushHist(); o.hidden = !o.hidden; changed(); eng.broadcast(); renderPanel(); } }, o.hidden ? '🙈' : '👁')),
      sec('Luzes', C.lights, 'light', (o, i) => LIGHT_TYPES[lightKind(o)].name + ' ' + (i + 1) + (areaOf(o.x, o.y) ? ' · ' + areaOf(o.x, o.y).name : ''), o => h('button', { class: 'mini', onclick: ev => { ev.stopPropagation(); pushHist(); o.on = o.on === false; changed(); renderPanel(); } }, o.on === false ? '○' : '●')),
      sec('Névoas', C.fog, 'fog', (o, i) => 'Névoa ' + (i + 1) + ' · ' + Math.round(o.opacity * 100) + '%', o => h('button', { class: 'mini', onclick: ev => { ev.stopPropagation(); pushHist(); o.on = o.on === false; changed(); renderPanel(); } }, o.on === false ? '○' : '●')),
      sec('Paredes', C.walls, 'wall', (o, i) => 'Parede ' + (i + 1)),
      sec('Elementos', C.elements.slice().reverse(), 'el', o => (CATALOG[o.kind] ? CATALOG[o.kind].name : o.kind) + (o.locked ? ' 🔒' : '')),
      !(C.areas.length + C.zones.length + C.creatures.length + C.lights.length + C.fog.length + C.walls.length + C.elements.length) ? h('p', { class: 'muted' }, 'Nada no mapa ainda.') : null);
  }
  function buildObjects2() { renderPanel(); }

  /* --- inspetor --- */
  const row = (label, el) => h('label', { class: 'row' }, h('span', {}, label), el);
  const E = fn => { pushHist(); fn(); changed(); };
  const txt = (v, fn, ph) => h('input', { type: 'text', value: v == null ? '' : v, placeholder: ph || '', onfocus: () => pushHist(), oninput: e => { fn(e.target.value); changed(); } });
  const num = (v, step, fn, min, max) => h('input', { type: 'number', step, min, max, value: Math.round(v * 100) / 100, onfocus: () => pushHist(), onchange: e => { const n = parseFloat(e.target.value); if (isFinite(n)) { fn(n); changed(); } } });
  const rng_ = (v, min, max, step, fn) => h('input', { type: 'range', min, max, step, value: v, onpointerdown: () => pushHist(), oninput: e => { fn(parseFloat(e.target.value)); changed(); } });
  const col = (v, fn) => h('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(v) ? v : '#888888', onfocus: () => pushHist(), oninput: e => { fn(e.target.value); changed(); } });
  const chk = (v, fn) => h('input', { type: 'checkbox', checked: !!v, onchange: e => { E(() => fn(e.target.checked)); buildInspector(); } });
  const selEl = (opts, v, fn) => h('select', { value: v, onchange: e => { E(() => fn(e.target.value)); buildInspector(); } }, opts.map(o => h('option', { value: o[0] }, o[1])));
  const btn = (label, fn, cls) => h('button', { class: 'btn small ' + (cls || ''), onclick: fn }, label);

  function buildInspector() {
    if (tab !== 'inspect') return; panelBody.innerHTML = '';
    if (!sel.length) { panelBody.append(h('p', { class: 'muted' }, 'Selecione algo no mapa (ferramenta ↖) para editar. Alt+clique alterna entre objetos sobrepostos.')); return; }
    if (sel.length > 1) {
      panelBody.append(h('div', { class: 'ititle' }, sel.length + ' objetos selecionados'), h('div', { class: 'btnrow' }, btn('Duplicar', duplicateSel), btn('Excluir', deleteSel, 'danger'))); return;
    }
    const s = sel[0], o = findObj(s); if (!o) { panelBody.append(h('p', { class: 'muted' }, 'Objeto não encontrado.')); return; }
    const g = G(), P = [h('div', { class: 'ititle' }, typeName[s.t] + (s.t === 'el' && CATALOG[o.kind] ? ' · ' + CATALOG[o.kind].name : ''))];
    const common = () => h('div', { class: 'btnrow' }, btn('Centralizar', () => focusObj(s)), s.t !== 'char' ? btn('Duplicar', duplicateSel) : null, btn(s.t === 'char' ? 'Remover jogador' : 'Excluir', deleteSel, 'danger'));
    if (s.t === 'area') {
      const im = o.bg ? Assets.imgs[o.bg] : null, ppb = im ? Math.round(Math.min(im.width / (o.w / g), im.height / (o.h / g))) : 0;
      P.push(row('Nome', txt(o.name, v => o.name = v)), row('Cor de fundo', col(o.color, v => o.color = v)),
        h('div', { class: 'lbl' }, 'Tamanho (em blocos)'),
        h('div', { class: 'chips' }, MAP_PRESETS.map(p => h('button', { class: 'chip sm', onclick: () => { E(() => { o.w = p[1] * g; o.h = p[2] * g; }); buildInspector(); } }, p[0]))),
        row('Largura (blocos)', num(o.w / g, .5, v => { o.w = v * g; }, 1)), row('Altura (blocos)', num(o.h / g, .5, v => o.h = v * g, 1)),
        im ? h('div', { class: 'q ' + ppbClass(ppb), style: 'margin:6px 0;padding:6px 9px;border-radius:7px;font-size:12px;border:1px solid var(--line)' }, 'Imagem ' + im.width + '×' + im.height + ' px → ' + ppb + ' px por bloco' + (ppb < 32 ? ' (baixa resolução: reduza os blocos)' : ppb < 56 ? ' (aceitável)' : ' (nítida)')) : null,
        im ? h('div', { class: 'btnrow' }, btn('✨ Tamanho ideal', () => { const a = cellsFor(im.width, im.height, MAP_IDEAL_PPB); E(() => { o.w = a.cw * g; o.h = a.ch * g; }); buildInspector(); }), btn('🔍 Máx. nítido', () => { const a = cellsFor(im.width, im.height, MAP_MIN_PPB); E(() => { o.w = a.cw * g; o.h = a.ch * g; }); buildInspector(); })) : null,
        im ? h('div', { class: 'btnrow' }, btn('Ajustar proporção da imagem', () => { E(() => { o.h = o.w * im.height / im.width; }); buildInspector(); }), btn(o.smooth === false ? 'Suavizar' : 'Pixel art', () => { E(() => { o.smooth = o.smooth === false; }); buildInspector(); })) : null,
        row('Visibilidade', selEl([['auto', 'Aparece quando há jogador nela'], ['always', 'Sempre visível'], ['hidden', 'Oculta dos jogadores']], o.reveal, v => o.reveal = v)),
        row('Escuridão ' + Math.round(o.darkness * 100) + '%', rng_(o.darkness, 0, .95, .05, v => { o.darkness = v; })),
        row('Cor do escuro', col(o.ambient, v => o.ambient = v)),
        h('div', { class: 'btnrow' }, btn(o.bg ? 'Trocar imagem…' : 'Definir imagem…', () => importMapImage(o)), o.bg ? btn('Remover imagem', () => { E(() => o.bg = null); buildInspector(); }) : null),
        h('div', { class: 'btnrow' }, btn('Excluir só a área', deleteSel, 'danger'), btn('Excluir com conteúdo', () => deleteAreaWithContent(o), 'danger')));
    } else if (s.t === 'el') {
      const def = CATALOG[o.kind] || {};
      P.push(row('Cor', col(o.color || def.color || '#888888', v => o.color = v)), row('Opacidade', rng_(o.alpha == null ? 1 : o.alpha, .1, 1, .05, v => o.alpha = v)),
        row('Largura (cél.)', num(o.w / g, .1, v => o.w = Math.max(.1, v) * g, .1)), row('Altura (cél.)', num(o.h / g, .1, v => o.h = Math.max(.1, v) * g, .1)),
        row('Rotação (°)', num(o.rot || 0, 5, v => o.rot = ((v % 360) + 360) % 360)), row('Espelhar', chk(o.flip, v => o.flip = v)), row('Travar (não selecionar)', chk(o.locked, v => o.locked = v)),
        h('div', { class: 'btnrow' }, btn('Textura nova', () => { E(() => o.seed = rnd32()); }), btn('Para frente', () => { E(() => { const i = C.elements.indexOf(o); C.elements.splice(i, 1); C.elements.push(o); }); }), btn('Para trás', () => { E(() => { const i = C.elements.indexOf(o); C.elements.splice(i, 1); C.elements.unshift(o); }); })));
    } else if (s.t === 'wall') {
      P.push(row('Espessura', rng_(o.thick || 10, 4, 24, 1, v => o.thick = v)), row('Cor', col(o.color || '#0b0b0c', v => o.color = v)));
    } else if (s.t === 'zone') {
      P.push(row('Nome / destino', txt(o.name, v => o.name = v, 'ex.: Casa do fazendeiro')), row('Ação', selEl([['enter', 'Entrar / Sair (teleporta)'], ['light', 'Ligar / apagar luz']], o.action, v => o.action = v)),
        row('Texto do botão', txt(o.verb, v => o.verb = v, o.action === 'light' ? 'Acender/Apagar luz' : 'Entrar')), row('Trancada', chk(o.locked, v => o.locked = v)), row('Ativa', chk(o.on !== false, v => o.on = v)));
      if (o.action === 'enter') {
        const ta = o.targetArea && C.areas.find(a => a.id === o.targetArea);
        P.push(h('div', { class: 'lbl' }, 'Destino'),
          h('p', { class: 'muted sm' }, o.targetX == null ? 'Sem destino definido.' : 'Leva para ' + (ta ? '"' + ta.name + '"' : 'um ponto fora das áreas') + '.'),
          h('div', { class: 'btnrow' }, btn('📍 Definir destino no mapa', () => { pickTarget = o.id; tool = 'select'; renderOptions(); cv.style.cursor = 'crosshair'; toast('Clique no mapa onde o jogador deve aparecer.'); }),
            o.targetX != null ? btn('Ir ao destino', () => stage.centerOn(o.targetX, o.targetY)) : null),
          row('Ou escolher área', selEl([['', '— escolher —']].concat(C.areas.map(a => [a.id, a.name])), '', v => { const a = C.areas.find(q => q.id === v); if (a) { o.targetArea = a.id; o.targetX = snapToken(C, a.x + a.w / 2); o.targetY = snapToken(C, a.y + a.h / 2); } })),
          o.targetX != null ? btn('↩ Criar zona de retorno (Sair)', () => makeReturnZone(o)) : null);
      } else {
        P.push(h('div', { class: 'lbl' }, 'Luzes controladas'), C.lights.length ? C.lights.map((l, i) => h('label', { class: 'row chkrow' }, h('input', { type: 'checkbox', checked: (o.lightIds || []).includes(l.id), onchange: e => { E(() => { o.lightIds = o.lightIds || []; if (e.target.checked) o.lightIds.push(l.id); else o.lightIds = o.lightIds.filter(q => q !== l.id); }); } }), h('span', {}, LIGHT_TYPES[lightKind(l)].name + ' ' + (i + 1) + (areaOf(l.x, l.y) ? ' · ' + areaOf(l.x, l.y).name : '')), h('button', { class: 'mini', onclick: ev => { ev.preventDefault(); stage.centerOn(l.x, l.y); } }, '⌖'))) : h('p', { class: 'muted sm' }, 'Crie luzes com a ferramenta ☀ primeiro.'));
      }
    } else if (s.t === 'fog') {
      P.push(row('Forma', selEl([['rect', 'Retângulo'], ['ellipse', 'Elipse']], o.shape, v => o.shape = v)), row('Opacidade ' + Math.round(o.opacity * 100) + '%', rng_(o.opacity, .05, 1, .05, v => o.opacity = v)),
        row('Suavidade da borda', rng_(o.soft || 0, 0, 120, 2, v => o.soft = v)), row('Cor', col(o.color, v => o.color = v)), row('Ativa (visível aos jogadores)', chk(o.on !== false, v => o.on = v)),
        h('p', { class: 'muted sm' }, 'Use para esconder trechos do mapa, fumaça, neblina ou escuridão parcial. Opacidade 100% bloqueia totalmente a visão.'));
    } else if (s.t === 'light') {
      const kd = lightKind(o), sp = o.spread == null ? 360 : o.spread, dr = o.dir || 0;
      P.push(row('Tipo', selEl(LIGHT_ORDER.map(k => [k, LIGHT_TYPES[k].name]), kd, v => { const d = lightDefaults(v, g); Object.assign(o, { kind: v, r: d.r, color: d.color, intensity: d.intensity, spread: d.spread, flicker: d.flicker }); if (v === 'led' && o.dir == null) o.dir = 90; })),
        row('Raio (células)', num(o.r / g, .5, v => o.r = Math.max(.5, v) * g, .5)), row('Cor', col(o.color, v => o.color = v)), row('Intensidade ' + Math.round((o.intensity == null ? 1 : o.intensity) * 100) + '%', rng_(o.intensity == null ? 1 : o.intensity, .1, 1, .05, v => o.intensity = v)),
        row('Direção ' + Math.round(dr) + '°', rng_(dr, 0, 359, 1, v => o.dir = v)),
        h('div', { class: 'chips' }, [['→', 0], ['↘', 45], ['↓', 90], ['↙', 135], ['←', 180], ['↖', 225], ['↑', 270], ['↗', 315]].map(([t, a]) => h('button', { class: 'chip sm' + (Math.round(dr) === a ? ' on' : ''), onclick: () => { E(() => o.dir = a); buildInspector(); } }, t))),
        row('Abertura ' + (sp >= 359 ? '360° (todas as direções)' : Math.round(sp) + '°'), rng_(sp, 10, 360, 5, v => o.spread = v >= 355 ? 360 : v)),
        row('Tremular (fogo/vela)', chk(o.flicker, v => o.flicker = v)), row('Acesa', chk(o.on !== false, v => o.on = v)),
        h('p', { class: 'muted sm' }, 'Arraste as alças no mapa: branca = alcance, amarela = direção, azul = abertura do cone. A luz só "fura" a escuridão de áreas com Escuridão > 0; sem escuridão ela apenas tinge o ambiente.'));
    } else if (s.t === 'creature' || s.t === 'char') {
      const isC = s.t === 'creature';
      P.push(row('Nome', txt(o.name, v => o.name = v)));
      if (isC) P.push(row('Oculta dos jogadores', chk(o.hidden, v => o.hidden = v)), row('Jogadores veem o nome', chk(o.nameVis, v => o.nameVis = v)));
      P.push(row('Tamanho (células)', num(o.size || 1, .5, v => o.size = Math.max(.5, v), .5, 6)), row('Moldura', selEl(FRAMES, o.frame, v => o.frame = v)), row('Cor', col(o.color, v => o.color = v)), row('Opacidade', rng_(o.alpha == null ? 1 : o.alpha, .15, 1, .05, v => o.alpha = v)),
        h('div', { class: 'lbl' }, 'Estado'), h('div', { class: 'chips states' }, STATES.map(st => h('button', { class: 'chip st-' + st[0] + (o.state === st[0] ? ' on' : ''), onclick: () => { E(() => o.state = st[0]); buildInspector(); } }, st[1]))));
      if (isC || o.pc) P.push(h('div', { class: 'btnrow' }, btn(isC ? '🖼 Imagem da criatura' : '🖼 Imagem do personagem', async () => { const f = await pickFile(IMG_ACCEPT); if (!f) return; let img; try { img = await loadImgFile(f); } catch (e) { toast('Não consegui abrir a imagem: ' + (e && e.message || 'formato inválido')); return; } const id = uid('t'); Assets.put(id, tokenFromImg(img)); pushHist(); o.asset = id; o.zoom = 1; o.ox = 0; o.oy = 0; changed(); eng.broadcast(); buildInspector(); }), o.asset ? btn('Remover imagem', () => { E(() => o.asset = null); buildInspector(); }) : null));
      if (!isC) P.push(row('Controlado por', ownerSel(o)), h('div', { class: 'btnrow' }, btn('🎒 Itens e equipamento', () => openInv(o))), row('Levar para a área', selEl([['', '— escolher —']].concat(C.areas.map(a => [a.id, a.name])), '', v => { const a = C.areas.find(q => q.id === v); if (a) { pushHist(); eng.teleport(o.id, snapToken(C, a.x + a.w / 2), snapToken(C, a.y + a.h / 2)); stage.centerOn(o.x, o.y); } })));
      if (o.asset && o.frame !== 'full') P.push(row('Zoom da foto', rng_(o.zoom || 1, 1, 3, .02, v => o.zoom = v)), row('Foto ← →', rng_(o.ox || 0, -1, 1, .02, v => o.ox = v)), row('Foto ↑ ↓', rng_(o.oy || 0, -1, 1, .02, v => o.oy = v)));
    }
    P.push(common()); panelBody.append(...P.filter(Boolean));
  }
  function bgRatio(a) { const im = a.bg && Assets.imgs[a.bg]; return im ? im.height / im.width : 0; }
  function deleteAreaWithContent(a) {
    askConfirm('Excluir a área "' + a.name + '" e tudo que está dentro dela?', () => doDeleteArea(a), 'Excluir');
  }
  function doDeleteArea(a) {
    pushHist();
    const ins = (x, y) => inR(x, y, a);
    C.elements = C.elements.filter(e => !ins(e.x + e.w / 2, e.y + e.h / 2)); C.walls = C.walls.filter(w => !ins((w.x1 + w.x2) / 2, (w.y1 + w.y2) / 2));
    C.zones = C.zones.filter(z => !ins(z.x + z.w / 2, z.y + z.h / 2)); C.fog = C.fog.filter(f => !ins(f.x + f.w / 2, f.y + f.h / 2)); C.lights = C.lights.filter(l => !ins(l.x, l.y)); C.creatures = C.creatures.filter(n => !ins(n.x, n.y));
    C.areas = C.areas.filter(q => q.id !== a.id); sel = []; changed(); eng.broadcast(); refreshAll();
  }
  function makeReturnZone(z) {
    const g = G(), cx = z.targetX, cy = z.targetY; pushHist();
    const back = addZone(cx - g, cy - g, 2 * g, 2 * g); back.action = 'enter'; back.verb = 'Sair'; const from = areaOf(z.x + z.w / 2, z.y + z.h / 2); back.name = from ? from.name : 'Saída';
    back.targetX = snapToken(C, z.x + z.w / 2); back.targetY = snapToken(C, z.y + z.h + g * .75); back.targetArea = from ? from.id : null;
    changed(); selectAndInspect([{ t: 'zone', id: back.id }]); toast('Zona de retorno criada no destino.');
  }

  /* --- jogadores --- */
  const invCtx = { C: () => C, eng, pushHist: () => pushHist(), changed: () => changed(), refresh: () => { stage.dirty = true; if (tab === 'players') renderPlayers(); } };
  function openInv(ch) { inventoryModal(invCtx, ch); }
  function equippedStrip(ch) {
    const list = equippedOf(C, ch.id); if (!list.length) return null;
    return h('div', { class: 'eqmini' }, list.slice(0, 6).map(x => h('span', { title: x.it.name }, iconEl(x.it, 22))));
  }
  function knownPlayers() { const o = {}; for (const [pid, n] of Object.entries(C.pnames || {})) o[pid] = n; for (const [pid, p] of Object.entries(eng.players)) o[pid] = p.name || o[pid] || 'Jogador'; return o; }
  function ownerSel(ch) {
    const kp = knownPlayers(), cur = ownerOf(ch); if (cur && !kp[cur]) kp[cur] = 'Jogador';
    const s = h('select', { class: 'ownsel', onchange: e => { pushHist(); eng.assign(ch.id, e.target.value || null); changed({ tokens: true }); renderPlayers(); buildInspector(); } },
      [h('option', { value: '' }, '— ninguém (só o mestre) —')].concat(Object.entries(kp).map(([pid, n]) => h('option', { value: pid }, n + (eng.players[pid] && Date.now() - eng.players[pid].seen < 25000 ? ' ●' : '')))));
    s.value = cur || ''; return s;
  }
  function addPC() {
    pushHist(); const n = Object.values(C.characters).filter(x => x.pc).length + 1, ch = newCharacter(uid('pc'), 'Personagem ' + n); ch.owner = null; ch.pc = true; placeNew(C, ch); C.characters[ch.id] = ch;
    changed({ tokens: true }); eng.broadcast(); selectAndInspect([{ t: 'char', id: ch.id }]); stage.centerOn(ch.x, ch.y);
  }
  function renderPlayers() {
    if (tab !== 'players') return; panelBody.innerHTML = '';
    const list = Object.values(C.characters), ts = C.tokenScale || 1, tsOut = h('b', {}, Math.round(ts * 100) + '%');
    panelBody.append(h('div', { class: 'tscale' }, h('div', { class: 'lbl' }, 'Tamanho dos ícones (jogadores e criaturas) ', tsOut),
      h('input', { type: 'range', min: .5, max: 2.5, step: .05, value: ts, onpointerdown: () => pushHist(), oninput: e => { C.tokenScale = +e.target.value; tsOut.textContent = Math.round(C.tokenScale * 100) + '%'; changed(); } }),
      h('p', { class: 'muted sm' }, 'Em mapas muito grandes os ícones ficam pequenos ao enquadrar tudo: eles nunca encolhem abaixo de ~22 px na tela. Aumente aqui se quiser mais destaque.')));
    panelBody.append(h('div', { class: 'btnrow' }, btn('＋ Personagem do mestre', addPC)), h('p', { class: 'muted sm' }, 'Jogadores que entram já recebem o próprio personagem. Aqui você cria personagens e escolhe quem controla cada um (pode trocar a qualquer hora). Dica: selecione um personagem e use WASD ou as setas para movê-lo.'));
    if (!list.length) { panelBody.append(h('p', { class: 'muted' }, 'Nenhum personagem ainda. Crie um acima ou inicie a sessão (aba Sessão) e compartilhe o link.')); return; }
    for (const ch of list) {
      const ow = ownerOf(ch), p = ow && eng.players[ow], online = p && Date.now() - p.seen < 25000;
      const c = h('canvas', { width: 80, height: 80, class: 'pav' }); drawTokenAt(c.getContext('2d'), { id: ch.id, name: ch.name, asset: ch.asset, frame: ch.frame, zoom: ch.zoom, ox: ch.ox, oy: ch.oy, color: ch.color, state: ch.state, alpha: 1 }, 40, 40, 70, { s: 1.5, time: 0 });
      panelBody.append(h('div', { class: 'prow' + (isSel('char', ch.id) ? ' on' : '') },
        c, h('div', { class: 'pinfo' }, h('div', { class: 'pname' }, h('span', { class: 'dot ' + (online ? 'ok' : ow ? 'bad' : 'off') }), ch.name, ch.pc ? h('i', { class: 'pctag' }, 'do mestre') : null), h('div', { class: 'ownrow' }, h('span', { class: 'muted sm' }, 'Controlado por'), ownerSel(ch)), h('div', { class: 'chips states mini' }, STATES.map(st => h('button', { class: 'chip sm st-' + st[0] + (ch.state === st[0] ? ' on' : ''), onclick: () => { pushHist(); ch.state = st[0]; changed(); eng.broadcast(); renderPlayers(); stage.dirty = true; } }, st[1]))), equippedStrip(ch)),
        h('div', { class: 'pact' }, h('button', { class: 'mini', title: 'Centralizar', onclick: () => stage.centerOn(ch.x, ch.y) }, '⌖'), h('button', { class: 'mini', title: 'Selecionar', onclick: () => selectAndInspect([{ t: 'char', id: ch.id }]) }, '✎'), h('button', { class: 'mini', title: 'Itens e equipamento', onclick: () => openInv(ch) }, '🎒'))));
    }
  }

  /* --- sessão --- */
  function joinLink() {
    const base = location.href.split('#')[0]; let q = 'join=' + cfg.code + (cfg.cloud ? '' : '&m=' + cfg.mode);
    if (cfg.mode === 'online' && !cfg.cloud) q += '&u=' + encodeURIComponent(cfg.url) + '&k=' + encodeURIComponent(cfg.key);
    return base + '#' + q;
  }
  async function startSession() {
    if (net) return; cfg.code = (cfg.code || genCode()).toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cfg.cloud && cfg.mode === 'online' && (!/^https:\/\//.test(cfg.url) || !cfg.key)) { sessErr = 'Informe a URL (https://…supabase.co) e a chave pública (anon / publishable) do projeto.'; buildSession(); return; }
    if (!cfg.cloud) store.set('vtt-cfg', cfg); sessErr = ''; const n = new Net(makeTransport(cfg), 'master'); n.on(m => eng.handle(m));
    try { await n.open(); } catch (e) { sessErr = e.message || String(e); buildSession(); return; }
    net = n; eng.live = true; net.onStatus = st => { if (st === 'lost') toast('Conexão do Realtime perdida. Reconectando…'); else if (st === 'reconnected') { toast('Realtime reconectado.'); eng.broadcast(); } };
    eng.broadcast(); renderHeader(); buildSession(); toast('Sessão iniciada: ' + cfg.code);
  }
  function stopSession() { if (!net) return; try { net.send({ t: 'kick-all' }); } catch (e) { /* */ } const n = net; net = null; eng.live = false; setTimeout(() => n.close(), 200); renderHeader(); buildSession(); }
  function buildSession() {
    if (tab !== 'session') return; panelBody.innerHTML = ''; const live = !!net;
    const inp = (v, fn, ph, type) => h('input', { type: type || 'text', value: v, placeholder: ph || '', disabled: live, oninput: e => { fn(e.target.value); } });
    panelBody.append(
      h('div', { class: 'ititle' }, live ? '● Sessão ativa' : 'Sessão'),
      cfg.cloud ? h('p', { class: 'muted sm' }, 'Os jogadores entram pelo link ou digitando o código abaixo no painel deles (precisam de conta ou entrar como convidado). A campanha é salva automaticamente na nuvem.') : null,
      cfg.cloud ? null : row('Modo', h('select', { disabled: live, value: cfg.mode, onchange: e => { cfg.mode = e.target.value; store.set('vtt-cfg', cfg); buildSession(); } }, h('option', { value: 'local' }, 'Local (mesmo navegador — testes)'), h('option', { value: 'online' }, 'Online (Supabase Realtime)'))),
      cfg.cloud ? null : cfg.mode === 'online' ? h('div', {}, row('URL do projeto', inp(cfg.url, v => cfg.url = v.trim(), 'https://xxxx.supabase.co')), row('Chave pública', inp(cfg.key, v => cfg.key = v.trim(), 'anon / publishable key', 'password')),
        h('p', { class: 'muted sm' }, 'Em Supabase → Project Settings → API. Use somente a chave pública (anon/publishable). O jogo usa apenas canais Realtime (Broadcast): nenhuma tabela é criada no seu banco.')) : h('p', { class: 'muted sm' }, 'No modo local, jogadores precisam abrir o link em outra aba/janela do mesmo navegador. Serve para testar e para jogar com uma tela só.'),
      cfg.cloud ? row('Código da mesa', h('div', { class: 'bigcode' }, cfg.code)) : row('Código da mesa', h('div', { class: 'inline' }, inp(cfg.code, v => cfg.code = v.toUpperCase().replace(/[^A-Z0-9]/g, '')), h('button', { class: 'mini', disabled: live, onclick: () => { cfg.code = genCode(); buildSession(); } }, '↻'))),
      sessErr ? h('div', { class: 'err' }, sessErr) : null,
      h('div', { class: 'btnrow' }, live ? btn('Encerrar sessão', stopSession, 'danger') : btn('Iniciar sessão', startSession, 'primary')),
      h('div', { class: 'lbl' }, 'Link para os jogadores'), h('input', { type: 'text', readonly: true, value: joinLink(), onfocus: e => e.target.select() }),
      h('div', { class: 'btnrow' }, btn('Copiar link', () => { navigator.clipboard && navigator.clipboard.writeText(joinLink()).then(() => toast('Link copiado.')).catch(() => toast('Copie manualmente o link acima.')); }), cfg.mode === 'local' && !cfg.cloud ? btn('Abrir jogador (nova aba)', () => window.open(joinLink(), '_blank')) : null),
      location.protocol === 'file:' ? h('p', { class: 'muted sm' }, 'Você abriu este arquivo do disco (file://). Para os jogadores acessarem, hospede o arquivo (GitHub Pages, Netlify, Vercel…) e abra a versão hospedada para gerar o link certo.') : null);
  }

  /* ---------- estado vazio ---------- */
  function renderEmpty() {
    empty.innerHTML = ''; empty.hidden = C.areas.length > 0 || preview; if (empty.hidden) return;
    empty.append(h('div', { class: 'card' }, h('h2', {}, 'Monte seu mapa'), h('p', { class: 'muted' }, 'Anexe uma imagem de mapa, comece em branco ou use um modelo e edite.'),
      h('div', { class: 'btncol' }, h('button', { class: 'btn primary', onclick: () => importMapImage() }, '🖼 Usar uma imagem como mapa'), h('button', { class: 'btn', onclick: newBlankArea }, '▭ Mapa em branco (montar com o catálogo)'),
        h('button', { class: 'btn', onclick: () => loadTemplate('facility') }, '🏚 Modelo: base de contenção'), h('button', { class: 'btn', onclick: () => loadTemplate('island') }, '🏝 Modelo: vila da ilha'),
        h('button', { class: 'btn', onclick: () => loadTemplate('dungeon') }, '🗝 Modelo D&D: masmorra'), h('button', { class: 'btn', onclick: () => loadTemplate('tavern') }, '🍺 Modelo D&D: taverna'))));
  }

  function refreshLists() { renderAreasBar(); renderEmpty(); if (preview) renderBanner(); if (tab === 'objects') { panelBody.innerHTML = ''; buildObjects(); } else if (tab === 'players') renderPlayers(); }
  function refreshAll() { renderTools(); renderOptions(); renderHeader(); renderAreasBar(); renderPanel(); renderEmpty(); }

  refreshAll(); fitAll();
  setInterval(() => { if (tab === 'players' && document.body.contains(cv)) renderPlayers(); }, 5000);
  window.__master = { get C() { return C; }, eng, stage, select, setTool, startSession, get net() { return net; }, cfg, leaveToHome, cloudSave };
}
