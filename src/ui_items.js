'use strict';
/* ===== ui_items.js — telas de itens: mochila do mestre, editor de itens personalizados, mochila do jogador ===== */

function iconEl(it, px) {
  const cv = h('canvas', { width: px * 2, height: px * 2, class: 'iico', style: 'width:' + px + 'px;height:' + px + 'px' });
  const paint = () => { const c = cv.getContext('2d'); c.clearRect(0, 0, px * 2, px * 2); c.drawImage(itemIconCanvas(it.glyph, it.color, it.art, px * 2), 0, 0); };
  paint();
  if (it.art && !Assets.imgs[it.art]) { let n = 0; const iv = setInterval(() => { n++; if (Assets.imgs[it.art]) { clearInterval(iv); paint(); } else if (n > 40) clearInterval(iv); }, 250); }
  return cv;
}
const elemTag = it => it.elem && ELEMENTS[it.elem] ? h('i', { class: 'etag', style: 'color:' + ELEMENTS[it.elem].color + ';border-color:' + ELEMENTS[it.elem].color + '66' }, ELEMENTS[it.elem].name) : null;
const slotTag = it => it.slot ? h('i', { class: 'stag' }, ITEM_SLOTS[it.slot]) : null;

/* ---------- editor de item (próprio ou ajuste de arte de um item do catálogo) ---------- */
function itemEditor(C, base, done) {
  const builtin = !!base && base.sys !== 'custom' && !!ITEMDB[base.id];
  const S = Object.assign({ name: '', cat: 'misc', slot: null, glyph: 'box', color: '#c9a227', stats: '', desc: '', elem: null, light: null, art: null }, base ? JSON.parse(JSON.stringify(resolveItem(C, base.id) || base)) : {});
  const prev = h('div', { class: 'ieprev' }), grid = h('div', { class: 'glyphgrid' });
  const repaint = () => {
    prev.innerHTML = ''; prev.append(iconEl(S, 84));
    grid.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.g === S.glyph));
  };
  GLYPH_NAMES.forEach(g => { const b = h('button', { type: 'button', 'data-g': g, title: g, onclick: () => { S.glyph = g; S.art = S.art; repaint(); } }); b.append(iconEl({ glyph: g, color: '#c9a227' }, 30)); grid.append(b); });
  const nameIn = h('input', { type: 'text', value: S.name, maxlength: 40, placeholder: 'Nome do item', oninput: e => S.name = e.target.value });
  const catSel = h('select', { value: S.cat, onchange: e => S.cat = e.target.value }, Object.entries(ITEM_CATS).map(([k, v]) => h('option', { value: k }, v)));
  const slotSel = h('select', { value: S.slot || '', onchange: e => S.slot = e.target.value || null }, [h('option', { value: '' }, 'Não equipável')].concat(Object.entries(ITEM_SLOTS).map(([k, v]) => h('option', { value: k }, v))));
  const elemSel = h('select', { value: S.elem || '', onchange: e => S.elem = e.target.value || null }, [h('option', { value: '' }, '—')].concat(Object.entries(ELEMENTS).map(([k, v]) => h('option', { value: k }, v.name))));
  const statsIn = h('input', { type: 'text', value: S.stats, maxlength: 90, placeholder: 'ex.: 1d8 · crítico 19 · cortante', oninput: e => S.stats = e.target.value });
  const descIn = h('textarea', { rows: 3, maxlength: 400, placeholder: 'Descrição', value: S.desc, oninput: e => S.desc = e.target.value });
  const colIn = h('input', { type: 'color', value: S.color, oninput: e => { S.color = e.target.value; repaint(); } });
  const lightOn = h('input', { type: 'checkbox', checked: !!S.light, onchange: e => { S.light = e.target.checked ? [S.light ? S.light[0] : 4, S.light ? S.light[1] : '#ffcf7a', S.light ? S.light[2] : true] : null; lr.hidden = !e.target.checked; } });
  const lrad = h('input', { type: 'number', min: 1, max: 20, step: .5, value: S.light ? S.light[0] : 4, onchange: e => { if (S.light) S.light[0] = clamp(parseFloat(e.target.value) || 4, 1, 20); } });
  const lcol = h('input', { type: 'color', value: S.light ? S.light[1] : '#ffcf7a', oninput: e => { if (S.light) S.light[1] = e.target.value; } });
  const lfl = h('input', { type: 'checkbox', checked: S.light ? !!S.light[2] : true, onchange: e => { if (S.light) S.light[2] = e.target.checked; } });
  const lr = h('div', { class: 'lightrow', hidden: !S.light }, h('label', {}, 'Raio (células)', lrad), h('label', {}, 'Cor', lcol), h('label', { class: 'chk' }, lfl, 'Tremula'));
  const artBtn = h('button', { class: 'btn small', type: 'button', onclick: async () => {
    const f = await pickFile(IMG_ACCEPT); if (!f) return;
    try { const img = await loadImgFile(f), id = uid('i'); Assets.put(id, imageToData(img, 256, .9)); S.art = id; repaint(); } catch (e) { toast('Não consegui abrir a imagem: ' + (e && e.message || 'formato inválido')); }
  } }, '🖼 Usar minha imagem');
  const artRm = h('button', { class: 'btn small ghost', type: 'button', onclick: () => { S.art = null; repaint(); } }, 'Voltar ao desenho padrão');
  const f = (l, el) => h('label', { class: 'f' }, l, el);
  const body = h('div', { class: 'ied' },
    h('div', { class: 'iedtop' }, prev, h('div', { class: 'iedf' }, builtin ? h('div', { class: 'ititle' }, S.name) : f('Nome', nameIn), h('div', { class: 'btnrow' }, artBtn, artRm), h('label', { class: 'f chk2' }, 'Cor do desenho', colIn))),
    h('div', { class: 'lbl' }, 'Desenho padrão (escolha um — ou use uma imagem sua)'), grid,
    builtin ? h('p', { class: 'muted sm' }, 'Você está mudando só a arte deste item nesta campanha. Os números e a descrição continuam os do catálogo.') : h('div', {},
      h('div', { class: 'two' }, f('Categoria', catSel), f('Onde equipa', slotSel)),
      f('Atributos', statsIn), f('Descrição', descIn), f('Elemento (Ordem Paranormal)', elemSel),
      h('label', { class: 'f chk' }, lightOn, 'Emite luz quando equipado (lanterna, tocha…)'), lr));
  repaint();
  modal(builtin ? 'Arte de “' + S.name + '”' : (base ? 'Editar item' : 'Novo item personalizado'), body, [
    builtin && C.itemOv && C.itemOv[base.id] ? { label: 'Restaurar original', fn: () => { delete C.itemOv[base.id]; done(base.id); } } : null,
    { label: 'Cancelar' },
    { label: 'Salvar', cls: 'primary', fn: () => {
      if (builtin) { C.itemOv = C.itemOv || {}; C.itemOv[base.id] = { glyph: S.glyph, color: S.color, art: S.art || null }; done(base.id); return; }
      if (!S.name.trim()) { toast('Dê um nome ao item.'); return false; }
      C.customItems = C.customItems || []; let it = base && C.customItems.find(x => x.id === base.id);
      const data = { name: S.name.trim(), cat: S.cat, slot: S.slot || null, glyph: S.glyph, color: S.color, stats: S.stats.trim(), desc: S.desc.trim(), elem: S.elem || null, light: S.light || null, art: S.art || null, sys: 'custom' };
      if (it) Object.assign(it, data); else { it = Object.assign({ id: uid('cu_') }, data); C.customItems.push(it); }
      done(it.id);
    } }].filter(Boolean));
}

