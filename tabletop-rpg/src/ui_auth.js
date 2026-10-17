'use strict';
/* ===== ui_auth.js — login, onboarding e painel "Minhas mesas" ===== */

const PENDING_KEY = 'vtt-pending-join';
const setPending = c => { try { sessionStorage.setItem(PENDING_KEY, c || ''); } catch (e) { /* */ } };
const takePending = () => { try { const c = sessionStorage.getItem(PENDING_KEY); sessionStorage.removeItem(PENDING_KEY); return c || ''; } catch (e) { return ''; } };
const userPid = () => 'u_' + String(Cloud.user.id).replace(/-/g, '').slice(0, 12);
const stepDots = (n, of) => h('div', { class: 'dots' }, Array.from({ length: of }, (_, i) => h('i', { class: i < n ? 'on' : '' })));
function busy(btn, fn, label) {
  return async (...a) => { const t = btn.textContent; btn.disabled = true; if (label) btn.textContent = label; try { await fn(...a); } finally { btn.disabled = false; btn.textContent = t; } };
}

/* ---------- login / cadastro ---------- */
function showAuth(opts) {
  opts = opts || {}; resetScreen(); const root = $('#root'); root.innerHTML = '';
  let mode = opts.mode || 'in', guestOpen = false;
  const err = h('div', { class: 'err' }), info = h('div', { class: 'okmsg' });
  const nameIn = h('input', { type: 'text', placeholder: 'Seu nome', maxlength: 24, autocomplete: 'name' });
  const mailIn = h('input', { type: 'text', inputmode: 'email', placeholder: 'e-mail', autocomplete: 'email', autocapitalize: 'off' });
  const passIn = h('input', { type: 'password', placeholder: 'senha (mín. 6 caracteres)', autocomplete: mode === 'up' ? 'new-password' : 'current-password' });
  const guestName = h('input', { type: 'text', placeholder: 'Como quer ser chamado?', maxlength: 24 });
  const say = (e, i) => { err.textContent = e || ''; info.textContent = i || ''; };
  const submit = h('button', { class: 'btn primary big', type: 'button' });
  const mailOk = () => { const m = mailIn.value.trim(); if (!/^\S+@\S+\.\S+$/.test(m)) { say('Digite um e-mail válido.'); return null; } return m; };
  const doSubmit = busy(submit, async () => {
    say(); const m = mailOk(); if (!m) return; if (passIn.value.length < 6) { say('A senha precisa ter pelo menos 6 caracteres.'); return; }
    try {
      if (mode === 'up') { const r = await Cloud.signUp(m, passIn.value, nameIn.value.trim()); if (r.needsConfirm) { say('', 'Enviamos um e-mail de confirmação. Clique no link e volte aqui para entrar.'); return; } }
      else await Cloud.signIn(m, passIn.value);
      await afterLogin();
    } catch (e) { say(friendlyAuthError(e)); }
  }, 'Aguarde…');
  submit.onclick = () => doSubmit();
  const magic = h('button', { class: 'btn', type: 'button' }, 'Receber link de acesso por e-mail');
  magic.onclick = busy(magic, async () => { say(); const m = mailOk(); if (!m) return; try { await Cloud.magicLink(m); say('', 'Link enviado para ' + m + '. Abra o e-mail neste aparelho.'); } catch (e) { say(friendlyAuthError(e)); } }, 'Enviando…');
  const google = h('button', { class: 'btn gbtn', type: 'button' }, h('span', { class: 'g' }, 'G'), 'Continuar com Google');
  google.onclick = async () => { say(); try { await Cloud.google(); } catch (e) { say(friendlyAuthError(e)); } };
  const forgot = h('button', { class: 'linkbtn', type: 'button' }, 'Esqueci a senha');
  forgot.onclick = async () => { say(); const m = mailOk(); if (!m) return; try { await Cloud.resetPassword(m); say('', 'Enviamos um link para redefinir a senha.'); } catch (e) { say(friendlyAuthError(e)); } };
  const guestBtn = h('button', { class: 'btn', type: 'button' }, 'Entrar como convidado');
  guestBtn.onclick = busy(guestBtn, async () => {
    say(); if (!guestOpen) { guestOpen = true; guestBox.hidden = false; guestName.focus(); return; }
    if (!guestName.value.trim()) { say('Diga como quer ser chamado.'); return; }
    try { await Cloud.signInGuest(guestName.value.trim()); await afterLogin(); } catch (e) { say(friendlyAuthError(e)); }
  }, 'Entrando…');
  const guestBox = h('div', { hidden: true }, guestName, h('p', { class: 'muted sm' }, 'Convidados jogam normalmente. Dá para transformar em conta depois, sem perder personagem nem mesas.'));
  const tabIn = h('button', { class: 'tab', type: 'button', onclick: () => { mode = 'in'; paint(); } }, 'Entrar'), tabUp = h('button', { class: 'tab', type: 'button', onclick: () => { mode = 'up'; paint(); } }, 'Criar conta');
  const nameRow = h('label', { class: 'f' }, 'Nome', nameIn), passRow = h('label', { class: 'f' }, 'Senha', passIn);
  function paint() {
    tabIn.classList.toggle('on', mode === 'in'); tabUp.classList.toggle('on', mode === 'up'); nameRow.hidden = mode !== 'up'; forgot.hidden = mode !== 'in';
    submit.textContent = mode === 'up' ? 'Criar minha conta' : 'Entrar'; passIn.autocomplete = mode === 'up' ? 'new-password' : 'current-password'; say();
  }
  root.append(h('div', { class: 'screen center' },
    brandHero(),
    h('div', { class: 'card authcard' },
      opts.joinCode ? h('div', { class: 'invite' }, 'Você foi convidado para a mesa ', h('b', {}, opts.joinCode), '. Entre ou crie uma conta rápida para continuar.') : null,
      h('div', { class: 'tabs' }, tabIn, tabUp), nameRow,
      h('label', { class: 'f' }, 'E-mail', mailIn), passRow, err, info, submit, forgot,
      h('div', { class: 'or' }, h('span', {}, 'ou')), google, magic, guestBtn, guestBox),
    h('button', { class: 'linkbtn', onclick: () => showLobby() }, 'Usar sem conta (modo local, só para testes neste navegador)')));
  paint();
  [mailIn, passIn, guestName].forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') (i === guestName ? guestBtn : submit).click(); }));
}

