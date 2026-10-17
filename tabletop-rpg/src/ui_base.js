'use strict';
/* ===== ui_base.js — helpers de DOM, armazenamento, imagens e palco (canvas com câmera) ===== */

const $ = (s, r) => (r || document).querySelector(s);
/* append/prepend ignoram null/undefined/false (o padrão do navegador escreveria o texto "null" na tela) */
(function () {
  for (const k of ['append', 'prepend']) {
    for (const P of [Element.prototype, DocumentFragment.prototype]) {
      const orig = P[k]; if (!orig || orig.__safe) continue;
      const fn = function () { return orig.apply(this, [].slice.call(arguments).filter(a => a != null && a !== false)); }; fn.__safe = true; P[k] = fn;
    }
  }
})();
function h(tag, props) {
  const e = document.createElement(tag); props = props || {}; let val;
  for (const k in props) {
    const v = props[k];
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'value') val = v;
    else if (k === 'checked') e.checked = !!v;
    else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, '');
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (let i = 2; i < arguments.length; i++) {
    const kids = [].concat(arguments[i]);
    for (const kid of kids) { if (kid == null || kid === false) continue; e.append(kid.nodeType ? kid : document.createTextNode(String(kid))); }
  }
  if (val !== undefined) e.value = val;
  return e;
}
function toast(msg, ms) {
  let box = $('#toasts'); if (!box) { box = h('div', { id: 'toasts' }); document.body.append(box); }
  const t = h('div', { class: 'toast' }, msg); box.append(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, ms || 2800);
}
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* */ } }
};
const DB = {
  _db: null,
  open() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((res, rej) => {
      if (!window.indexedDB) return rej(new Error('sem IndexedDB'));
      const r = indexedDB.open('vtt-db', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => { this._db = r.result; res(r.result); };
      r.onerror = () => rej(r.error);
    });
  },
  async get(k) { try { const db = await this.open(); return await new Promise(res => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(undefined); }); } catch (e) { return undefined; } },
  async set(k, v) { try { const db = await this.open(); return await new Promise(res => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = () => res(true); tx.onerror = () => res(false); }); } catch (e) { return false; } }
};

