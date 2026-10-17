'use strict';
/* ===== ui_main.js — lobby e inicialização ===== */

function parseHash() {
  const o = {}; const hs = (location.hash || '').replace(/^#/, ''); if (!hs) return o;
  hs.split('&').forEach(p => { const i = p.indexOf('='); if (i > 0) o[p.slice(0, i)] = decodeURIComponent(p.slice(i + 1)); });
  return o;
}
function showLobby() {
  resetScreen(); const root = $('#root'); root.innerHTML = '';
  const hs = parseHash(), saved = store.get('vtt-cfg', {}), prof = store.get('vtt-player', {});
  const join = { code: (hs.join || '').toUpperCase(), mode: hs.m || (hs.u ? 'online' : (saved.mode || 'local')), url: hs.u || saved.url || '', key: hs.k || saved.key || '' };
  const err = h('div', { class: 'err' });
  const codeIn = h('input', { type: 'text', maxlength: 8, placeholder: 'CÓDIGO', value: join.code, class: 'code', oninput: e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); } });
  const modeSel = h('select', { value: join.mode, onchange: () => adv() }, h('option', { value: 'local' }, 'Local (mesmo navegador)'), h('option', { value: 'online' }, 'Online (Supabase)'));
  const urlIn = h('input', { type: 'text', placeholder: 'https://xxxx.supabase.co', value: join.url }), keyIn = h('input', { type: 'password', placeholder: 'chave pública', value: join.key });
  const advBox = h('div', { class: 'adv' }, h('label', {}, 'Modo', modeSel), h('label', { class: 'online' }, 'URL', urlIn), h('label', { class: 'online' }, 'Chave', keyIn));
  const showAdv = !hs.join;
  function adv() { advBox.querySelectorAll('.online').forEach(e => e.style.display = modeSel.value === 'online' ? '' : 'none'); }
  adv();
  const go = () => {
    const code = codeIn.value.trim(); if (code.length < 3) { err.textContent = 'Digite o código da mesa que o mestre enviou.'; return; }
    const cfg = { mode: modeSel.value, url: urlIn.value.trim(), key: keyIn.value.trim() };
    if (cfg.mode === 'online' && (!cfg.url || !cfg.key)) { err.textContent = 'Informe a URL e a chave (ou use o link completo enviado pelo mestre).'; return; }
    startPlayer(code, cfg);
  };
  root.append(h('div', { class: 'screen center lobby' },
    brandHero(),
    h('div', { class: 'cards' },
      h('div', { class: 'card' + (hs.join ? ' dim' : '') }, h('h2', {}, 'Montar a mesa'), h('p', { class: 'muted' }, 'Crie mapas com o catálogo ou com uma imagem, posicione zonas, luzes, névoa e criaturas ocultas.'),
        h('button', { class: 'btn primary big', onclick: () => startMaster() }, 'Abrir editor do mestre')),
      h('div', { class: 'card' + (hs.join ? ' hl' : '') }, h('h2', {}, 'Entrar na mesa'), h('p', { class: 'muted' }, prof.name ? 'Bem-vindo de volta, ' + prof.name + '.' : 'Use o código (ou o link) que o mestre compartilhou.'),
        codeIn, showAdv ? h('details', {}, h('summary', {}, 'Conexão'), advBox) : advBox, err, h('button', { class: 'btn primary big', onclick: go }, 'Continuar')))));
  if (hs.join) advBox.style.display = 'none';
  codeIn.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
}
/* inicialização: links antigos (modo local / URL própria) vão para o lobby; o resto passa pela conta */
async function boot() {
  Prefs.init(); mountDock(); Prefs.on(v => { document.querySelectorAll('[data-tagline]').forEach(e => { e.textContent = THEMES[v.theme].tag; }); paintDock(); });
  const hs = parseHash();
  if (hs.m === 'local' || hs.u) return showLobby();
  const root = $('#root'); root.innerHTML = ''; root.append(h('div', { class: 'screen center' }, h('div', { class: 'spin' }), h('p', { class: 'muted' }, 'Conectando…')));
  try { await Cloud.init(); Cloud.onAuth(() => paintDock()); } catch (e) { toast('Modo offline: ' + (e.message || e), 4500); return showLobby(); }
  if (hs.join) setPending(hs.join.toUpperCase());
  if (!Cloud.user) return showAuth({ joinCode: hs.join ? hs.join.toUpperCase() : '' });
  try { await afterLogin(); } catch (e) { console.error(e); toast(friendlyAuthError(e), 4500); showAuth(); }
}
window.addEventListener('DOMContentLoaded', () => { boot(); });