/* ---------- mochila de um jogador (visão do mestre) ---------- */
function inventoryModal(ctx, ch) {
  const C = ctx.C(), S = { sys: C.system || (typeof THEMES !== 'undefined' && THEMES[Prefs.v.theme] && THEMES[Prefs.v.theme].mode === 'dnd' ? 'dnd' : 'op'), cat: 'all', q: '', all: false };
  const left = h('div', { class: 'invleft' }), right = h('div', { class: 'invright' });
  const sysTabs = h('div', { class: 'tabs' });
  const listFor = () => {
    const base = S.sys === 'custom' ? (C.customItems || []) : ITEM_LISTS[S.sys];
    const q = S.q.trim().toLowerCase();
    return base.map(x => resolveItem(C, x.id)).filter(x => x && (S.cat === 'all' || x.cat === S.cat) && (!q || (x.name + ' ' + x.stats + ' ' + (x.elem || '') + ' ' + (x.alias || '')).toLowerCase().includes(q)));
  };
  function give(itemId) {
    ctx.pushHist(); const targets = S.all ? Object.keys(C.characters) : [ch.id];
    for (const pid of targets) { giveItem(C, pid, itemId, 1); ctx.eng.invChanged(pid); }
    ctx.changed(); render(); if (ctx.refresh) ctx.refresh();
  }
  function after(pid) { ctx.changed(); ctx.eng.invChanged(pid || ch.id); render(); if (ctx.refresh) ctx.refresh(); }
  function renderLeft() {
    left.innerHTML = ''; const inv = invOf(C, ch.id);
    left.append(h('div', { class: 'lbl' }, '🎒 Mochila de ' + ch.name + ' (' + inv.length + ')'));
    if (!inv.length) left.append(h('p', { class: 'muted sm' }, 'Vazia. Escolha itens no catálogo ao lado.'));
    for (const e of inv) {
      const it = resolveItem(C, e.item); if (!it) continue;
      left.append(h('div', { class: 'irow' + (e.eq ? ' eq' : '') },
        iconEl(it, 38), h('div', { class: 'iinfo' }, h('b', {}, it.name, e.qty > 1 ? h('span', { class: 'qty' }, ' ×' + e.qty) : null), h('span', { class: 'muted sm' }, it.stats || ITEM_CATS[it.cat] || ''), h('span', {}, slotTag(it), elemTag(it))),
        h('div', { class: 'iact' },
          it.slot ? h('button', { class: 'mini' + (e.eq ? ' on' : ''), title: e.eq ? 'Guardar' : 'Equipar (aparece no token)', onclick: () => { ctx.pushHist(); equipItem(C, ch.id, e.id, !e.eq); after(); } }, e.eq ? '✔ equipado' : 'equipar') : null,
          e.eq && it.light ? h('button', { class: 'mini', title: 'Acender/apagar', onclick: () => { ctx.pushHist(); e.on = e.on === false; after(); } }, e.on === false ? '○ luz' : '● luz') : null,
          !it.slot ? h('span', { class: 'qbtns' }, h('button', { class: 'mini', onclick: () => { ctx.pushHist(); e.qty = Math.max(1, e.qty - 1); after(); } }, '−'), h('button', { class: 'mini', onclick: () => { ctx.pushHist(); e.qty++; after(); } }, '+')) : null,
          h('button', { class: 'mini', title: 'Remover', onclick: () => { ctx.pushHist(); inv.splice(inv.indexOf(e), 1); after(); } }, '✕'))));
    }
  }
  function renderRight() {
    right.innerHTML = ''; sysTabs.innerHTML = '';
    for (const [k, l] of [['op', 'Ordem Paranormal'], ['dnd', 'D&D 5e'], ['custom', 'Meus itens']]) sysTabs.append(h('button', { class: 'tab' + (S.sys === k ? ' on' : ''), onclick: () => { S.sys = k; S.cat = 'all'; renderRight(); } }, l));
    const list = listFor(), cats = ['all'].concat(Object.keys(ITEM_CATS));
    right.append(sysTabs,
      h('input', { type: 'text', placeholder: 'Buscar item…', value: S.q, oninput: e => { S.q = e.target.value; grid.replaceChildren(...cardsFor(listFor())); } }),
      h('div', { class: 'chips' }, cats.map(c => h('button', { class: 'chip sm' + (S.cat === c ? ' on' : ''), onclick: () => { S.cat = c; renderRight(); } }, c === 'all' ? 'Tudo' : ITEM_CATS[c]))));
    const grid = h('div', { class: 'igrid' }, cardsFor(list)); right.append(grid);
    right.append(h('div', { class: 'btnrow' }, h('button', { class: 'btn small', onclick: () => itemEditor(C, null, id => { ctx.changed(); S.sys = 'custom'; renderRight(); }) }, '＋ Criar item personalizado'),
      h('label', { class: 'chk2' }, h('input', { type: 'checkbox', checked: S.all, onchange: e => S.all = e.target.checked }), ' dar a todos os jogadores')),
      h('p', { class: 'muted sm' }, 'Números dos catálogos são valores de referência — confira no seu livro. Qualquer item pode ter a arte trocada (✎).'));
  }
  function cardsFor(list) {
    if (!list.length) return [h('p', { class: 'muted sm' }, S.sys === 'custom' ? 'Você ainda não criou itens. Use “Criar item personalizado”.' : 'Nada encontrado.')];
    return list.map(it => h('div', { class: 'icard' }, iconEl(it, 40), h('div', { class: 'iinfo' }, h('b', {}, it.name), h('span', { class: 'muted sm' }, it.stats || ITEM_CATS[it.cat]), h('span', {}, slotTag(it), elemTag(it))),
      h('div', { class: 'iact' }, h('button', { class: 'mini', title: 'Dar ao jogador', onclick: () => give(it.id) }, '＋'),
        h('button', { class: 'mini', title: it.sys === 'custom' ? 'Editar item' : 'Trocar arte', onclick: () => itemEditor(C, it, () => { ctx.changed(); for (const pid of Object.keys(C.characters)) ctx.eng.invChanged(pid); render(); }) }, '✎'),
        it.sys === 'custom' ? h('button', { class: 'mini', title: 'Excluir item', onclick: () => { C.customItems = C.customItems.filter(x => x.id !== it.id); for (const k in C.inv || {}) C.inv[k] = C.inv[k].filter(e => e.item !== it.id); ctx.changed(); render(); } }, '🗑') : null)));
  }
  function render() { renderLeft(); renderRight(); }
  render();
  modal('Itens — ' + ch.name, h('div', { class: 'invmodal' }, left, right), [{ label: 'Fechar', cls: 'primary' }]);
}