/* ---------- imagens ---------- */
const IMG_ACCEPT = 'image/*,.png,.jpg,.jpeg,.jfif,.jpe,.pjpeg,.pjp,.webp,.gif,.bmp,.avif,.apng,.svg,.ico,.tif,.tiff';
const IMG_EXT_RE = /^(png|jpe?g|jfif|jpe|pjpeg|pjp|webp|gif|bmp|avif|apng|svg|ico|tiff?|heic|heif)$/i;
function sniffMime(u, ext, declared) { // descobre o formato real pelos primeiros bytes (extensão e MIME podem mentir ou faltar)
  const at = (i, str) => { for (let k = 0; k < str.length; k++) if (u[i + k] !== str.charCodeAt(k)) return false; return true; };
  if (u[0] === 0xFF && u[1] === 0xD8) return 'image/jpeg';
  if (u[0] === 0x89 && at(1, 'PNG')) return 'image/png';
  if (at(0, 'GIF8')) return 'image/gif';
  if (at(0, 'RIFF') && at(8, 'WEBP')) return 'image/webp';
  if (u[0] === 0x42 && u[1] === 0x4D) return 'image/bmp';
  if (at(4, 'ftyp')) { const br = String.fromCharCode(u[8], u[9], u[10], u[11]); return /^(avif|avis)$/.test(br) ? 'image/avif' : 'image/heic'; }
  if (u[0] === 0 && u[1] === 0 && u[2] === 1 && u[3] === 0) return 'image/x-icon';
  if ((u[0] === 0x49 && u[1] === 0x49 && u[2] === 42) || (u[0] === 0x4D && u[1] === 0x4D && u[3] === 42)) return 'image/tiff';
  let head = ''; for (let i = 0; i < Math.min(u.length, 32); i++) head += String.fromCharCode(u[i]); if (/^\s*(<\?xml|<svg|<!doctype svg)/i.test(head)) return 'image/svg+xml';
  const m = { jpg: 'image/jpeg', jpeg: 'image/jpeg', jfif: 'image/jpeg', jpe: 'image/jpeg', pjpeg: 'image/jpeg', pjp: 'image/jpeg', svg: 'image/svg+xml', apng: 'image/png', png: 'image/png', webp: 'image/webp', gif: 'image/gif', bmp: 'image/bmp', avif: 'image/avif' };
  return m[ext] || (declared && declared.startsWith('image/') ? declared : '');
}
function decodeViaImg(blob) {
  return new Promise((res, rej) => {
    const u = URL.createObjectURL(blob), i = new Image();
    i.onload = () => { URL.revokeObjectURL(u); res(i); }; i.onerror = () => { URL.revokeObjectURL(u); rej(new Error('o navegador não conseguiu decodificar')); }; i.src = u;
  });
}
/* Abre qualquer imagem comum (png, jpg/jpeg/jfif, webp, gif, bmp, avif, svg, ico…). Devolve algo desenhável com .width/.height. */
async function loadImgFile(file) {
  const name = file.name || '', ext = ((name.match(/\.([a-z0-9]+)$/i) || [])[1] || '').toLowerCase();
  const buf = await file.arrayBuffer(), mime = sniffMime(new Uint8Array(buf, 0, Math.min(64, buf.byteLength)), ext, file.type);
  if (!mime) throw new Error('formato não reconhecido' + (ext ? ' (.' + ext + ')' : '') + '. Use PNG, JPG, JFIF, WEBP, GIF, BMP, AVIF ou SVG');
  const blob = new Blob([buf], { type: mime });
  const keep = o => { try { o.__blob = blob; o.__mime = mime; } catch (e) { /* */ } return o; };
  if (mime === 'image/svg+xml') { // rasteriza em boa resolução (SVG sem tamanho próprio daria 0×0)
    const im = await decodeViaImg(blob), nw = im.naturalWidth || 512, nh = im.naturalHeight || 512, k = 1024 / Math.max(nw, nh), cv = makeCanvas(Math.round(nw * k), Math.round(nh * k));
    cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); return cv;
  }
  let err = null;
  if (globalThis.createImageBitmap) { try { const bm = await createImageBitmap(blob, { imageOrientation: 'from-image' }); if (bm && bm.width) return keep(bm); } catch (e) { err = e; } try { const bm = await createImageBitmap(blob); if (bm && bm.width) return keep(bm); } catch (e) { err = e; } }
  try { return keep(await decodeViaImg(blob)); } catch (e) { err = e; }
  if (/heic|heif/.test(mime) || /^(heic|heif)$/.test(ext)) throw new Error('HEIC/HEIF não abre no navegador. Converta para JPG ou PNG');
  throw new Error((err && err.message) || 'arquivo de imagem inválido ou corrompido');
}
/* reduz e codifica: PNG quando há transparência, JPEG caso contrário */
function imageToData(img, max, quality) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height, sc = Math.min(1, max / Math.max(iw, ih));
  const cv = makeCanvas(Math.max(1, Math.round(iw * sc)), Math.max(1, Math.round(ih * sc))), c = cv.getContext('2d');
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(img, 0, 0, cv.width, cv.height);
  let alpha = false; try { const d = c.getImageData(0, 0, cv.width, cv.height).data; for (let i = 3; i < d.length; i += 4) if (d[i] < 250) { alpha = true; break; } } catch (e) { alpha = true; }
  return alpha ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg', quality || .9);
}
async function mapFromFile(file, max) {
  max = max || 2400; const img = await loadImgFile(file);
  const sc = Math.min(1, max / Math.max(img.width, img.height)), cv = makeCanvas(Math.round(img.width * sc), Math.round(img.height * sc));
  cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
  return { data: cv.toDataURL('image/jpeg', .86), w: cv.width, h: cv.height };
}
/* imagem de token: guarda a foto inteira (até 768 px); o recorte da moldura é feito ao desenhar (zoom/ox/oy no token) */
function tokenFromImg(img) { return imageToData(img, 768, .92); }
function pickFile(accept) {
  return new Promise(res => {
    if (!accept || accept === 'image/*') accept = IMG_ACCEPT; const i = h('input', { type: 'file', accept, style: 'display:none' });
    i.onchange = () => { res(i.files[0] || null); i.remove(); }; i.oncancel = () => { res(null); i.remove(); }; document.body.append(i); i.click();
  });
}

