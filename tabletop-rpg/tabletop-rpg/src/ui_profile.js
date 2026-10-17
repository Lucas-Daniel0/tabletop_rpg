'use strict';
/* ===== ui_profile.js — perfil sempre visível, ajustes, seletor de temas, marca clicável e a página Home ===== */

/* navegação: a tela atual pode registrar um "guard" (salvar/confirmar) antes de ir para outro lugar */
const APP = { guard: null };
function resetScreen() { APP.guard = null; }
function navHome() { const go = () => { APP.guard = null; goHome(); }; if (APP.guard) APP.guard(go); else go(); }
function navDo(go) { if (APP.guard) APP.guard(() => { APP.guard = null; go(); }); else go(); }

/* ---------- quem sou eu (conta, ou apenas este navegador) ---------- */
function me() {
  const on = !!(Cloud.ready && Cloud.user), P = on ? Cloud.profile : null;
  return {
    logged: on, guest: on && Cloud.isGuest, email: on && Cloud.user.email || '',
    name: (P && P.display_name) || Prefs.v.nick || (on ? 'Aventureiro' : 'Visitante'),
    avatar: on ? ((P && P.avatar) || (Cloud.noExt ? Prefs.v.avatar : '')) : Prefs.v.avatar || ''
  };
}
function avatarEl(m, cls) {
  const e = h('span', { class: 'avatar' + (cls ? ' ' + cls : '') });
  if (m.avatar) e.append(h('img', { src: m.avatar, alt: '' })); else e.textContent = (m.name || '?').trim().charAt(0).toUpperCase() || '?';
  return e;
}
function squareAvatar(img, px) { // recorte central quadrado
  const w = img.naturalWidth || img.width, hh = img.naturalHeight || img.height, s = Math.min(w, hh), cv = document.createElement('canvas'); cv.width = cv.height = px;
  const c = cv.getContext('2d'); c.imageSmoothingQuality = 'high'; c.fillStyle = '#111'; c.fillRect(0, 0, px, px); c.drawImage(img, (w - s) / 2, (hh - s) / 2, s, s, 0, 0, px, px);
  return cv.toDataURL('image/jpeg', .86);
}

/* ---------- marca ---------- */
const taglineEl = () => h('p', { class: 'tagline', 'data-tagline': '' }, THEMES[Prefs.v.theme].tag);
function brandHero() { return h('div', { class: 'brand' }, brandMark(64), h('div', { class: 'logo big' }, 'TABLETOP'), taglineEl()); }
function brandLink(size) {
  return h('button', { class: 'brandlink', type: 'button', title: 'Ir para o início', 'aria-label': 'Ir para o início', onclick: navHome }, brandMark(size || 24), h('span', { class: 'wordmark' }, 'TABLETOP'));
}
function logoPill() { return h('button', { class: 'pill btn-pill logo-pill', type: 'button', title: 'Ir para o início', 'aria-label': 'Ir para o início', onclick: navHome }, brandMark(22)); }

/* ---------- seletor de tema (Clássico | D&D | Ordem Paranormal) ---------- */
const MODE_NOTE = {
  classic: 'Visual sóbrio e neutro, sem enfeites.',
  dnd: 'Escolha a classe do seu herói: cada uma traz cores, tipografia de fantasia e ornamentos próprios.',
  ordem: 'A Ordem, os cultistas e os elementos paranormais: dossiê, carimbos e tipografia de arquivo.'
};
function themePicker() {
  const box = h('div', { class: 'themepick' });
  let mode = THEMES[Prefs.v.theme].mode;
  const draw = () => {
    box.innerHTML = '';
    box.append(
      h('div', { class: 'modetabs' }, Object.entries(THEME_MODES).map(([k, l]) => h('button', { type: 'button', class: 'chip' + (mode === k ? ' on' : ''), onclick: () => {
        mode = k; if (THEMES[Prefs.v.theme].mode !== k) Prefs.set({ theme: THEME_ORDER.find(id => THEMES[id].mode === k) }); draw();
      } }, l))),
      h('p', { class: 'muted sm', style: 'margin:0' }, MODE_NOTE[mode]),
      h('div', { class: 'themegrid' }, THEME_ORDER.filter(id => THEMES[id].mode === mode).map(id => themeSwatch(id, { on: Prefs.v.theme === id, onclick: () => { Prefs.set({ theme: id }); draw(); } }))));
  };
  draw(); return box;
}