async function afterLogin() {
  const p = await Cloud.loadProfile();
  if (!p.onboarded) return showOnboarding();
  return routeAfterAuth();
}
function routeAfterAuth() {
  const hs = parseHash(), code = (takePending() || (hs.join || '')).toUpperCase();
  if (code) { history.replaceState(null, '', location.pathname + location.search); return enterTable(code); }
  return showHome();
}

/* ---------- onboarding (3 passos) ---------- */
function showOnboarding() {
  resetScreen(); const root = $('#root'); root.innerHTML = ''; const P = Cloud.profile || {}, guest = Cloud.isGuest;
  const st = { name: P.display_name || '', role: guest ? 'player' : (P.default_role === 'master' ? 'master' : 'player'), both: false, charName: '', campName: '' };
  const ch = { name: '', frame: 'circle', color: '#c9a227', alpha: 1, state: 'normal', asset: null, zoom: 1, ox: 0, oy: 0 }; let step = 1;
  const total = () => guest ? 2 : (st.role === 'player' ? 2 : 3);
  const err = h('div', { class: 'err' });
  const wrap = h('div', { class: 'screen center' }); root.append(wrap);
  function card(...kids) { wrap.innerHTML = ''; wrap.append(brandHero(), h('div', { class: 'card wide' }, stepDots(step, total()), ...kids)); }
  function s1() {
    step = 1; const nameIn = h('input', { type: 'text', maxlength: 24, placeholder: 'Seu nome', value: st.name, oninput: e => st.name = e.target.value });
    const role = (id, title, desc) => h('button', { type: 'button', class: 'rolecard' + (st.role === id ? ' on' : ''), onclick: () => { st.role = id; s1(); } }, h('b', {}, title), h('span', { class: 'muted sm' }, desc));
    const next = h('button', { class: 'btn primary big', onclick: () => { if (!st.name.trim()) { err.textContent = 'Diga como podemos te chamar.'; return; } err.textContent = ''; st.role === 'master' ? s3() : s2(); } }, 'Continuar');
    card(h('h2', {}, 'Como podemos te chamar?'), nameIn,
      guest ? h('p', { class: 'muted sm' }, 'Você está como convidado: vai poder jogar nas mesas que receberem você.') : h('div', {}, h('div', { class: 'lbl' }, 'Você vai usar mais como…'),
        h('div', { class: 'roles' }, role('master', '🎲 Mestre', 'Monto mapas, controlo luz, névoa e criaturas.'), role('player', '🕯 Jogador', 'Entro nas mesas com meu personagem.')), h('p', { class: 'muted sm' }, 'Sem compromisso: você pode mestrar e jogar com a mesma conta.')),
      err, next);
  }
  function s2() {
    step = 2; ch.name = ch.name || st.charName; const ed = CharacterEditor({ pid: userPid(), char: ch, onChange: p => { if (p.name) st.charName = p.name; } });
    const fin = h('button', { class: 'btn primary big' }, 'Criar personagem e continuar'), skip = h('button', { class: 'btn ghost' }, 'Pular por enquanto');
    const done = async (save) => { err.textContent = ''; try { if (save) { if (!(ch.name || '').trim()) { err.textContent = 'Dê um nome ao personagem (ou pule).'; return; } await Cloud.saveCharacter(profileToChar(ch)); } await finish(); } catch (e) { err.textContent = friendlyAuthError(e); } };
    fin.onclick = busy(fin, () => done(true), 'Salvando…'); skip.onclick = busy(skip, () => done(false));
    card(h('h2', {}, 'Seu primeiro personagem'), h('p', { class: 'muted' }, 'Escolha foto (PNG, JPG, JFIF, WEBP…), moldura e cor. Dá para mudar quando quiser.'), ed, err, h('div', { class: 'btnrow' }, fin, skip));
  }
  function s3() {
    step = guest ? 2 : 2; const nameIn = h('input', { type: 'text', maxlength: 40, placeholder: 'ex.: A Ilha do Segredo', value: st.campName, oninput: e => st.campName = e.target.value });
    const go = h('button', { class: 'btn primary big' }, 'Criar campanha e abrir o editor');
    go.onclick = busy(go, async () => { try { await finish(true); } catch (e) { err.textContent = friendlyAuthError(e); } }, 'Criando…');
    card(h('h2', {}, 'Sua primeira campanha'), h('p', { class: 'muted' }, 'Cada campanha tem um código de mesa para os jogadores entrarem. Você poderá criar outras depois.'), nameIn, err, go,
      h('button', { class: 'btn ghost', style: 'margin-top:8px', onclick: () => finish() }, 'Deixar para depois'));
  }
  async function finish(createCamp) {
    await Cloud.updateProfile({ display_name: st.name.trim(), default_role: st.role, onboarded: true });
    if (createCamp) { const row = await Cloud.createCampaign(st.campName.trim() || 'Minha primeira campanha'); const full = await Cloud.loadCampaign(row.id); return startMaster({ cloud: full }); }
    return routeAfterAuth();
  }
  s1();
}