/* ---------- tamanhos de mapa (em blocos) e processamento de imagem ---------- */
const MAP_PRESETS = [['Estreito 4×8', 4, 8], ['Quarto 8×6', 8, 6], ['Sala 12×10', 12, 10], ['Casa 16×12', 16, 12], ['Galpão 24×16', 24, 16], ['Vila 40×30', 40, 30], ['Ilha 64×44', 64, 44]];
const r2 = v => Math.max(.5, Math.round(v * 2) / 2);
function mapSrcRect(iw, ih, cw, ch, fit) {
  const src = { x: 0, y: 0, w: iw, h: ih };
  if (fit === 'cover') { const tr = cw / ch, ir = iw / ih; if (ir > tr) { src.w = ih * tr; src.x = (iw - src.w) / 2; } else { src.h = iw / tr; src.y = (ih - src.h) / 2; } }
  return src;
}
function mapQuality(iw, ih, cw, ch, fit) { const s = mapSrcRect(iw, ih, cw, ch, fit); return Math.min(s.w / cw, s.h / ch); }
/* tamanho "ideal": ~70 px de imagem por bloco (padrão dos mapas de batalha); "nítido": o maior que ainda mantém ≥ 48 px/bloco */
const MAP_IDEAL_PPB = 70, MAP_MIN_PPB = 48;
function cellsFor(iw, ih, ppb) { const cw = clamp(Math.round(iw / ppb * 2) / 2, 2, 200); return { cw, ch: r2(cw * ih / iw) }; }
function autoCells(iw, ih) { return cellsFor(iw, ih, MAP_IDEAL_PPB); }
function ppbClass(ppb) { return ppb < 32 ? 'low' : ppb < 56 ? 'mid' : 'good'; }
const MAP_QUALITY = { max: 6144, high: 4096, light: 2560 };
function blobToDataURL(b) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(b); }); }
function hasAlpha(img, W, H) {
  try { const k = Math.min(1, 192 / Math.max(W, H)), cv = makeCanvas(Math.max(1, Math.round(W * k)), Math.max(1, Math.round(H * k))), c = cv.getContext('2d'); c.drawImage(img, 0, 0, cv.width, cv.height); const d = c.getImageData(0, 0, cv.width, cv.height).data; for (let i = 3; i < d.length; i += 4) if (d[i] < 250) return true; return false; } catch (e) { return false; }
}
/* Guarda a imagem na resolução ORIGINAL (até o teto de qualidade) — a quantidade de blocos só define o tamanho no jogo, não os pixels.
   Se a imagem já está no formato certo e dentro do teto, os bytes originais são mantidos (zero perda). */