/* ---------- ajustes ---------- */
function settingsModal(tab) {
  tab = tab || 'perfil';
  const body = h('div', { class: 'setmodal' }), tabs = h('div', { class: 'stabs' }), pane = h('div');
  body.append(tabs, pane);
  const st = { nick: me().name === 'Visitante' ? '' : me().name, avatar: me().avatar, changedAvatar: false };
  const go = t => { tab = t; draw(); };
  function draw() {
    tabs.innerHTML = ''; pane.innerHTML = '';
    for (const [k, l] of [['perfil', 'Perfil'], ['look', 'Aparência'], ['conta', 'Conta']]) tabs.append(h('button', { type: 'button', class: k === tab ? 'on' : '', onclick: () => go(k) }, l));
    if (tab === 'perfil') perfil(); else if (tab === 'look') look(); else conta();
  }
  function perfil() {
    const prev = h('div'); const paint = () => { prev.innerHTML = ''; prev.append(avatarEl({ name: st.nick || me().name, avatar: st.avatar }, 'xl')); };
    paint();
    const pick = h('button', { class: 'btn small', type: 'button', onclick: async () => {
      const f = await pickFile(IMG_ACCEPT); if (!f) return;
      try { const img = await loadImgFile(f); st.avatar = squareAvatar(img, 160); st.changedAvatar = true; paint(); } catch (e) { toast('Não consegui abrir a imagem: ' + (e && e.message || 'formato inválido')); }
    } }, '🖼 Trocar foto');
    const rm = h('button', { class: 'btn small ghost', type: 'button', onclick: () => { st.avatar = ''; st.changedAvatar = true; paint(); } }, 'Remover foto');
    const nick = h('input', { type: 'text', maxlength: 24, value: st.nick, placeholder: 'Como você quer ser chamado', oninput: e => { st.nick = e.target.value; paint(); } });
    const err = h('div', { class: 'err' });
    const save = h('button', { class: 'btn primary', type: 'button' }, 'Salvar perfil');
    save.onclick = busy(save, async () => {
      err.textContent = ''; const name = st.nick.trim(); if (!name) { err.textContent = 'Digite um apelido.'; return; }
      Prefs.set({ nick: name, avatar: st.avatar }, true);
      try {
        if (Cloud.ready && Cloud.user && Cloud.profile) {
          await Cloud.updateProfile({ display_name: name });
          if (st.changedAvatar) { const ok = await Cloud.saveAvatar(st.avatar); if (!ok) toast('Foto salva só neste navegador (falta rodar a migração 002 no Supabase).', 4200); }
        }
      } catch (e) { err.textContent = friendlyAuthError(e); return; }
      st.changedAvatar = false; paintDock(); toast('Perfil salvo.');
    }, 'Salvando…');
    pane.append(h('div', { class: 'avedit' }, prev, h('div', {}, h('div', { class: 'btnrow', style: 'margin:0' }, pick, rm), h('p', { class: 'muted sm', style: 'margin:6px 0 0' }, 'A foto é recortada em quadrado. PNG, JPG, WEBP…'))),
      h('label', { class: 'f' }, 'Apelido', nick), err, h('div', { class: 'btnrow' }, save));
  }
  function look() {
    const mot = h('input', { type: 'checkbox', checked: Prefs.v.motion, onchange: e => Prefs.set({ motion: e.target.checked }) });
    pane.append(h('div', { class: 'lbl', style: 'margin-top:0' }, 'Tema da interface'), themePicker(),
      h('div', { class: 'srow', style: 'margin-top:12px' }, h('div', {}, 'Animações da interface', h('small', {}, 'Cintilar, transições e brilhos. Desligue se incomodar.')), h('label', { class: 'switch' }, mot, h('i'))),
      h('p', { class: 'muted sm' }, Cloud.ready && Cloud.user ? 'O tema acompanha sua conta em qualquer aparelho.' : 'Sem conta, o tema fica salvo neste navegador.'));
  }
  function conta() {
    const m = me();
    pane.append(h('div', { class: 'srow' }, h('div', {}, 'Situação', h('small', {}, m.logged ? (m.guest ? 'Convidado — mesas e personagens ficam neste acesso.' : 'Conta' + (m.email ? ' · ' + m.email : '')) : 'Sem conta (modo local, só neste navegador).'))),
      m.guest ? h('div', { class: 'btnrow' }, h('button', { class: 'btn primary', onclick: () => { close(); upgradeGuestModal(); } }, 'Criar conta de verdade')) : null,
      h('div', { class: 'btnrow' }, h('button', { class: 'btn', onclick: () => { close(); navHome(); } }, '🏠 Ir para o início'),
        m.logged ? h('button', { class: 'btn danger', onclick: () => { close(); doSignOut(); } }, 'Sair da conta') : h('button', { class: 'btn primary', onclick: () => { close(); navDo(() => showAuth()); } }, 'Entrar ou criar conta')));
  }
  const M = modal('Perfil e ajustes', body, [{ label: 'Fechar', cls: 'primary' }]), close = M.close; draw();
}
function doSignOut() { navDo(async () => { await Cloud.signOut(); Prefs.set({ nick: '', avatar: '' }, true); paintDock(); showAuth(); }); }

