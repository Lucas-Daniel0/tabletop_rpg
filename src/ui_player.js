'use strict';
/* ===== ui_player.js — editor de personagem (compartilhado) e tela do jogador ===== */

function CharacterEditor(o) {
  const ch = o.char; let timer = null;
  const prev = h('canvas', { width: 140, height: 140, class: 'cprev' });
  const draw = () => {
    const c = prev.getContext('2d'); c.clearRect(0, 0, 140, 140);
    c.fillStyle = '#101216'; c.fillRect(0, 0, 140, 140);
    drawTokenAt(c, { id: o.pid, name: ch.name, asset: ch.asset, frame: ch.frame, zoom: ch.zoom, ox: ch.ox, oy: ch.oy, color: ch.color, state: ch.state || 'normal', alpha: ch.alpha }, 70, 70, 116, { s: 1.3, time: performance.now() });
  };
  const iv = setInterval(() => { if (!prev.isConnected) { if (prev.__seen) clearInterval(iv); } else { prev.__seen = true; draw(); } }, 140);
  const emit = patch => { Object.assign(ch, patch); draw(); if (o.onChange) o.onChange(patch); sync(); };
  const nameIn = h('input', { type: 'text', maxlength: 24, value: ch.name || '', placeholder: 'Nome do personagem', oninput: e => emit({ name: e.target.value.trim() ? e.target.value : ch.name }) });
  const photoBtn = h('button', { class: 'btn', type: 'button', onclick: async () => {
    const f = await pickFile(IMG_ACCEPT); if (!f) return;
    try {
      const img = await loadImgFile(f), data = tokenFromImg(img), id = 'pa_' + o.pid + '_' + Date.now().toString(36);
      Assets.put(id, data); zIn.value = 1; xIn.value = 0; yIn.value = 0; if (o.onImage) o.onImage(id, data); emit({ asset: id, zoom: 1, ox: 0, oy: 0 });
    } catch (e) { toast('Não consegui abrir essa imagem: ' + (e && e.message || 'formato inválido')); }
  } }, '📷 Foto do personagem');
  const rmBtn = h('button', { class: 'btn ghost', type: 'button', onclick: () => { emit({ asset: null, zoom: 1, ox: 0, oy: 0 }); } }, 'Sem foto');
  const sl = (min, max, step, val, fn) => h('input', { type: 'range', min, max, step, value: val, oninput: e => fn(parseFloat(e.target.value)) });
  const zIn = sl(1, 3, .02, ch.zoom || 1, v => emit({ zoom: v }));
  const xIn = sl(-1, 1, .02, ch.ox || 0, v => emit({ ox: v }));
  const yIn = sl(-1, 1, .02, ch.oy || 0, v => emit({ oy: v }));
  const crop = h('div', { class: 'crop' }, h('label', {}, 'Zoom', zIn), h('label', {}, '← →', xIn), h('label', {}, '↑ ↓', yIn));
  const frames = h('div', { class: 'chips' }, FRAMES.map(f => h('button', { type: 'button', class: 'chip', 'data-f': f[0], onclick: () => {
    ch.frame = f[0]; emit({ frame: f[0] });
  } }, f[1])));
  const colorIn = h('input', { type: 'color', value: ch.color || '#c9a227', oninput: e => emit({ color: e.target.value }) });
  const alphaIn = sl(.2, 1, .01, ch.alpha == null ? 1 : ch.alpha, v => emit({ alpha: v }));
  const states = h('div', { class: 'chips states' }, STATES.map(s => h('button', { type: 'button', class: 'chip st-' + s[0], 'data-s': s[0], onclick: () => emit({ state: s[0] }) }, s[1])));
  function sync() {
    frames.querySelectorAll('.chip').forEach(b => b.classList.toggle('on', b.dataset.f === ch.frame));
    states.querySelectorAll('.chip').forEach(b => b.classList.toggle('on', b.dataset.s === (ch.state || 'normal')));
    crop.style.display = ch.asset && ch.frame !== 'full' ? '' : 'none';
    if (document.activeElement !== alphaIn) alphaIn.value = ch.alpha == null ? 1 : ch.alpha;
  }
  const el = h('div', { class: 'ced' },
    h('div', { class: 'ced-top' }, prev, h('div', { class: 'ced-fields' }, nameIn, h('div', { class: 'btnrow' }, photoBtn, rmBtn))),
    crop,
    h('div', { class: 'lbl' }, 'Moldura'), frames,
    h('div', { class: 'two' }, h('label', {}, 'Cor', colorIn), h('label', {}, 'Opacidade', alphaIn)),
    o.showState ? h('div', {}, h('div', { class: 'lbl' }, 'Estado do personagem'), states) : null);
  el.sync = sync; sync(); draw();
  return el;
}