async function processMapImage(img, cw, ch, o) {
  o = o || {}; const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height, src = mapSrcRect(iw, ih, cw, ch, o.fit);
  const cap = MAP_QUALITY[o.quality] || MAP_QUALITY.high, whole = src.w >= iw - .5 && src.h >= ih - .5;
  if (whole && Math.max(iw, ih) <= cap && img.__blob && img.__blob.size <= 5.5e6 && /^image\/(jpeg|png|webp)$/.test(img.__mime || '')) {
    return { data: await blobToDataURL(img.__blob), w: iw, h: ih, ppb: Math.min(iw / cw, ih / ch), original: true };
  }
  let k = Math.min(1, cap / Math.max(src.w, src.h)), q = o.quality === 'max' ? .95 : .92, out = null, W, H;
  for (let tries = 0; tries < 4; tries++) {
    W = Math.max(1, Math.round(src.w * k)); H = Math.max(1, Math.round(src.h * k));
    const cv = makeCanvas(W, H), c = cv.getContext('2d'); c.imageSmoothingEnabled = !o.pixel; if (!o.pixel) c.imageSmoothingQuality = 'high';
    c.drawImage(img, src.x, src.y, src.w, src.h, 0, 0, W, H);
    out = (o.pixel || hasAlpha(img, iw, ih)) ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg', q);
    if (out.length < 9e6) break; if (out.startsWith('data:image/jpeg') && q > .84) q -= .06; else k *= .8; // arquivo grande demais para sincronizar: reduz um pouco
  }
  return { data: out, w: W, h: H, ppb: Math.min(W / cw, H / ch) };
}
/* diálogo de tamanho: resolve {cw,ch,name,fit,pixel} ou null */
function mapDialog(o) {
  return new Promise(res => {
    const img = o.img, iw = img ? (img.naturalWidth || img.width) : 0, ih = img ? (img.naturalHeight || img.height) : 0;
    const S = { cw: o.cw || 12, ch: o.ch || 10, lock: !!img && !o.cw, fit: 'cover', pixel: !!o.pixel, name: o.name || '', quality: 'high' };
    if (img && !o.cw) { const a = autoCells(iw, ih); S.cw = a.cw; S.ch = a.ch; if (iw < 520) S.pixel = true; }
    const cv = h('canvas', { width: 460, height: 460 }), q = h('div', { class: 'q' }), warn = h('div', { class: 'muted sm' });
    const cwIn = h('input', { type: 'number', step: .5, min: 1, max: 200 }), chIn = h('input', { type: 'number', step: .5, min: 1, max: 200 });
    const lockIn = h('input', { type: 'checkbox' }), pixIn = h('input', { type: 'checkbox' }), fitSel = h('select', {}, h('option', { value: 'cover' }, 'Preencher (recorta o excesso)'), h('option', { value: 'stretch' }, 'Esticar até as bordas'));
    const nameIn = h('input', { type: 'text', value: S.name, placeholder: 'Nome da área' });
    const qSel = h('select', {}, h('option', { value: 'max' }, 'Máxima (até 6144 px — arquivo maior)'), h('option', { value: 'high' }, 'Alta (até 4096 px — recomendado)'), h('option', { value: 'light' }, 'Leve (até 2560 px — carrega mais rápido online)'));
    const pxIn = h('input', { type: 'number', min: 8, max: 600, step: 1, placeholder: 'ex.: 70' });
    const ratio = img ? ih / iw : 1;
    function sync() {
      cwIn.value = S.cw; chIn.value = S.ch; lockIn.checked = S.lock; pixIn.checked = S.pixel; fitSel.value = S.fit; qSel.value = S.quality; if (img && document.activeElement !== pxIn) pxIn.value = Math.round(mapQuality(iw, ih, S.cw, S.ch, S.fit));
      const c = cv.getContext('2d'), W = cv.width; c.fillStyle = '#0c0e11'; c.fillRect(0, 0, W, W);
      const k = (W - 90) / Math.max(S.cw, S.ch), fw = S.cw * k, fh = S.ch * k, fx = (W - fw) / 2, fy = (W - fh) / 2 - 8;
      c.save(); c.beginPath(); c.rect(fx, fy, fw, fh); c.clip();
      if (img) { const sr = mapSrcRect(iw, ih, S.cw, S.ch, S.fit); c.imageSmoothingEnabled = !S.pixel; c.drawImage(img, sr.x, sr.y, sr.w, sr.h, fx, fy, fw, fh); } else { c.fillStyle = '#1b1f26'; c.fillRect(fx, fy, fw, fh); }
      c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 1; c.beginPath();
      for (let i = 1; i < S.cw; i++) { c.moveTo(fx + i * k, fy); c.lineTo(fx + i * k, fy + fh); } for (let j = 1; j < S.ch; j++) { c.moveTo(fx, fy + j * k); c.lineTo(fx + fw, fy + j * k); } c.stroke(); c.restore();
      c.strokeStyle = '#e5383b'; c.lineWidth = 2; c.strokeRect(fx, fy, fw, fh);
      c.fillStyle = '#fff'; c.font = '600 20px system-ui'; c.textAlign = 'center'; c.fillText(S.cw + ' × ' + S.ch + ' blocos', W / 2, fy + fh + 30);
      if (img) {
        const ppb = Math.round(mapQuality(iw, ih, S.cw, S.ch, S.fit)), cls = ppbClass(ppb), cap = MAP_QUALITY[S.quality];
        const txt = cls === 'low' ? 'baixa — vai ficar borrada. Use menos blocos (botão "Nítido") ou ative "Pixel art"' : cls === 'mid' ? 'aceitável' : ppb > 150 ? 'sobrando — dá para usar bem menos blocos ou aproximar bastante a câmera' : 'ótima';
        const mx = cellsFor(iw, ih, MAP_MIN_PPB), id = cellsFor(iw, ih, MAP_IDEAL_PPB);
        q.className = 'q ' + cls; q.textContent = 'Imagem ' + iw + '×' + ih + ' px → ' + ppb + ' px por bloco · ' + txt + '. Ideal ≈ ' + id.cw + '×' + id.ch + ' · máximo nítido ≈ ' + mx.cw + '×' + mx.ch + ' blocos.' + (Math.max(iw, ih) > cap ? ' (a imagem será reduzida para ' + cap + ' px no lado maior)' : ' (será guardada sem perda de resolução)');
        const diff = Math.abs(Math.log((S.cw / S.ch) / (iw / ih))) > .08; warn.textContent = diff ? (S.fit === 'cover' ? 'A proporção da imagem é diferente do tamanho escolhido: o excesso será recortado.' : 'A imagem será esticada e pode distorcer.') : 'Proporção da imagem respeitada.';
      }
    }
    const setW = v => { S.cw = clamp(Math.round(v * 2) / 2 || 1, 1, 200); if (img && S.lock) S.ch = r2(S.cw * ratio); sync(); };
    const setH = v => { S.ch = clamp(Math.round(v * 2) / 2 || 1, 1, 200); if (img && S.lock) S.cw = r2(S.ch / ratio); sync(); };
    pxIn.onchange = () => { const v = parseFloat(pxIn.value); if (!(v >= 8)) { sync(); return; } const a = cellsFor(iw, ih, v); S.cw = a.cw; S.ch = a.ch; S.lock = true; S.fit = 'cover'; sync(); };
    qSel.onchange = () => { S.quality = qSel.value; sync(); };
    cwIn.onchange = () => setW(parseFloat(cwIn.value)); chIn.onchange = () => setH(parseFloat(chIn.value));
    lockIn.onchange = () => { S.lock = lockIn.checked; if (S.lock) setW(S.cw); else sync(); }; pixIn.onchange = () => { S.pixel = pixIn.checked; sync(); }; fitSel.onchange = () => { S.fit = fitSel.value; sync(); };
    const presets = h('div', { class: 'chips' }, MAP_PRESETS.map(p => h('button', { class: 'chip sm', onclick: () => { S.cw = p[1]; S.ch = p[2]; S.lock = false; sync(); } }, p[0])));
    if (img) presets.append(h('button', { class: 'chip sm', title: 'Tamanho em que a imagem fica com ~70 px por bloco', onclick: () => { const a = autoCells(iw, ih); S.cw = a.cw; S.ch = a.ch; S.lock = true; S.fit = 'cover'; sync(); } }, '✨ Ideal'));
    if (img) presets.append(h('button', { class: 'chip sm', title: 'Maior mapa que ainda mantém ≥ 48 px por bloco (sem borrar)', onclick: () => { const a = cellsFor(iw, ih, MAP_MIN_PPB); S.cw = a.cw; S.ch = a.ch; S.lock = true; S.fit = 'cover'; sync(); } }, '🔍 Nítido (máx.)'));
    const body = h('div', { class: 'msz' }, cv, h('div', { class: 'fields' },
      h('label', { class: 'f' }, 'Nome', nameIn), h('div', { class: 'lbl', style: 'margin:2px 0' }, 'Tamanhos prontos'), presets,
      h('div', { class: 'two' }, h('label', {}, 'Largura (blocos)', cwIn), h('label', {}, 'Altura (blocos)', chIn)),
      img ? h('label', { class: 'f chk' }, lockIn, 'Manter a proporção da imagem') : null, img ? h('label', { class: 'f' }, 'Quando a proporção difere', fitSel) : null,
      img ? h('label', { class: 'f' }, 'Grade desenhada na imagem (px por bloco)', pxIn) : null,
      img ? h('label', { class: 'f chk' }, pixIn, 'Pixel art (sem suavização)') : null, img ? h('label', { class: 'f' }, 'Qualidade guardada', qSel) : null, img ? q : null, img ? warn : null,
      h('p', { class: 'muted sm' }, '1 bloco = 1 célula da grade (≈ 1,5 m). Se o mapa já traz grade desenhada, informe quantos pixels tem cada quadrado: os blocos casam com ela. O tamanho pode mudar depois no Inspetor sem perder resolução.')));
    sync(); let done = false; const finish = v => { if (!done) { done = true; res(v); } };
    const m = modal(o.title || 'Tamanho do mapa', body, [{ label: 'Cancelar', fn: () => { finish(null); } }, { label: o.ok || 'Criar mapa', cls: 'primary', fn: () => { finish({ cw: S.cw, ch: S.ch, name: nameIn.value.trim(), fit: S.fit, pixel: S.pixel, quality: S.quality }); } }]);
    m.box.parentNode.addEventListener('pointerdown', e => { if (e.target === m.box.parentNode) finish(null); });
  });
}