/* ---------- chip de perfil (sempre na tela) ---------- */
function mountDock() { if (!$('#dock')) document.body.append(h('div', { id: 'dock' })); paintDock(); }
function closePMenu() { const m = $('.pmenu'); if (m) m.remove(); document.removeEventListener('pointerdown', pmOff, true); document.removeEventListener('keydown', pmEsc); }
function pmOff(e) { const m = $('.pmenu'); if (m && !m.contains(e.target) && !e.target.closest('.pchip')) closePMenu(); }
function pmEsc(e) { if (e.key === 'Escape') closePMenu(); }
function paintDock() {
  const d = $('#dock'); if (!d) return; const m = me(); d.innerHTML = '';
  d.append(h('button', { class: 'pchip', type: 'button', title: m.name + ' — perfil e ajustes', 'aria-haspopup': 'menu', onclick: () => { if ($('.pmenu')) closePMenu(); else openPMenu(); } }, avatarEl(m), h('span', { class: 'nm' }, m.name), h('span', { class: 'car' }, '▾')));
  if ($('.pmenu')) { closePMenu(); openPMenu(); }
}
function openPMenu() {
  closePMenu(); const m = me();
  const item = (ic, label, fn, cls) => h('button', { class: 'mi2' + (cls ? ' ' + cls : ''), type: 'button', role: 'menuitem', onclick: () => { closePMenu(); fn(); } }, h('span', { class: 'ic' }, ic), label);
  const quick = h('div', { class: 'qdots' }, THEME_ORDER.map(id => {
    const t = THEMES[id], cv = h('canvas', { width: 32, height: 32, 'data-tm': id }); drawThemeIcon(cv.getContext('2d'), id, 32);
    return h('button', { type: 'button', class: Prefs.v.theme === id ? 'on' : '', title: (THEME_MODES[t.mode] === 'Clássico' ? '' : THEME_MODES[t.mode] + ' · ') + t.name, style: 'background:' + t.pal.bg2 + ';border-color:' + (Prefs.v.theme === id ? '' : t.pal.line), onclick: () => { Prefs.set({ theme: id }); closePMenu(); openPMenu(); } }, cv);
  }));
  const menu = h('div', { class: 'pmenu', role: 'menu' },
    h('div', { class: 'who2' }, avatarEl(m, 'lg'), h('div', { style: 'min-width:0' }, h('b', {}, m.name), h('span', { class: 'muted sm' }, m.logged ? (m.guest ? 'Convidado' : (m.email || 'Conta')) : 'Sem conta · modo local'))),
    item('🏠', 'Início', navHome), item('⚙', 'Perfil e ajustes', () => settingsModal('perfil')), item('🎨', 'Temas e aparência', () => settingsModal('look')),
    h('div', { class: 'quick' }, h('div', { class: 'lbl' }, 'Tema rápido'), quick), h('hr'),
    m.guest ? item('✨', 'Criar conta', upgradeGuestModal) : null,
    m.logged ? item('⎋', 'Sair da conta', doSignOut, 'dng') : item('→', 'Entrar ou criar conta', () => navDo(() => showAuth())));
  document.body.append(menu); setTimeout(() => { document.addEventListener('pointerdown', pmOff, true); document.addEventListener('keydown', pmEsc); }, 0);
}

