'use strict';
/* ===== engine.js — regras do jogo: visibilidade, zonas, sincronização (sem DOM) ===== */

function areaAtPoint(areas, x, y) {
  for (let i = areas.length - 1; i >= 0; i--) { const a = areas[i]; if (inR(x, y, a)) return a; }
  return null;
}
/* área mais próxima (até `max` células) de um ponto fora de todas as áreas — evita tela preta quando o jogador pisa um pouco fora do mapa */
function nearestArea(c, x, y, maxCells) {
  let best = null, bd = (maxCells || 4) * c.grid;
  for (const a of c.areas) {
    if (a.reveal === 'hidden') continue;
    const dx = Math.max(a.x - x, 0, x - (a.x + a.w)), dy = Math.max(a.y - y, 0, y - (a.y + a.h)), d = Math.hypot(dx, dy);
    if (d < bd) { bd = d; best = a; }
  }
  return best;
}
/* opt.char: ponto de vista de um jogador só · opt.area: "como se um jogador estivesse nesta área" (pré-visualização do mestre) */
function visibleAreaSet(c, opt) {
  opt = opt || {}; const s = new Set();
  for (const a of c.areas) if (a.reveal === 'always') s.add(a.id);
  if (opt.area) { s.add(opt.area); return s; }
  const chars = opt.char ? [c.characters[opt.char]].filter(Boolean) : Object.values(c.characters);
  for (const ch of chars) {
    let hit = false;
    for (const a of c.areas) if (a.reveal !== 'hidden' && inR(ch.x, ch.y, a)) { s.add(a.id); hit = true; }
    if (!hit) { const n = nearestArea(c, ch.x, ch.y, 4); if (n) s.add(n.id); }
  }
  return s;
}
/* dono do personagem: jogador (pid) ou null; personagens antigos sem campo pertencem ao jogador de mesmo id */
function ownerOf(ch) { return ch.owner === undefined ? ch.id : ch.owner; }
function pubToken(o, kind) {
  return { id: o.id, kind, owner: kind === 'c' ? ownerOf(o) : undefined, name: o.name, x: o.x, y: o.y, size: o.size || 1, asset: o.asset || null, frame: o.frame, zoom: o.zoom || 1, ox: o.ox || 0, oy: o.oy || 0, color: o.color, state: o.state || 'normal', alpha: o.alpha == null ? 1 : o.alpha, hidden: !!o.hidden, nameVis: !!o.nameVis };
}
function buildTokens(c, master, vis) {
  const out = [];
  for (const ch of Object.values(c.characters)) {
    const t = pubToken(ch, 'c'); if (c.showEquip !== false && typeof tokenEquip === 'function') Object.assign(t, tokenEquip(c, ch.id));
    if (!master && !c.areas.some(a => vis.has(a.id) && inR(ch.x, ch.y, a))) t.out = true; // fora das áreas reveladas: só o dono vê o próprio token
    out.push(t);
  }
  for (const n of c.creatures) {
    if (!master && n.hidden) continue;
    if (!master && !c.areas.some(a => vis.has(a.id) && inR(n.x, n.y, a))) continue;
    out.push(pubToken(n, 'n'));
  }
  return out;
}
function masterScene(c) {
  return { grid: c.grid, showGrid: c.showGrid, tokenScale: c.tokenScale || 1, areas: c.areas, elements: c.elements, walls: c.walls, zones: c.zones, fog: c.fog, lights: c.lights, tokens: buildTokens(c, true) };
}
function computePrompts(c) {
  const out = {};
  for (const ch of Object.values(c.characters)) {
    for (let i = c.zones.length - 1; i >= 0; i--) {
      const z = c.zones[i]; if (z.on === false || !inR(ch.x, ch.y, z)) continue;
      let verb = z.verb;
      if (z.action === 'light') {
        const ls = (z.lightIds || []).map(id => c.lights.find(l => l.id === id)).filter(Boolean);
        if (!ls.length) continue;
        if (!verb) verb = ls.some(l => l.on !== false) ? 'Apagar luz' : 'Acender luz';
      } else if (z.targetX == null) continue;
      out[ch.id] = { zid: z.id, verb: verb || 'Entrar', name: z.name || '', locked: !!z.locked, action: z.action };
      break;
    }
  }
  return out;
}
function buildView(c, opt) {
  const vis = visibleAreaSet(c, opt);
  const inV = (x, y) => c.areas.some(a => vis.has(a.id) && inR(x, y, a));
  return {
    name: c.name, grid: c.grid, showGrid: c.showGrid, tokenScale: c.tokenScale || 1,
    areas: c.areas.filter(a => vis.has(a.id)).map(a => ({ id: a.id, x: a.x, y: a.y, w: a.w, h: a.h, color: a.color, bg: a.bg, smooth: a.smooth, darkness: a.darkness, ambient: a.ambient })),
    elements: c.elements.filter(e => inV(e.x + e.w / 2, e.y + e.h / 2)),
    walls: c.walls.filter(w => inV((w.x1 + w.x2) / 2, (w.y1 + w.y2) / 2)),
    fog: c.fog.filter(f => f.on !== false && inV(f.x + f.w / 2, f.y + f.h / 2)),
    lights: c.lights.filter(l => inV(l.x, l.y)).map(l => ({ id: l.id, kind: l.kind, x: l.x, y: l.y, r: l.r, color: l.color, intensity: l.intensity, dir: l.dir, spread: l.spread, flicker: l.flicker, on: l.on !== false })),
    tokens: buildTokens(c, false, vis),
    prompts: computePrompts(c)
  };
}
function snapToken(c, v) { return Math.floor(v / c.grid) * c.grid + c.grid / 2; }
function placeNew(c, ch) {
  const a = c.areas[0];
  if (a) { ch.x = a.x + a.w / 2; ch.y = a.y + a.h / 2; } else { ch.x = c.grid; ch.y = c.grid; }
  // desloca para não empilhar
  const n = Object.values(c.characters).length; ch.x += (n % 4) * c.grid * .8; ch.y += Math.floor(n / 4) * c.grid * .8;
  if (c.snap) { ch.x = snapToken(c, ch.x); ch.y = snapToken(c, ch.y); }
}
const CHAR_KEYS = ['name', 'frame', 'color', 'state', 'alpha', 'asset', 'zoom', 'ox', 'oy'];
function sanitizeChar(ch, d) {
  for (const k of CHAR_KEYS) {
    if (d[k] === undefined) continue;
    let v = d[k];
    if (k === 'name') v = String(v || '').slice(0, 24) || 'Jogador';
    else if (k === 'frame') { if (!FRAMES.some(f => f[0] === v)) continue; }
    else if (k === 'state') { if (!STATES.some(f => f[0] === v)) continue; }
    else if (k === 'alpha') v = clamp(+v || 1, .15, 1);
    else if (k === 'zoom') v = clamp(+v || 1, 1, 4);
    else if (k === 'ox' || k === 'oy') v = clamp(+v || 0, -1, 1);
    else if (k === 'color') { if (!/^#[0-9a-f]{6}$/i.test(v)) continue; }
    else if (k === 'asset') { if (v != null && typeof v !== 'string') continue; }
    ch[k] = v;
  }
}

class MasterEngine {
  constructor(c, io) { this.c = c; this.io = io; this.players = {}; this.live = false; this.rev = 0; this._lp = 0; }
  setCampaign(c) { this.c = c; }
  ownedIds(pid) { return Object.values(this.c.characters).filter(ch => ownerOf(ch) === pid).map(ch => ch.id); }
  /* personagem ativo de um jogador (o que ele está movendo / cuja mochila ele vê) */
  actId(pid) { const own = this.ownedIds(pid), p = this.players[pid]; if (p && p.active && own.includes(p.active)) return p.active; return own.includes(pid) ? pid : own[0] || null; }
  ctl(pid, cid) { const own = this.ownedIds(pid); return cid && own.includes(cid) ? cid : this.actId(pid); }
  sendInv(pid) { if (!this.live || typeof invForPlayer !== 'function') return; const cid = this.actId(pid); this.io.send({ t: 'inv', d: { cid, list: cid ? invForPlayer(this.c, cid) : [] } }, pid); }
  invChanged(cid) { const ch = this.c.characters[cid]; this.sendInv(ch ? ownerOf(ch) : cid); this.touch(); this.broadcast(); }
  /* master reatribui um personagem: avisa os dois jogadores */
  assign(cid, pid) { const ch = this.c.characters[cid]; if (!ch) return; const old = ownerOf(ch); ch.owner = pid || null; if (old) this.sendInv(old); if (pid) this.sendInv(pid); this.touch(); this.broadcast(); if (this.io.onPlayers) this.io.onPlayers(); }
  view() { const v = buildView(this.c); v.rev = ++this.rev; return v; }
  broadcast() { if (!this.live) return; clearTimeout(this._t); this.io.send({ t: 'view', d: this.view() }); }
  soon() { if (!this.live) return; clearTimeout(this._t); this._t = setTimeout(() => this.broadcast(), 70); }
  pos() {
    if (!this.live) return;
    const now = Date.now();
    if (now - this._lp < 80) { clearTimeout(this._pt); this._pt = setTimeout(() => this.pos(), 80); return; }
    this._lp = now;
    const tk = Object.values(this.c.characters).map(o => [o.id, o.x, o.y]);
    for (const n of this.c.creatures) if (!n.hidden) tk.push([n.id, n.x, n.y]);
    this.io.send({ t: 'pos', d: { tk, pr: computePrompts(this.c) } });
  }
  touch() { if (this.io.onChange) this.io.onChange(); this.soon(); }
  teleport(pid, x, y) {
    const ch = this.c.characters[pid]; if (!ch) return;
    ch.x = x; ch.y = y; const ow = ownerOf(ch); if (ow) this.io.send({ t: 'tp', d: { x, y, cid: ch.id } }, ow); this.touch(); this.broadcast();
  }
  trigger(pid, zid) {
    const c = this.c, ch = c.characters[pid], z = c.zones.find(q => q.id === zid);
    if (!ch || !z || z.on === false || !inR(ch.x, ch.y, z)) return false;
    if (z.locked) { const ow = ownerOf(ch); if (ow) this.io.send({ t: 'toast', d: { msg: (z.name ? z.name + ': ' : '') + 'trancado.' } }, ow); return false; }
    if (z.action === 'enter') {
      if (z.targetX == null) return false;
      ch.x = z.targetX; ch.y = z.targetY; const ow = ownerOf(ch); if (ow) this.io.send({ t: 'tp', d: { x: ch.x, y: ch.y, cid: ch.id } }, ow);
    } else if (z.action === 'light') {
      for (const id of z.lightIds || []) { const l = c.lights.find(q => q.id === id); if (l) l.on = l.on === false; }
    }
    this.touch(); this.broadcast(); return true;
  }
  handle(m) {
    const c = this.c, d = m.d || {}, from = m.from;
    switch (m.t) {
      case 'hello': {
        const pid = d.pid || from; let ch = c.characters[pid], isNew = false;
        if (!ch) { ch = newCharacter(pid, d.name); placeNew(c, ch); c.characters[pid] = ch; isNew = true; }
        const mine = ownerOf(ch) === pid;
        if (mine) { const patch = Object.assign({}, d.char || {}, { name: d.name }); if (!isNew) delete patch.state; sanitizeChar(ch, patch); }
        c.pnames = c.pnames || {}; c.pnames[pid] = String(d.name || ch.name || 'Jogador').slice(0, 24);
        this.players[pid] = Object.assign(this.players[pid] || {}, { name: c.pnames[pid], seen: Date.now() });
        if (this.io.onPlayers) this.io.onPlayers();
        this.io.send({ t: 'welcome', d: { char: mine ? ch : null, needAsset: !!(mine && ch.asset && !Assets.has(ch.asset)) } }, pid);
        this.sendInv(pid); this.touch(); this.broadcast(); break;
      }
      case 'char': { const ch = c.characters[from]; if (!ch || ownerOf(ch) !== from) return; sanitizeChar(ch, d); if (this.io.onPlayers) this.io.onPlayers(); this.touch(); break; }
      case 'move': {
        const cid = this.ctl(from, d.cid), ch = cid && c.characters[cid]; if (!ch || !isFinite(d.x) || !isFinite(d.y)) return;
        ch.x = d.x; ch.y = d.y;
        if (d.end && c.snap) { ch.x = snapToken(c, ch.x); ch.y = snapToken(c, ch.y); }
        if (this.io.onMove) this.io.onMove();
        const sig = [...visibleAreaSet(c)].sort().join(','); // atravessou uma porta: revela a nova área na hora, sem esperar soltar o token
        if (d.end) { this._vs = sig; this.touch(); this.broadcast(); } else if (sig !== this._vs) { this._vs = sig; this.broadcast(); } else this.pos();
        break;
      }
      case 'zone': this.trigger(this.ctl(from, d.cid), d.zid); break;
      case 'active': { if (this.players[from] && this.ownedIds(from).includes(d.cid)) { this.players[from].active = d.cid; this.sendInv(from); } break; }
      case 'equip': { const cid = this.actId(from); if (!cid || typeof d.iid !== 'string') return; if (equipItem(c, cid, d.iid, !!d.on)) { this.invChanged(cid); if (this.io.onPlayers) this.io.onPlayers(); } break; }
      case 'itemon': { const cid = this.actId(from); if (!cid) return; const e = invOf(c, cid).find(x => x.id === d.iid); if (e) { e.on = !!d.on; this.invChanged(cid); } break; }
      case 'needAsset': for (const id of d.ids || []) if (Assets.data[id]) this.io.send({ t: 'asset', d: { id, data: Assets.data[id] } }, from); break;
      case 'asset': if (d.id && typeof d.data === 'string' && d.data.startsWith('data:image/')) { Assets.put(d.id, d.data); if (this.io.onChange) this.io.onChange(); } break;
      case 'ping': {
        const p = this.players[from];
        if (!p) { this.io.send({ t: 'rehello' }, from); break; }
        p.seen = Date.now(); break;
      }
      case 'sync': this.broadcast(); break;
      case 'bye': if (this.players[from]) { this.players[from].seen = 0; if (this.io.onPlayers) this.io.onPlayers(); } break;
    }
  }
}

class PlayerEngine {
  constructor(me, io) { this.me = me; this.io = io; this.view = null; this.inv = []; this.asked = {}; this.welcomed = false; this.mine = null; }
  hello() { this.io.send({ t: 'hello', d: { pid: this.me.id, name: this.me.name, char: this.me.char } }); }
  sendChar(patch) { Object.assign(this.me.char, patch); if (patch.name) this.me.name = patch.name; this.io.send({ t: 'char', d: patch }); }
  uploadAsset(id, data) { Assets.put(id, data); this.io.send({ t: 'asset', d: { id, data } }); }
  mineTokens() { return this.view ? this.view.tokens.filter(t => t.kind === 'c' && t.owner === this.me.id) : []; }
  mineIds() { return this.mineTokens().map(t => t.id); }
  activeId() { const m = this.mineIds(); return m.includes(this.active) ? this.active : m.includes(this.me.id) ? this.me.id : m[0] || null; }
  setActive(cid) { if (this.mineIds().includes(cid) && this.active !== cid) { this.active = cid; this.inv = []; this.io.send({ t: 'active', d: { cid } }); if (this.io.inv) this.io.inv(); } }
  move(x, y, end, cid) { this.io.send({ t: 'move', d: { x, y, end: !!end, cid: cid || this.activeId() } }); }
  zone(zid) { this.io.send({ t: 'zone', d: { zid, cid: this.activeId() } }); }
  equip(iid, on) { const e = (this.inv || []).find(x => x.id === iid); if (e) e.eq = !!on; this.io.send({ t: 'equip', d: { iid, on: !!on } }); }
  itemOn(iid, on) { const e = (this.inv || []).find(x => x.id === iid); if (e) e.on = !!on; this.io.send({ t: 'itemon', d: { iid, on: !!on } }); }
  ping() { this.io.send({ t: 'ping' }); }
  needAssets() {
    if (!this.view) return;
    const ids = new Set();
    for (const a of this.view.areas) if (a.bg) ids.add(a.bg);
    for (const t of this.view.tokens) { if (t.asset) ids.add(t.asset); for (const q of t.eq || []) if (q[2]) ids.add(q[2]); }
    for (const e of this.inv || []) if (e.it.art) ids.add(e.it.art);
    const now = Date.now(), miss = [...ids].filter(id => !Assets.has(id) && !(this.asked[id] && now - this.asked[id] < 6000));
    if (miss.length) { miss.forEach(id => this.asked[id] = now); this.io.send({ t: 'needAsset', d: { ids: miss } }); }
  }
  myToken() { const id = this.activeId(); return id && this.view ? this.view.tokens.find(t => t.id === id) : null; }
  handle(m) {
    const d = m.d || {};
    switch (m.t) {
      case 'view':
        if (this.dragging && this.view) { const mt = this.view.tokens.find(q => q.id === this.dragId), nt = d.tokens.find(q => q.id === this.dragId); if (mt && nt) { nt.x = mt.x; nt.y = mt.y; } }
        this.view = d; this.needAssets(); this.io.update(); break;
      case 'pos':
        if (!this.view) break;
        for (const p of d.tk) { if (this.dragging && p[0] === this.dragId) continue; const t = this.view.tokens.find(q => q.id === p[0]); if (t) { t.x = p[1]; t.y = p[2]; } }
        this.view.prompts = d.pr || {}; this.io.update(); break;
      case 'inv': this.inv = d.list || []; this.invCid = d.cid || null; this.needAssets(); if (this.io.inv) this.io.inv(); break;
      case 'asset': Assets.put(d.id, d.data); this.io.assetIn ? this.io.assetIn() : this.io.update(); break;
      case 'welcome': this.welcomed = true; if (d.needAsset && this.me.char.asset && Assets.has(this.me.char.asset)) this.io.send({ t: 'asset', d: { id: this.me.char.asset, data: Assets.data[this.me.char.asset] } }); this.io.welcome && this.io.welcome(d); break;
      case 'tp': this.io.teleport && this.io.teleport(d); break;
      case 'toast': this.io.toast && this.io.toast(d.msg); break;
      case 'rehello': this.hello(); break;
    }
  }
}