function startPlayer(code, cfg) {
  const root = $('#root'); root.innerHTML = '';
  let prof = store.get('vtt-player', null);
  if (!prof || !prof.pid) prof = { pid: 'p_' + Math.random().toString(36).slice(2, 9), name: '', char: { frame: 'circle', color: '#c9a227', alpha: 1, state: 'normal', asset: null } };
  prof.char = Object.assign({ frame: 'circle', color: '#c9a227', alpha: 1, state: 'normal', asset: null, zoom: 1, ox: 0, oy: 0 }, prof.char); prof.char.state = 'normal';
  const saved = store.get('vtt-passet', null); if (saved && saved.id === prof.char.asset && saved.data) Assets.put(saved.id, saved.data); else if (prof.char.asset && !Assets.has(prof.char.asset)) prof.char.asset = null;
  const persist = () => store.set('vtt-player', prof);
  const ch = prof.char; ch.name = prof.name || cfg.name || '';
  const upload = (id, data) => { store.set('vtt-passet', { id, data }); if (eng) eng.uploadAsset(id, data); };

  let net = null, eng = null, stage = null;

  /* ---- tela 1: criar personagem ---- */
  const editor = CharacterEditor({ pid: prof.pid, char: ch, onChange: p => { if (p.name) prof.name = p.name; persist(); }, onImage: (id, data) => store.set('vtt-passet', { id, data }) });
  const err = h('div', { class: 'err' });
  const enter = h('button', { class: 'btn primary big', onclick: async () => {
    if (!(ch.name || '').trim()) { err.textContent = 'Dê um nome ao seu personagem.'; return; }
    prof.name = ch.name.trim(); persist(); enter.disabled = true; enter.textContent = 'Conectando…'; err.textContent = '';
    try { if (cfg.cloud && Cloud.user) { cfg.characterId = await Cloud.saveCharacter(profileToChar(ch, cfg.characterId)); await Cloud.joinCampaign(code, cfg.characterId); } await connect(); } catch (e) { err.textContent = e.message || String(e); enter.disabled = false; enter.textContent = 'Entrar na mesa'; }
  } }, 'Entrar na mesa');
  root.append(h('div', { class: 'screen center' }, h('div', { class: 'card wide' },
    h('div', { class: 'eyebrow' }, 'Mesa ', h('b', {}, cfg.tableName || code), cfg.tableName ? h('span', { class: 'muted' }, '  ·  ' + code) : null),
    h('h2', {}, 'Seu personagem'),
    h('p', { class: 'muted' }, 'Escolha uma foto (ou deixe sem) e uma moldura. Você pode mudar tudo isso depois, durante o jogo.'),
    editor, err, h('div', { class: 'btnrow' }, enter, h('button', { class: 'btn ghost', onclick: () => goHome() }, 'Voltar')))));

  /* ---- tela 2: jogo ---- */
  async function connect() {
    net = new Net(makeTransport(Object.assign({}, cfg, { code })), prof.pid);
    let lastMsg = 0;
    const io = {
      send: (m, to) => net.send(m, to),
      update: () => { if (stage) stage.dirty = true; onView(); },
      welcome: d => { prof.name = d.char.name; },
      teleport: d => teleport(d.x, d.y),
      toast: msg => toast(msg),
    };
    eng = new PlayerEngine({ id: prof.pid, name: prof.name, char: ch }, io);
    net.on(m => { lastMsg = Date.now(); if (m.t === 'kick') { toast('O mestre removeu você da mesa.'); leave(true); return; } eng.handle(m); });
    await net.open();
    buildGame(lastMsgGetter => lastMsg);
    const hello = () => eng.hello();
    hello();
    const iv = setInterval(() => { if (!document.body.contains(stageEl)) { clearInterval(iv); return; } if (!eng.welcomed) hello(); else eng.ping(); updStatus(); }, 3000);
    net.onStatus = st => { if (st === 'reconnected') { hello(); toast('Reconectado.'); } else if (st === 'lost') toast('Conexão perdida. Tentando reconectar…'); };
    ch.state = 'normal';
    function lastMsgGetter() { return lastMsg; }
    updStatus.get = lastMsgGetter;
  }
  let stageEl, promptBtn, statusDot, waiting, fade, drawer, drawerEd, firstDone = false, updStatus = () => { };
  function buildGame() {
    root.innerHTML = '';
    stageEl = h('canvas', { class: 'stage' });
    promptBtn = h('button', { class: 'btn primary prompt', hidden: true, onclick: () => { const p = eng.view && eng.view.prompts[prof.pid]; if (p) eng.zone(p.zid); } });
    statusDot = h('span', { class: 'dot' });
    waiting = h('div', { class: 'waiting' }, h('div', {}, h('div', { class: 'spin' }), h('p', {}, 'Aguardando o mestre…'), h('small', {}, 'Mesa ' + code)));
    fade = h('div', { class: 'fade' });
    drawerEd = CharacterEditor({ pid: prof.pid, char: ch, showState: true, onChange: p => { prof.name = ch.name; persist(); eng.sendChar(p); }, onImage: (id, data) => upload(id, data) });
    drawer = h('div', { class: 'sheet', hidden: true }, h('div', { class: 'sheet-h' }, h('b', {}, 'Meu personagem'), h('button', { class: 'x', onclick: () => drawer.hidden = true }, '✕')), drawerEd);
    const ctrl = h('div', { class: 'hud-br' },
      h('button', { class: 'fab', title: 'Centralizar em mim', onclick: () => center(true) }, '◎'),
      h('button', { class: 'fab', title: 'Aproximar', onclick: () => zoomBy(1.25) }, '+'),
      h('button', { class: 'fab', title: 'Afastar', onclick: () => zoomBy(.8) }, '−'));
    root.append(h('div', { class: 'play' }, stageEl, waiting, fade,
      h('div', { class: 'hud-tl' }, h('div', { class: 'pill' }, statusDot, 'Mesa ', h('b', {}, code)), h('button', { class: 'pill btn-pill', onclick: () => leave(false) }, 'Sair')),
      h('div', { class: 'hud-bl' }, h('button', { class: 'me', onclick: () => { drawer.hidden = !drawer.hidden; drawerEd.sync(); } }, miniAvatar(), h('span', {}, ch.name))),
      ctrl, h('div', { class: 'hud-b' }, promptBtn), drawer));
    stage = new Stage(stageEl);
    stage.drawFn = (ctx, W, H, dpr, t, dark) => {
      const v = eng.view; if (!v) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); return false; }
      const scene = { grid: v.grid, showGrid: v.showGrid, areas: v.areas, elements: v.elements, walls: v.walls, zones: [], fog: v.fog, lights: v.lights, tokens: v.tokens };
      renderScene(ctx, W, H, dpr, scene, stage.cam, { master: false, time: t, dark, ownId: prof.pid });
      return sceneAnimated(scene);
    };
    bindPointer();
    updStatus = () => { const age = Date.now() - (updStatus.get ? updStatus.get() : 0); statusDot.className = 'dot ' + (eng.welcomed && age < 25000 ? 'ok' : age < 60000 ? 'warn' : 'bad'); };
    stage.cam.z = .6;
  }
  const miniC = h('canvas', { width: 64, height: 64 });
  function miniAvatar() {
    const draw = () => { const c = miniC.getContext('2d'); c.clearRect(0, 0, 64, 64); drawTokenAt(c, { id: prof.pid, name: ch.name, asset: ch.asset, frame: ch.frame, zoom: ch.zoom, ox: ch.ox, oy: ch.oy, color: ch.color, state: ch.state, alpha: 1 }, 32, 32, 54, { s: 1, time: performance.now() }); };
    draw(); const iv = setInterval(() => { if (!miniC.isConnected) clearInterval(iv); else draw(); }, 200); return miniC;
  }
  function zoomBy(f) { stage.zoomAt(stage.cv.getBoundingClientRect().left + stage.cssW / 2, stage.cv.getBoundingClientRect().top + stage.cssH / 2, f); }
  function center(zoomToo) {
    const t = eng && eng.myToken(); if (!t) return; const g = eng.view.grid;
    stage.centerOn(t.x, t.y, zoomToo ? clamp(Math.min(stage.cssW, stage.cssH) / (g * 11), .3, 2) : null);
  }
  function onView() {
    const v = eng.view; if (!v) return; waiting.style.display = 'none';
    const t = eng.myToken();
    if (t) {
      for (const k of ['state', 'alpha', 'frame', 'zoom', 'ox', 'oy', 'color', 'name', 'asset']) if (t[k] !== undefined && !(k === 'asset' && !t[k] && ch.asset && !Assets.has(ch.asset))) ch[k] = t[k];
      if (!firstDone) { firstDone = true; center(true); }
    }
    if (!drawer.hidden) drawerEd.sync();
    const p = v.prompts && v.prompts[prof.pid];
    promptBtn.hidden = !p;
    if (p) { promptBtn.textContent = (p.locked ? '🔒 ' : '') + p.verb + (p.name ? ' — ' + p.name : ''); promptBtn.classList.toggle('locked', p.locked); }
  }
  function teleport(x, y) {
    fade.classList.add('on');
    setTimeout(() => { stage.centerOn(x, y); fade.classList.remove('on'); }, 300);
  }
  function leave(kicked) {
    try { if (net) { eng.io.send({ t: 'bye' }); setTimeout(() => net.close(), 150); } } catch (e) { /* */ }
    if (stage) stage.destroy(); goHome();
  }

  /* ---- ponteiro: arrastar o próprio token / mover mapa / pinça ---- */
  function bindPointer() {
    const cv = stageEl, ptrs = new Map(); let drag = null, pinch = null;
    const myTok = () => eng.myToken();
    cv.addEventListener('contextmenu', e => e.preventDefault());
    cv.addEventListener('wheel', e => { e.preventDefault(); stage.zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : .89); }, { passive: false });
    cv.addEventListener('pointerdown', e => {
      cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) }; drag = null; eng.dragging = false; return; }
      const t = myTok(), w = stage.toWorld(e.clientX, e.clientY);
      if (t && e.button === 0 && dist(w[0], w[1], t.x, t.y) <= (t.size * eng.view.grid) / 2 + 12 / stage.cam.z) { drag = { mode: 'tok', dx: t.x - w[0], dy: t.y - w[1] }; eng.dragging = true; }
      else drag = { mode: 'pan', x: e.clientX, y: e.clientY, cx: stage.cam.x, cy: stage.cam.y };
    });
    cv.addEventListener('pointermove', e => {
      if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && ptrs.size === 2) {
        const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
        stage.zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, d / pinch.d); pinch.d = d; return;
      }
      if (!drag) return;
      if (drag.mode === 'pan') { stage.cam.x = drag.cx - (e.clientX - drag.x) / stage.cam.z; stage.cam.y = drag.cy - (e.clientY - drag.y) / stage.cam.z; stage.dirty = true; }
      else { const w = stage.toWorld(e.clientX, e.clientY), t = myTok(); if (t) { t.x = w[0] + drag.dx; t.y = w[1] + drag.dy; stage.dirty = true; eng.move(t.x, t.y, false); } }
    });
    const up = e => {
      ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
      if (drag && drag.mode === 'tok') { const t = myTok(); if (t) eng.move(t.x, t.y, true); eng.dragging = false; }
      if (ptrs.size === 0) drag = null;
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  }
}