/* ---------- mochila do jogador ---------- */
function PlayerInventory(eng) {
  const root = h('div', { class: 'pinv' });
  function paint() {
    root.innerHTML = ''; const inv = eng.inv || [];
    if (!inv.length) { root.append(h('p', { class: 'muted' }, 'Sua mochila está vazia. O mestre pode lhe entregar itens durante o jogo.')); return; }
    const eq = inv.filter(e => e.eq);
    root.append(h('div', { class: 'lbl' }, 'Equipado'), eq.length ? h('div', { class: 'eqstrip' }, eq.map(e => h('div', { class: 'eqchip', title: e.it.name }, iconEl(e.it, 34), h('span', {}, e.it.name)))) : h('p', { class: 'muted sm' }, 'Nada equipado. Equipe um item para ele aparecer no seu personagem.'),
      h('div', { class: 'lbl' }, 'Mochila (' + inv.length + ')'));
    for (const e of inv) {
      const it = e.it, open = root.__open === e.id;
      root.append(h('div', { class: 'irow' + (e.eq ? ' eq' : ''), onclick: () => { root.__open = open ? null : e.id; paint(); } },
        iconEl(it, 38), h('div', { class: 'iinfo' }, h('b', {}, it.name, e.qty > 1 ? h('span', { class: 'qty' }, ' ×' + e.qty) : null), h('span', { class: 'muted sm' }, it.stats || ITEM_CATS[it.cat] || ''), h('span', {}, slotTag(it), elemTag(it)), open && it.desc ? h('span', { class: 'desc' }, it.desc) : null),
        h('div', { class: 'iact', onclick: ev => ev.stopPropagation() },
          it.slot ? h('button', { class: 'mini' + (e.eq ? ' on' : ''), onclick: () => { eng.equip(e.id, !e.eq); paint(); } }, e.eq ? 'Guardar' : 'Equipar') : null,
          e.eq && it.light ? h('button', { class: 'mini', onclick: () => { eng.itemOn(e.id, e.on === false); paint(); } }, e.on === false ? '○ Acender' : '● Apagar') : null)));
    }
  }
  root.paint = paint; paint(); return root;
}