function popMenu(anchor, items, up) {
  document.querySelectorAll('.popmenu').forEach(m => m.remove());
  const r = anchor.getBoundingClientRect(), m = h('div', { class: 'popmenu menu' }, items.map(it => h('button', { onclick: () => { close(); it[1](); } }, it[0])));
  document.body.append(m); const mw = m.offsetWidth, mh = m.offsetHeight;
  m.style.left = Math.max(6, Math.min(r.left, innerWidth - mw - 6)) + 'px'; m.style.top = (up ? Math.max(6, r.top - mh - 6) : Math.min(r.bottom + 6, innerHeight - mh - 6)) + 'px';
  function close() { m.remove(); document.removeEventListener('pointerdown', off, true); }
  function off(e) { if (!m.contains(e.target)) close(); }
  setTimeout(() => document.addEventListener('pointerdown', off, true), 0); return m;
}
function modal(title, body, actions) {
  const back = h('div', { class: 'modalback' }), close = () => { back.remove(); document.removeEventListener('keydown', esc); };
  const esc = e => { if (e.key === 'Escape') close(); }; document.addEventListener('keydown', esc);
  const box = h('div', { class: 'modal' }, h('div', { class: 'mh' }, h('span', {}, title), h('button', { class: 'x', onclick: close }, '✕')), h('div', { class: 'mb' }, body),
    h('div', { class: 'mf' }, (actions || []).map(a => h('button', { class: 'btn ' + (a.cls || ''), onclick: () => { if (a.fn && a.fn() === false) return; close(); } }, a.label))));
  back.append(box); back.addEventListener('pointerdown', e => { if (e.target === back) close(); }); document.body.append(back); return { close, box };
}
function askConfirm(msg, fn, okLabel) { modal('Confirmar', h('p', {}, msg), [{ label: 'Cancelar' }, { label: okLabel || 'Confirmar', cls: 'danger', fn: () => { fn(); } }]); }
function downloadText(name, text) {
  const a = h('a', { href: URL.createObjectURL(new Blob([text], { type: 'application/json' })), download: name }); document.body.append(a); a.click(); setTimeout(() => a.remove(), 500);
}