/* A página Home (minhas mesas, personagens, aparência) fica em ui_profile.js */

function upgradeGuestModal() {
  const m = h('input', { type: 'text', inputmode: 'email', placeholder: 'e-mail' }), p = h('input', { type: 'password', placeholder: 'senha (mín. 6)' }), err = h('div', { class: 'err' });
  const body = h('div', {}, h('p', { class: 'muted' }, 'Suas mesas e personagens continuam exatamente como estão.'), h('label', { class: 'f' }, 'E-mail', m), h('label', { class: 'f' }, 'Senha', p), err);
  modal('Criar conta', body, [{ label: 'Cancelar' }, { label: 'Criar conta', cls: 'primary', fn: () => {
    if (!/^\S+@\S+\.\S+$/.test(m.value.trim()) || p.value.length < 6) { err.textContent = 'Informe um e-mail válido e uma senha com 6+ caracteres.'; return false; }
    Cloud.upgradeGuest(m.value.trim(), p.value).then(() => { toast('Conta criada. Confirme o e-mail se o Supabase pedir.'); showHome(); }).catch(x => toast(friendlyAuthError(x), 4000)); } }]);
}

/* entrar numa mesa pelo código: valida (e registra) a participação e abre a tela do personagem */
async function enterTable(code, charId, errEl) {
  try {
    const t = await Cloud.joinCampaign(code, charId || null);
    let pc = null; const cs = await Cloud.myCharacters(); const pick = cs.find(c => c.id === charId) || cs[0] || null; if (pick) pc = charToProfile(pick);
    const prof = { pid: userPid(), name: pc ? pc.name : (Cloud.profile && Cloud.profile.display_name) || '', char: pc || { frame: 'circle', color: '#c9a227', alpha: 1, state: 'normal', asset: null, zoom: 1, ox: 0, oy: 0 } };
    store.set('vtt-last', { role: 'player', code: String(code).toUpperCase(), name: t && (t.campaign_name || t.out_campaign_name) || '' });
    store.set('vtt-player', prof); if (pc && pc.asset) store.set('vtt-passet', { id: pc.asset, data: Assets.data[pc.asset] }); else store.set('vtt-passet', null);
    startPlayer(String(code).toUpperCase(), { mode: 'online', url: CLOUD.url, key: CLOUD.key, cloud: true, characterId: pick ? pick.id : null, tableName: t && (t.campaign_name || t.out_campaign_name) });
  } catch (e) { const msg = friendlyAuthError(e); if (errEl) errEl.textContent = msg; else { toast(msg, 4000); showHome(); } }
}

function goHome() { if (Cloud.ready && Cloud.user) showHome(); else showLobby(); }