/* ---------- Home ---------- */
const HOME_GLYPH = { master: 'd20', player: 'mask' };
async function showHome() {
  resetScreen(); closePMenu();
  const root = $('#root'); root.innerHTML = ''; const P = Cloud.profile || await Cloud.loadProfile(), guest = Cloud.isGuest, M = me();
  const hero = h('section', { class: 'hero' }), mesasEl = h('div', { class: 'hgrid' }, h('p', { class: 'muted' }, 'Carregando…')), partEl = h('div', { class: 'hgrid' }), chars = h('div', { class: 'hgrid' });
  const codeIn = h('input', { type: 'text', class: 'code', maxlength: 8, placeholder: 'CÓDIGO', 'aria-label': 'Código da mesa', oninput: e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); } });
  const err = h('div', { class: 'err' });
  const join = h('button', { class: 'btn' }, 'Entrar na mesa'); join.onclick = busy(join, async () => { if (codeIn.value.trim().length < 3) { err.textContent = 'Digite o código da mesa.'; return; } err.textContent = ''; await enterTable(codeIn.value.trim(), null, err); }, 'Entrando…');
  codeIn.addEventListener('keydown', e => { if (e.key === 'Enter') join.click(); });
  const newC = h('button', { class: 'btn primary' }, '＋ Nova campanha');
  newC.onclick = busy(newC, async () => { try { const row = await Cloud.createCampaign('Nova campanha'); startMaster({ cloud: await Cloud.loadCampaign(row.id) }); } catch (e) { toast(friendlyAuthError(e)); } }, 'Criando…');
  const last = store.get('vtt-last', null);
  const cont = last && (last.role === 'master' ? last.id : last.code) ? h('button', { class: 'btn', title: 'Continuar de onde parou' }, '▶ Continuar: ' + (last.name || (last.role === 'master' ? 'campanha' : 'mesa ' + last.code))) : null;
  if (cont) cont.onclick = busy(cont, async () => {
    try { if (last.role === 'master') startMaster({ cloud: await Cloud.loadCampaign(last.id) }); else await enterTable(last.code); } catch (e) { store.set('vtt-last', null); toast(friendlyAuthError(e)); cont.remove(); }
  }, 'Abrindo…');
  const tagEl = h('p', { class: 'tagline', style: 'margin:0' }), greetEl = h('h1', {});
  const paintHero = () => { if (!hero.isConnected) return 'off'; tagEl.textContent = THEMES[Prefs.v.theme].tag; };
  greetEl.textContent = 'Olá, ' + (P && P.display_name || M.name) + '!';
  hero.append(brandMark(92), h('div', { class: 'htxt' }, greetEl, h('i', { class: 'rule' }), tagEl,
    h('div', { class: 'qa' }, cont, newC, h('div', { class: 'joinbox' }, codeIn, join)), err));
  hero.querySelector('canvas').classList.add('sigil');
  root.append(h('div', { class: 'screen home' },
    h('header', { class: 'homebar' }, brandLink(26), h('span', {})),
    guest ? h('div', { class: 'guestnote' }, 'Você está como convidado. Crie uma conta (menu do perfil, no canto) para não perder suas mesas e personagens se trocar de aparelho.') : null,
    hero,
    h('section', { class: 'hsec' }, h('h3', {}, 'Minhas mesas ', h('span', { class: 'count', id: 'cnt-m' })), mesasEl),
    h('section', { class: 'hsec' }, h('h3', {}, 'Mesas em que jogo ', h('span', { class: 'count', id: 'cnt-p' })), partEl),
    h('section', { class: 'hsec' }, h('h3', {}, 'Meus personagens'), chars, h('div', { class: 'btnrow' }, h('button', { class: 'btn', onclick: () => charModal() }, '＋ Novo personagem'))),
    h('section', { class: 'hsec' }, h('h3', {}, 'Aparência'), h('div', { class: 'card nodeco', style: 'width:auto' }, themePicker()))));

  Prefs.on(paintHero); paintHero();
  async function load() {
    try {
      const ms = await Cloud.myCampaigns(), mine = ms.filter(m => m.role === 'master'), part = ms.filter(m => m.role !== 'master');
      mesasEl.innerHTML = ''; partEl.innerHTML = ''; $('#cnt-m').textContent = mine.length ? '(' + mine.length + ')' : ''; $('#cnt-p').textContent = part.length ? '(' + part.length + ')' : '';
      if (!mine.length) mesasEl.append(h('div', { class: 'emptybox' }, 'Nenhuma campanha ainda. Use “＋ Nova campanha” para montar a sua mesa.'));
      if (!part.length) partEl.append(h('div', { class: 'emptybox' }, 'Você ainda não entrou em nenhuma mesa. Peça o código ao seu mestre e digite acima.'));
      const icon = k => brandMark(34, HOME_GLYPH[k]);
      for (const m of mine) mesasEl.append(h('div', { class: 'mesa' + (last && last.id === m.id ? ' last' : '') }, icon('master'), h('div', { class: 'mi' }, h('b', {}, m.name), h('span', { class: 'muted sm' }, 'código ' + m.code)),
        h('div', { class: 'ma' }, h('button', { class: 'btn small primary', onclick: async e => { e.target.disabled = true; try { startMaster({ cloud: await Cloud.loadCampaign(m.id) }); } catch (x) { toast(friendlyAuthError(x)); e.target.disabled = false; } } }, 'Abrir'),
          h('button', { class: 'btn small', title: 'Renomear', onclick: () => renameModal(m) }, '✎'),
          h('button', { class: 'btn small danger', title: 'Excluir', onclick: () => askConfirm('Excluir "' + m.name + '" para sempre? Mapas, luzes e tudo da campanha serão apagados.', async () => { try { await Cloud.deleteCampaign(m.id); if (last && last.id === m.id) store.set('vtt-last', null); load(); } catch (x) { toast(friendlyAuthError(x)); } }, 'Excluir') }, '🗑'))));
      for (const m of part) partEl.append(h('div', { class: 'mesa' + (last && last.code === m.code ? ' last' : '') }, icon('player'), h('div', { class: 'mi' }, h('b', {}, m.name), h('span', { class: 'muted sm' }, 'código ' + m.code)),
        h('div', { class: 'ma' }, h('button', { class: 'btn small primary', onclick: () => enterTable(m.code) }, 'Jogar'), h('button', { class: 'btn small ghost', title: 'Sair da mesa', onclick: () => askConfirm('Sair da mesa "' + m.name + '"? Você poderá voltar com o código.', async () => { try { await Cloud.leaveCampaign(m.id); load(); } catch (x) { toast(friendlyAuthError(x)); } }, 'Sair da mesa') }, 'Sair'))));
    } catch (e) { mesasEl.innerHTML = ''; mesasEl.append(h('div', { class: 'err' }, friendlyAuthError(e))); }
    try {
      const cs = await Cloud.myCharacters(); chars.innerHTML = '';
      if (!cs.length) chars.append(h('div', { class: 'emptybox' }, 'Crie um personagem para entrar nas mesas rapidamente.'));
      for (const c of cs) {
        const cv = h('canvas', { width: 96, height: 96, class: 'pav' }); const pc = charToProfile(c);
        const paint = () => drawTokenAt(cv.getContext('2d'), { id: c.id, name: c.name, asset: pc.asset, frame: pc.frame, zoom: pc.zoom, ox: pc.ox, oy: pc.oy, color: pc.color, state: 'normal', alpha: 1 }, 48, 48, 84, { s: 1.5, time: 0 }); paint(); setTimeout(paint, 250);
        chars.append(h('div', { class: 'mesa' }, cv, h('div', { class: 'mi' }, h('b', {}, c.name)), h('div', { class: 'ma' }, h('button', { class: 'btn small', onclick: () => charModal(c) }, 'Editar'),
          h('button', { class: 'btn small danger', onclick: () => askConfirm('Excluir o personagem "' + c.name + '"?', async () => { try { await Cloud.deleteCharacter(c.id); load(); } catch (x) { toast(friendlyAuthError(x)); } }, 'Excluir') }, '🗑'))));
      }
    } catch (e) { chars.innerHTML = ''; chars.append(h('div', { class: 'err' }, friendlyAuthError(e))); }
  }
  function renameModal(m) {
    const i = h('input', { type: 'text', maxlength: 40, value: m.name }); modal('Renomear campanha', i, [{ label: 'Cancelar' }, { label: 'Salvar', cls: 'primary', fn: () => { Cloud.renameCampaign(m.id, i.value.trim() || m.name).then(load).catch(x => toast(friendlyAuthError(x))); } }]);
  }
  function charModal(c) {
    const ch = c ? charToProfile(c) : { name: '', frame: 'circle', color: '#c9a227', alpha: 1, state: 'normal', asset: null, zoom: 1, ox: 0, oy: 0 };
    const ed = CharacterEditor({ pid: userPid(), char: ch, onChange: () => { } });
    modal(c ? 'Editar personagem' : 'Novo personagem', ed, [{ label: 'Cancelar' }, { label: 'Salvar', cls: 'primary', fn: () => { if (!(ch.name || '').trim()) { toast('Dê um nome ao personagem.'); return false; } Cloud.saveCharacter(profileToChar(ch, c && c.id)).then(load).catch(x => toast(friendlyAuthError(x))); } }]);
  }
  load();
}