/* ---------- palco: canvas + câmera + laço de desenho ---------- */
const STAGES = new Set();
Assets.onLoad = () => STAGES.forEach(s => { s.dirty = true; });
class Stage {
  constructor(cv) {
    this.cv = cv; this.ctx = cv.getContext('2d'); this.cam = { x: 0, y: 0, z: 1 }; this.dpr = 1; this.dark = null; this.dirty = true; this.animating = false; this.drawFn = null; this.last = 0; this.stopped = false; this.base = null; this.reuse = false; this.baseT = 0;
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(cv.parentElement || cv); this.resize();
    this.loop = this.loop.bind(this); requestAnimationFrame(this.loop); STAGES.add(this);
  }
  destroy() { this.stopped = true; this.ro.disconnect(); STAGES.delete(this); }
  resize() {
    const r = this.cv.getBoundingClientRect(); this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(r.width * this.dpr)), hh = Math.max(1, Math.round(r.height * this.dpr));
    if (this.cv.width !== w || this.cv.height !== hh) { this.cv.width = w; this.cv.height = hh; this.dark = document.createElement('canvas'); this.dark.width = w; this.dark.height = hh; this.base = document.createElement('canvas'); this.base.width = w; this.base.height = hh; }
    this.cssW = r.width; this.cssH = r.height; this.dirty = true;
  }
  loop(t) {
    if (this.stopped) return;
    if ((this.dirty || (this.animating && t - this.last > 42)) && this.drawFn) {
      /* quadros só de animação (luz tremulando etc.) reaproveitam o mapa já desenhado; a cada 4 s redesenha tudo por segurança */
      this.reuse = !this.dirty && this.base && this.base._ok && t - this.baseT < 4000; if (!this.reuse) { this.baseT = t; if (this.base) this.base._ok = false; }
      this.dirty = false; this.last = t;
      try { this.animating = !!this.drawFn(this.ctx, this.cv.width, this.cv.height, this.dpr, t, this.dark); } catch (e) { console.error(e); }
    }
    requestAnimationFrame(this.loop);
  }
  toWorld(cx, cy) { const r = this.cv.getBoundingClientRect(); return [(cx - r.left) / this.cam.z + this.cam.x, (cy - r.top) / this.cam.z + this.cam.y]; }
  zoomAt(cx, cy, f) {
    const r = this.cv.getBoundingClientRect(), px = cx - r.left, py = cy - r.top, c = this.cam;
    const wx = px / c.z + c.x, wy = py / c.z + c.y, nz = clamp(c.z * f, .08, 4);
    c.x = wx - px / nz; c.y = wy - py / nz; c.z = nz; this.dirty = true;
  }
  centerOn(x, y, z) { const c = this.cam; if (z) c.z = z; c.x = x - this.cssW / 2 / c.z; c.y = y - this.cssH / 2 / c.z; this.dirty = true; }
  focusRect(x, y, w, hh, pad) {
    pad = pad == null ? 60 : pad; const z = clamp(Math.min((this.cssW - pad) / w, (this.cssH - pad) / hh), .08, 2);
    this.centerOn(x + w / 2, y + hh / 2, z);
  }
}
function sceneAnimated(scene) {
  for (const t of scene.tokens) if (t.state === 'dying' || (t.lt && t.lt.flicker)) return true;
  for (const l of scene.lights) if (lightAnimated(l)) return true;
  for (const e of scene.elements) if (CATALOG[e.kind] && CATALOG[e.kind].anim) return true;
  return false;
}
