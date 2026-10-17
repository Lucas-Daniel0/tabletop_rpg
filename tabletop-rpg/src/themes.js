'use strict';
/* ===== themes.js — mundos visuais (Clássico, D&D por classe, Ordem Paranormal por elemento) e preferências =====
   Cada tema tem: paleta, vozes tipográficas, gramática de formas (raios, moldura, cantos), divisor, textura de fundo e símbolo. */

const THEME_FONTS = 'https://fonts.googleapis.com/css2?family=Alegreya+Sans:wght@400;500;700&family=Almendra+SC&family=Barlow+Semi+Condensed:wght@400;500;600;700&family=Big+Shoulders+Display:wght@200;400;700;800&family=Fondamento&family=Grenze+Gotisch:wght@500;700&family=IM+Fell+DW+Pica&family=IM+Fell+English+SC&family=Macondo&family=Metamorphous&family=Pirata+One&family=Rubik+Glitch&family=Rubik+Wet+Paint&family=Share+Tech+Mono&family=Special+Elite&display=swap';
const THEME_MODES = { classic: 'Clássico', dnd: 'D&D', ordem: 'Ordem Paranormal' };

/* ---------- vozes tipográficas ---------- */
const SANS = 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
const BODY_DND = '"Alegreya Sans",system-ui,sans-serif';
const BODY_OP = '"Barlow Semi Condensed","Arial Narrow",system-ui,sans-serif';
const MONO_OP = '"Special Elite","Courier New",monospace';
const fam = (n, fb) => '"' + n + '",' + fb;
const SERIF_FB = 'Georgia,"Times New Roman",serif', COND_FB = '"Arial Narrow","Franklin Gothic Medium",sans-serif';
const VOICE = {
  classic: { w: 700, hw: 800, head: SANS, hero: SANS, body: SANS, mono: SANS, tt: 'none', ls: '0', h2: 22 },
  guerreiro: { w: 700, hw: 700, head: fam('Grenze Gotisch', SERIF_FB), body: BODY_DND, mono: BODY_DND, tt: 'none', ls: '.01em', h2: 26 },
  mago: { w: 400, hw: 400, head: fam('Metamorphous', SERIF_FB), body: BODY_DND, mono: BODY_DND, tt: 'none', ls: '.01em', h2: 22 },
  clerigo: { w: 400, hw: 400, head: fam('IM Fell English SC', SERIF_FB), body: BODY_DND, mono: BODY_DND, tt: 'none', ls: '.03em', h2: 25 },
  ladino: { w: 400, hw: 400, head: fam('Pirata One', SERIF_FB), body: BODY_DND, mono: BODY_DND, tt: 'none', ls: '.03em', h2: 26 },
  druida: { w: 400, hw: 400, head: fam('Macondo', SERIF_FB), body: BODY_DND, mono: BODY_DND, tt: 'none', ls: '0', h2: 21 },
  bardo: { w: 400, hw: 400, head: fam('Fondamento', SERIF_FB), body: BODY_DND, mono: BODY_DND, tt: 'none', ls: '0', h2: 24 },
  ordem: { w: 700, hw: 800, head: fam('Big Shoulders Display', COND_FB), body: BODY_OP, mono: MONO_OP, tt: 'uppercase', ls: '.05em', h2: 28 },
  cultistas: { w: 400, hw: 400, head: fam('Almendra SC', SERIF_FB), body: BODY_OP, mono: MONO_OP, tt: 'none', ls: '.04em', h2: 24 },
  sangue: { w: 700, hw: 400, head: fam('Big Shoulders Display', COND_FB), hero: fam('Rubik Wet Paint', COND_FB), body: BODY_OP, mono: MONO_OP, tt: 'uppercase', ls: '.05em', h2: 28 },
  morte: { w: 400, hw: 400, head: fam('Special Elite', '"Courier New",monospace'), body: BODY_OP, mono: MONO_OP, tt: 'none', ls: '.02em', h2: 21 },
  conhecimento: { w: 400, hw: 400, head: fam('IM Fell DW Pica', SERIF_FB), body: BODY_OP, mono: MONO_OP, tt: 'none', ls: '.01em', h2: 26 },
  energia: { w: 700, hw: 400, head: fam('Big Shoulders Display', COND_FB), hero: fam('Rubik Glitch', COND_FB), body: BODY_OP, mono: fam('Share Tech Mono', '"Courier New",monospace'), tt: 'uppercase', ls: '.08em', h2: 28 },
  medo: { w: 400, hw: 200, head: fam('Big Shoulders Display', COND_FB), body: BODY_OP, mono: MONO_OP, tt: 'uppercase', ls: '.22em', h2: 26, thin: true }
};

/* ---------- ornamentos desenhados (SVG) ---------- */
const svgUri = s => 'url("data:image/svg+xml,' + encodeURIComponent(s) + '")';
const CORNER = {  // canto superior esquerdo em 28×28; os outros três são espelhos
  crop: '<path d="M1 12V1h11" stroke-width="2"/>',
  plate: '<path d="M1 15V6l5-5h9" stroke-width="1.6"/><circle cx="7" cy="7" r="1.5" fill="C" stroke="none"/>',
  star: '<path d="M1 17V4a3 3 0 0 1 3-3h13" stroke-width="1.2"/><path d="M8 3.4 9.1 6.9 12.6 8 9.1 9.1 8 12.6 6.9 9.1 3.4 8 6.9 6.9Z" fill="C" stroke="none"/>',
  cross: '<path d="M1 16V3.5A2.5 2.5 0 0 1 3.5 1H16" stroke-width="1.2"/><path d="M8 4v8M4 8h8" stroke-width="1.7"/><circle cx="8" cy="8" r="1.4" fill="C" stroke="none"/>',
  dagger: '<path d="M1 15V1h14" stroke-width="1.4"/><path d="M4 4 12 12" stroke-width="1"/><path d="M12 12l2.4 2.4" stroke-width="2.2"/>',
  leaf: '<path d="M1 19C1 9 6 2 19 1" stroke-width="1.3"/><path d="M6 11C5.6 6.4 8.6 3.6 13 3.4 13.2 7.8 10.6 10.8 6 11Z" fill="C" stroke="none"/>',
  note: '<path d="M1 17V7a6 6 0 0 1 6-6h10" stroke-width="1.3"/><circle cx="7.5" cy="7.5" r="2.6" stroke-width="1.3"/><circle cx="7.5" cy="7.5" r=".9" fill="C" stroke="none"/>',
  ring: '<path d="M1 15V1h14" stroke-width="1.3"/><circle cx="8" cy="8" r="4" stroke-width="1.1"/><circle cx="8" cy="8" r="1.2" fill="C" stroke="none"/><path d="M8 2.2V4M13.8 8H12" stroke-width="1"/>',
  drip: '<path d="M1 13V1h12" stroke-width="2"/><path d="M3.4 14.5c0 0-2.4 3-2.4 4.7a2.4 2.4 0 0 0 4.8 0c0-1.7-2.4-4.7-2.4-4.7Z" fill="C" stroke="none"/>',
  xmark: '<path d="M1 11V1h10" stroke-width="1.6"/><path d="M5 5l5 5M10 5l-5 5" stroke-width="1.3"/>',
  eye: '<path d="M1 15V1h14" stroke-width="1.4"/><path d="M3 8.5q5-6 10 0-5 6-10 0Z" stroke-width="1.1"/><circle cx="8" cy="8.5" r="1.7" fill="C" stroke="none"/>',
  bolt: '<path d="M1 17V6l5-5h11" stroke-width="1.5"/><path d="M10 3.5 6 9.6h3.4L8 14.5l5-6.4H9.4Z" fill="C" stroke="none"/>',
  none: ''
};
function cornerSet(kind, color) {
  const g = CORNER[kind]; if (!g) return 'none';
  const body = g.replace(/"C"/g, '"' + color + '"');
  const wrap = tf => svgUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" fill="none" stroke="' + color + '" stroke-linecap="round" stroke-linejoin="round"><g transform="' + tf + '">' + body + '</g></svg>');
  return [wrap(''), wrap('translate(28 0) scale(-1 1)'), wrap('translate(0 28) scale(1 -1)'), wrap('translate(28 28) scale(-1 -1)')].join(',');
}
/* divisores: ladrilho que se repete numa linha; devolve [imagem, altura] */
const DIVIDER = {
  line: c => ['<path d="M0 5h120" stroke-width="1"/><path d="M60 1.6 63.4 5 60 8.4 56.6 5Z" fill="C"/>', 120, 10],
  plate: c => ['<path d="M0 5h40" stroke-width="1"/><circle cx="20" cy="5" r="1.8" fill="C"/>', 40, 10],
  star: c => ['<path d="M0 6h120" stroke-width="1"/><path d="M60 1 61.4 4.6 65 6 61.4 7.4 60 11 58.6 7.4 55 6 58.6 4.6Z" fill="C"/>', 120, 12],
  cross: c => ['<path d="M0 6h120" stroke-width="1"/><path d="M60 1.5v9M55.5 5h9" stroke-width="1.6"/>', 120, 12],
  blade: c => ['<path d="M0 5h100" stroke-width="1"/><path d="M52 1l-6 8" stroke-width="1.6"/>', 100, 10],
  vine: c => ['<path d="M0 6Q10 0 20 6T40 6T60 6T80 6" stroke-width="1.1"/><path d="M30 6C28 2 31 0 34 0 34 3 33 5 30 6Z" fill="C"/><path d="M70 6c2 4-1 6-4 6 0-3 1-5 4-6Z" fill="C"/>', 80, 12],
  staff: c => ['<path d="M0 1.5h40M0 4h40M0 6.5h40M0 9h40M0 11.5h40" stroke-width=".7"/><circle cx="20" cy="9" r="2" fill="C"/><path d="M22 9V1.5" stroke-width=".9"/>', 40, 13],
  hazard: c => ['<path d="M0 8 8 0h4L4 8Z" fill="C" stroke="none"/>', 12, 8],
  runes: c => ['<path d="M0 5h24M36 5h24" stroke-width="1"/><circle cx="30" cy="5" r="3" stroke-width="1"/><circle cx="30" cy="5" r=".9" fill="C"/>', 60, 10],
  drip: c => ['<path d="M0 2h90" stroke-width="2"/><path d="M20 2v8" stroke-width="2.2"/><circle cx="20" cy="11.4" r="2" fill="C" stroke="none"/><path d="M58 2v4" stroke-width="2"/><circle cx="58" cy="7" r="1.5" fill="C" stroke="none"/>', 90, 14],
  rule: c => ['<path d="M0 3h80M0 6.4h80" stroke-width=".8"/><path d="M37 1.5l6 6M43 1.5l-6 6" stroke-width="1"/>', 80, 10],
  ruler: c => ['<path d="M0 9h40" stroke-width="1"/><path d="M0 9V2M10 9V6M20 9V4M30 9V6" stroke-width="1"/>', 40, 10],
  circuit: c => ['<path d="M0 6h26l5-4h20l5 4h24" stroke-width="1.1"/><circle cx="65" cy="6" r="1.7" fill="C" stroke="none"/>', 80, 10],
  none: () => null
};
function dividerUri(kind, color) {
  const d = (DIVIDER[kind] || DIVIDER.none)(color); if (!d) return ['none', 0];
  return [svgUri('<svg xmlns="http://www.w3.org/2000/svg" width="' + d[1] + '" height="' + d[2] + '" viewBox="0 0 ' + d[1] + ' ' + d[2] + '" fill="none" stroke="' + color + '" stroke-linecap="round">' + d[0].replace(/"C"/g, '"' + color + '"') + '</svg>'), d[2]];
}
/* texturas */
const noiseUri = (freq, oct, rgb, a) => svgUri('<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="' + freq + '" numOctaves="' + oct + '" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 ' + rgb[0] + ' 0 0 0 0 ' + rgb[1] + ' 0 0 0 0 ' + rgb[2] + ' 0 0 0 ' + a + ' 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>');
const veinsUri = rgb => svgUri('<svg xmlns="http://www.w3.org/2000/svg" width="420" height="420"><filter id="v"><feTurbulence type="turbulence" baseFrequency=".006 .011" numOctaves="5" seed="7" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 ' + rgb[0] + ' 0 0 0 0 ' + rgb[1] + ' 0 0 0 0 ' + rgb[2] + ' 0 0 0 -9 4.1"/></filter><rect width="100%" height="100%" filter="url(#v)"/></svg>');
const distressUri = svgUri('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="d"><feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="3" seed="3"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -7 4.6"/></filter><rect width="100%" height="100%" filter="url(#d)"/></svg>');
function starsUri(color) { // campo de estrelas determinístico
  let s = 11, r = () => (s = (s * 16807) % 2147483647) / 2147483647, d = '';
  for (let i = 0; i < 46; i++) d += '<circle cx="' + (r() * 400 | 0) + '" cy="' + (r() * 400 | 0) + '" r="' + (.5 + r() * 1.1).toFixed(2) + '" fill="' + color + '" fill-opacity="' + (.18 + r() * .5).toFixed(2) + '"/>';
  return svgUri('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">' + d + '</svg>');
}

/* paleta: [bg, bg2, bg3, line, tx, mut, ac, ac2, gold, onAc] */
const P = a => ({ bg: a[0], bg2: a[1], bg3: a[2], line: a[3], tx: a[4], mut: a[5], ac: a[6], ac2: a[7], gold: a[8], onac: a[9] || '#ffffff' });
const rgbOf = h => [1, 3, 5].map(i => (parseInt(h.slice(i, i + 2), 16) / 255).toFixed(3));
const SC = 'repeating-linear-gradient(0deg,rgba(255,255,255,.028) 0 1px,transparent 1px 3px)';
const GRIDL = 'repeating-linear-gradient(0deg,transparent 0 31px,rgba(255,255,255,.04) 31px 32px),repeating-linear-gradient(90deg,transparent 0 31px,rgba(255,255,255,.04) 31px 32px)';

/* ui: r = raio dos controles, rc = raio de cartões/modais, rch = raio de chips, clip = chanfro dos botões, orn = canto, div = divisor, frame = moldura,
   cs = tamanho do canto, ground(p) = camadas do fundo da página, hero = composição da Home */
const THEMES = {
  classic: { mode: 'classic', name: 'Clássico', glyph: 'd20', tag: 'Sobriedade e foco.', v: 'classic', pal: P(['#0a0b0d', '#101216', '#171a1f', '#262a31', '#e8e3d6', '#8f9399', '#c1121f', '#e5383b', '#c9a227']),
    ui: { r: 8, rc: 14, rch: 999, orn: 'none', div: 'none', cs: 0, hero: 'plain' } },

  /* ---------------- D&D ---------------- */
  dnd_guerreiro: { mode: 'dnd', name: 'Guerreiro', glyph: 'legend_sword', tag: 'Honra, aço e sangue-frio.', v: 'guerreiro', pal: P(['#0d0f12', '#161a1f', '#1f252c', '#3a434e', '#eceff2', '#9ca7b3', '#b8322a', '#e0554a', '#c9d2dd']),
    ui: { r: 3, rc: 6, rch: 3, clip: 'polygon(0 0,calc(100% - 9px) 0,100% 9px,100% 100%,9px 100%,0 calc(100% - 9px))', orn: 'plate', div: 'plate', cs: 26, hero: 'tome',
      frame: 'inset 0 0 0 1px #5b6673,inset 0 0 0 4px var(--bg2),inset 0 0 0 5px #3d4650', ground: p => ['repeating-linear-gradient(90deg,rgba(255,255,255,.022) 0 1px,transparent 1px 3px)', 'radial-gradient(900px 500px at 50% -8%,rgba(184,50,42,.16),transparent 70%)'] } },
  dnd_mago: { mode: 'dnd', name: 'Mago', glyph: 'legend_staff', tag: 'O saber arcano aguarda.', v: 'mago', pal: P(['#070816', '#0e1030', '#171b48', '#2d3678', '#e9ebff', '#98a0e0', '#6d7bff', '#9aa5ff', '#ecc978', '#08091f']),
    ui: { r: 11, rc: 18, rch: 999, orn: 'star', div: 'star', cs: 28, co: 8, hero: 'tome',
      frame: 'inset 0 0 0 1px rgba(236,201,120,.38),inset 0 0 0 4px var(--bg2),inset 0 0 0 5px rgba(236,201,120,.16)', ground: p => [starsUri('#e9ebff'), 'radial-gradient(1000px 600px at 78% -10%,rgba(109,123,255,.22),transparent 65%)', 'radial-gradient(800px 500px at 0% 100%,rgba(120,60,200,.16),transparent 70%)'] } },
  dnd_clerigo: { mode: 'dnd', name: 'Clérigo', glyph: 'legend_mace', tag: 'A luz abençoa o caminho.', v: 'clerigo', light: true, pal: P(['#eef0f4', '#fbfcfd', '#e2e6ee', '#c4cbd9', '#17203a', '#556079', '#cf9f12', '#b88a0a', '#80600a', '#191204']),
    ui: { r: 4, rc: '24px 24px 8px 8px', rch: 4, orn: 'cross', div: 'cross', cs: 28, co: 11, hero: 'tome',
      frame: 'inset 0 0 0 1px rgba(128,96,10,.55),inset 0 0 0 4px var(--bg2),inset 0 0 0 5px rgba(128,96,10,.28)', ground: p => [noiseUri('.035 .05', 3, [.35, .38, .5], .05), 'radial-gradient(900px 520px at 50% -12%,rgba(232,185,42,.26),transparent 70%)'] } },
  dnd_ladino: { mode: 'dnd', name: 'Ladino', glyph: 'legend_dagger', tag: 'Nas sombras, tudo é possível.', v: 'ladino', pal: P(['#060b0a', '#0c1514', '#132220', '#25433e', '#d8e9e4', '#80a69d', '#1fa393', '#3fd0bd', '#b9cb7c', '#021411']),
    ui: { r: 2, rc: '0 18px 0 18px', rch: 2, orn: 'dagger', div: 'blade', cs: 24, co: 6, hero: 'tome',
      frame: 'inset 0 0 0 1px rgba(63,208,189,.28)', ground: p => ['repeating-linear-gradient(104deg,transparent 0 17px,rgba(150,230,215,.028) 17px 18px)', 'radial-gradient(900px 520px at 20% 110%,rgba(31,163,147,.18),transparent 70%)'] } },
  dnd_druida: { mode: 'dnd', name: 'Druida', glyph: 'legend_sickle', tag: 'A natureza também luta.', v: 'druida', pal: P(['#09100a', '#111b12', '#1a2a1a', '#34512f', '#e8f1db', '#96b38c', '#6cab3f', '#8fcf5f', '#dcab5c', '#08140a']),
    ui: { r: 12, rc: '30px 6px 30px 6px', rch: 999, orn: 'leaf', div: 'vine', cs: 28, co: 7, hero: 'tome',
      frame: 'inset 0 0 0 1px rgba(143,207,95,.26)', ground: p => ['radial-gradient(500px 360px at 12% 18%,rgba(108,171,63,.14),transparent 70%)', 'radial-gradient(620px 420px at 90% 80%,rgba(220,171,92,.10),transparent 70%)', noiseUri('.012 .02', 4, rgbOf('#8fcf5f'), .06)] } },
  dnd_bardo: { mode: 'dnd', name: 'Bardo', glyph: 'legend_lute', tag: 'Toda mesa merece uma canção.', v: 'bardo', pal: P(['#13070e', '#21101b', '#2f1827', '#5d3048', '#f9eaf0', '#c79cb1', '#c2306f', '#ec5a98', '#f6bb4a', '#ffffff']),
    ui: { r: 9, rc: '14px 14px 22px 22px', rch: 999, orn: 'note', div: 'staff', cs: 26, co: 7, hero: 'tome',
      frame: 'inset 0 0 0 1px rgba(246,187,74,.34),inset 0 0 0 4px var(--bg2),inset 0 0 0 5px rgba(246,187,74,.14)', ground: p => ['radial-gradient(700px 360px at 50% -6%,rgba(246,187,74,.20),transparent 70%)', 'repeating-linear-gradient(90deg,rgba(0,0,0,.34) 0 46px,rgba(0,0,0,0) 46px 92px)'] } },

  /* ---------------- Ordem Paranormal ---------------- */
  ordem: { mode: 'ordem', name: 'A Ordem', glyph: 'sigil', tag: 'A realidade é só a superfície.', v: 'ordem', pal: P(['#09090b', '#111114', '#19191d', '#34343c', '#f0f0f0', '#9d9da7', '#e10f26', '#ff4254', '#d8d8d8']),
    ui: { r: 2, rc: 2, rch: 2, clip: 'polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%)', orn: 'crop', div: 'hazard', cs: 22, hero: 'file', stamp: 'ACESSO NÍVEL 4',
      ground: p => [SC, GRIDL] } },
  cultistas: { mode: 'ordem', name: 'Cultistas', glyph: 'pentagram', tag: 'O ritual já começou.', v: 'cultistas', pal: P(['#0b0710', '#150d1d', '#201429', '#44315c', '#f0e4f7', '#a98fbd', '#9a3fd1', '#c070f7', '#dcaa4e']),
    ui: { r: 6, rc: 10, rch: 999, orn: 'ring', div: 'runes', cs: 26, hero: 'file', stamp: 'RITUAL EM ANDAMENTO',
      ground: p => ['repeating-radial-gradient(circle at 50% 34%,transparent 0 58px,rgba(192,112,247,.075) 58px 59px)', 'radial-gradient(900px 600px at 50% 34%,rgba(154,63,209,.16),transparent 70%)', noiseUri('.8', 2, rgbOf('#c070f7'), .05)] } },
  sangue: { mode: 'ordem', name: 'Sangue', glyph: 'drop', img: 'sangue', tag: 'Tudo começa pelo Sangue.', v: 'sangue', pal: P(['#a30d19', '#2b0508', '#3f080d', '#7a1b22', '#fff1ee', '#f2c9c3', '#d11a28', '#ff4a58', '#ffb4aa']),
    ui: { r: 3, rc: 4, rch: 3, orn: 'drip', div: 'drip', cs: 26, hero: 'file', stamp: 'CONFIDENCIAL', fx: 'blood', vig: 'transparent',
      ground: p => [] } },
  morte: { mode: 'ordem', name: 'Morte', glyph: 'skull', img: 'morte', tag: 'O Tempo leva todas as coisas.', v: 'morte', pal: P(['#0a0a0c', '#121215', '#1a1a1e', '#3d3d46', '#e6e6ea', '#9696a1', '#c9ccd6', '#eef0f6', '#b9b9c6', '#0a0a0c']),
    ui: { r: 2, rc: 2, rch: 2, orn: 'xmark', div: 'rule', cs: 22, hero: 'file', stamp: 'ARQUIVO ENCERRADO',
      frame: 'inset 0 0 0 5px var(--bg2),inset 0 0 0 6px rgba(201,204,214,.34)', ground: p => [noiseUri('.5', 3, rgbOf('#c9ccd6'), .06)] } },
  conhecimento: { mode: 'ordem', name: 'Conhecimento', glyph: 'eye', img: 'conhecimento', tag: 'Saber tudo é perder tudo.', v: 'conhecimento', pal: P(['#0d0a04', '#181207', '#241b0b', '#4d3c16', '#f7edd6', '#b0a074', '#e8a900', '#ffc933', '#ffe08a', '#1a1204']),
    ui: { r: 2, rc: 3, rch: 2, orn: 'eye', div: 'ruler', cs: 24, hero: 'file', stamp: 'ACERVO RESTRITO', fx: 'know',
      ground: p => ['radial-gradient(900px 500px at 50% -10%,rgba(232,169,0,.14),transparent 70%)'] } },
  energia: { mode: 'ordem', name: 'Energia', glyph: 'bolt', img: 'energia', tag: 'O Caos é inevitável.', v: 'energia', pal: P(['#080614', '#100b24', '#1a113a', '#3a2879', '#eee8ff', '#a496de', '#a65cf5', '#c58bff', '#62e4ff', '#0b0618']),
    ui: { r: 2, rc: 3, rch: 2, clip: 'polygon(0 0,calc(100% - 9px) 0,100% 9px,100% 100%,9px 100%,0 calc(100% - 9px))', orn: 'bolt', div: 'circuit', cs: 26, hero: 'file', stamp: 'SINAL INSTÁVEL', fx: 'glitch',
      ground: p => ['radial-gradient(900px 520px at 85% -10%,rgba(166,92,245,.26),transparent 70%)'] } },
  medo: { mode: 'ordem', name: 'Medo', glyph: 'mask', img: 'medo', tag: 'O Medo é infinito.', v: 'medo', pal: P(['#030304', '#09090b', '#101012', '#2e2e33', '#f3f3f3', '#9c9ca2', '#f3f3f3', '#ffffff', '#c9c9cd', '#050505']),
    ui: { r: 0, rc: 0, rch: 0, orn: 'none', div: 'none', cs: 0, hero: 'file', stamp: 'NÃO OLHE ATRÁS', fx: 'fog', vig: 'rgba(0,0,0,.78)',
      ground: p => [noiseUri('.9', 2, rgbOf('#ffffff'), .05)] } }
};
const THEME_ORDER = Object.keys(THEMES);
const DEFAULT_THEME = 'ordem';

/* CSS do tema ativo: só variáveis, o resto do visual está em style.css */
function themeCss(id) {
  const t = THEMES[id], p = t.pal, u = t.ui, f = VOICE[t.v], q = s => String(s).replace(/"/g, '\\"');
  const [divImg, divH] = dividerUri(u.div, p.gold), corners = cornerSet(u.orn, p.gold), rcard = typeof u.rc === 'number' ? u.rc + 'px' : u.rc;
  const ground = (u.ground ? u.ground(p) : []).concat(['radial-gradient(ellipse at center,transparent 52%,' + (u.vig || (t.light ? 'rgba(70,84,120,.13)' : 'rgba(0,0,0,.34)')) + ')']).join(',');
  const v = {
    '--bg': p.bg, '--bg2': p.bg2, '--bg3': p.bg3, '--line': p.line, '--tx': p.tx, '--mut': p.mut, '--ac': p.ac, '--ac2': p.ac2, '--gold': p.gold, '--onac': p.onac,
    '--font-head': f.head, '--font-hero': f.hero || f.head, '--font-body': f.body, '--font-mono': f.mono, '--head-tt': f.tt, '--head-ls': f.ls, '--head-w': f.w, '--hero-w': f.hw, '--h2': f.h2 + 'px',
    '--r': u.r + 'px', '--r-card': rcard, '--r-chip': u.rch === 999 ? '999px' : u.rch + 'px', '--btn-clip': u.clip || 'none', '--frame': u.frame || '0 0 0 0 transparent', '--co': (u.co == null ? 5 : u.co) + 'px', '--distress': distressUri,
    '--corners': corners, '--cs': (u.cs || 0) + 'px', '--divider': divImg, '--div-h': divH + 'px', '--ground': ground, '--stamp': '"' + q(u.stamp || 'MESA ABERTA') + '"',
    '--shade': t.light ? 'rgba(40,52,90,.26)' : 'rgba(0,0,0,.66)'
  };
  if (t.light) Object.assign(v, { '--ok': '#17803f', '--warn': '#9a6b00', '--bad': '#b3261e', '--inp': '#ffffff', '--pop': 'var(--bg2)' });
  let css = ':root{'; for (const k in v) css += k + ':' + v[k] + ';'; css += '}';
  if (u.scan) css += 'body:not(:has(.play)):not(:has(#app))::after{content:"";position:fixed;left:0;right:0;top:0;height:22vh;pointer-events:none;z-index:1;background:linear-gradient(transparent,rgba(166,92,245,.10) 55%,transparent);animation:scanbar 11s linear infinite}@keyframes scanbar{from{transform:translateY(-30vh)}to{transform:translateY(110vh)}}';
  return css;
}
/* marca d'água do símbolo do tema (PNG translúcido) */
const ICON_IMG = {};
function themeImg(t) { // símbolo em imagem (elementos da Ordem); devolve a imagem só quando já carregou
  if (!t.img || typeof Image === 'undefined') return null; let im = ICON_IMG[t.img];
  if (!im) { im = ICON_IMG[t.img] = new Image(); im.onload = () => { document.querySelectorAll('canvas[data-tm]').forEach(cv => drawThemeIcon(cv.getContext('2d'), cv.dataset.tm, cv.width)); if (document.documentElement.dataset.theme) applyTheme(document.documentElement.dataset.theme); }; im.src = ELEMENT_IMG[t.img]; }
  return im.complete && im.naturalWidth ? im : null;
}
function drawThemeIcon(c, id, px) { const t = THEMES[id], im = themeImg(t); c.clearRect(0, 0, px, px); if (im) c.drawImage(im, 0, 0, px, px); else drawGlyph(c, t.glyph, t.pal.ac, px); }
function watermark(t) {
  try {
    const cv = document.createElement('canvas'); cv.width = cv.height = 512; const c = cv.getContext('2d');
    c.globalAlpha = t.light ? .07 : .06; const im = themeImg(t); if (im) c.drawImage(im, 0, 0, 512, 512); else drawGlyph(c, t.glyph, t.pal.ac, 512); return 'url(' + cv.toDataURL('image/png') + ')';
  } catch (e) { return 'none'; }
}
function ensureThemeAssets() {
  if (!document.getElementById('theme-css')) { const s = document.createElement('style'); s.id = 'theme-css'; document.head.append(s); }
  if (!document.getElementById('theme-fonts')) { const l = document.createElement('link'); l.id = 'theme-fonts'; l.rel = 'stylesheet'; l.href = THEME_FONTS; l.onerror = () => { /* offline: usa as fontes de reserva */ }; document.head.append(l); }
}
/* fundos animados (só Sangue e Energia): poucos elementos que animam apenas transform/opacity; somem no editor e no jogo */
function applyFx(id) {
  const old = document.getElementById('fx'); if (old) old.remove();
  const t = THEMES[id], k = t && t.ui.fx; if (!k || !Prefs.v.motion) return;
  let s = 17; const r = () => (s = (s * 16807) % 2147483647) / 2147483647, f = (n, d) => n.toFixed(d == null ? 1 : d);
  const box = document.createElement('div'); box.id = 'fx'; box.className = 'fx-' + k; let html = '';
  if (k === 'blood') {
    /* fundo e lua entram em bloodScene() */
  } else if (k === 'glitch') {
    const CH = '0123456789012345678901234567890123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', cols = ['0,235,255', '255,40,210', '166,92,245', '120,255,200'];
    for (let i = 0; i < 62; i++) { let tx = ''; const n = 10 + (r() * 16 | 0); for (let j = 0; j < n; j++) tx += (j ? '\n' : '') + CH[r() * CH.length | 0];
      html += '<i class="rn" style="--x:' + f(i * 1.6 + r() * 1.2) + '%;--fs:' + (12 + (r() * 8 | 0)) + 'px;--d:' + f(3.4 + r() * 4.6) + 's;--dl:-' + f(r() * 8) + 's">' + tx + '</i>'; }
    for (let i = 0; i < 10; i++) html += '<i class="gb" style="--t:' + f(r() * 96) + '%;--h:' + (3 + (r() * 34 | 0)) + 'px;--w:' + (30 + (r() * 70 | 0)) + '%;--l:' + f(r() * 50) + '%;--d:' + f(2.6 + r() * 4) + 's;--dl:-' + f(r() * 9) + 's;--dx:' + ((r() < .5 ? -1 : 1) * (14 + (r() * 60 | 0))) + 'px;--c:rgba(' + cols[i % cols.length] + ',.62)"></i>';
    html += '<i class="gf"></i>';
  } else if (k === 'fog') {
    html += '<i class="mist m4"></i><i class="mist m1"></i><i class="mist m2"></i><i class="mist m3"></i>';
  } else if (k === 'know') {
    const Q = ['Cogito ergo sum', '1/137', 'Lorem ipsum dolor sit amet', 'E = mc²', 'e^(iπ) + 1 = 0', 'Γνῶθι σεαυτόν', 'Scio me nihil scire', '我思故我在', 'Je pense, donc je suis', 'Ich denke, also bin ich', 'Penso, logo existo', 'Ars longa, vita brevis', 'πάντα ῥεῖ', 'ΔxΔp ≥ ħ/2', '∇·E = ρ/ε₀', 'iħ ∂ψ/∂t = Ĥψ', 'Gμν + Λgμν = 8πG Tμν', 'a² + b² = c²', 'S = k log W', "L'enfer, c'est les autres", 'Sapere aude', 'Memento mori', 'Знание — сила', '知識は力なり', 'Tudo o que sei é que nada sei', 'φ = 1,6180339…', 'c = 299 792 458 m/s', 'Cogitationes nostras', '42', 'Veni, vidi, vici', 'Nosce te ipsum', 'F = ma'];
    for (let i = 0; i < Q.length; i++) html += '<i class="kq" style="--fs:' + (14 + (r() * 12 | 0)) + 'px">' + Q[i] + '</i>';
      }
  box.innerHTML = html; document.body.prepend(box);
  if (k === 'blood') { bloodScene(box); bloodFx(box); } else if (k === 'fog') fogFx(box);
  if (k === 'know') {
    const qs = [...box.querySelectorAll('.kq')], place = () => {
      if (!box.isConnected) { clearInterval(box._t); return; }
      if (document.hidden) return;
      const W = innerWidth, H = innerHeight, placed = W >= 900 ? [{ x: W / 2 - 250, y: 0, w: 500, h: H }] : [], order = qs.map(q => q).sort(() => Math.random() - .5);
      qs.forEach(q => q.style.visibility = 'hidden');
      for (const q of order) {
        if (placed.length >= 17) break;
        const w = q.offsetWidth, h = q.offsetHeight; if (w > W - 24) continue;
        for (let n = 0; n < 40; n++) {
          const x = 12 + Math.random() * (W - w - 24), y = 8 + Math.random() * (H - h - 16);
          if (placed.every(p => x + w + 22 < p.x || p.x + p.w + 22 < x || y + h + 12 < p.y || p.y + p.h + 12 < y)) { placed.push({ x, y, w, h }); q.style.transform = 'translate(' + x.toFixed(0) + 'px,' + y.toFixed(0) + 'px)'; q.style.visibility = 'visible'; break; }
        }
      }
    };
    const swap = () => { box.classList.add('kb'); setTimeout(() => { place(); box.classList.remove('kb'); }, 260); };
    place(); box._t = setInterval(swap, 3000);
  }
}
function applyTheme(id) {
  if (!THEMES[id]) id = DEFAULT_THEME; ensureThemeAssets();
  const t = THEMES[id], r = document.documentElement;
  document.getElementById('theme-css').textContent = themeCss(id) + ':root{--wm:' + watermark(t) + '}';
  r.dataset.theme = id; r.dataset.mode = t.mode; r.dataset.hero = t.ui.hero; r.style.colorScheme = t.light ? 'light' : 'dark';
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = t.pal.bg;
  document.querySelectorAll('canvas.brandmark').forEach(paintMark);
  return id;
}
/* símbolo do tema desenhado com os mesmos ícones dos itens, na cor do tema */
function paintMark(cv) {
  const t = THEMES[document.documentElement.dataset.theme] || THEMES[DEFAULT_THEME], px = cv.width, c = cv.getContext('2d');
  if (cv.dataset.glyph) { c.clearRect(0, 0, px, px); drawGlyph(c, cv.dataset.glyph, '#c9a227', px); } else drawThemeIcon(c, document.documentElement.dataset.theme in THEMES ? document.documentElement.dataset.theme : DEFAULT_THEME, px);
}
function brandMark(size, glyph) {
  const cv = h('canvas', { class: 'brandmark', width: Math.round(size * 2), height: Math.round(size * 2), style: 'width:' + size + 'px;height:' + size + 'px' }); if (glyph) cv.dataset.glyph = glyph; paintMark(cv); return cv;
}
function themeSwatch(id, o) { // cartão de tema: o próprio cartão usa as cores, a fonte e a moldura do tema
  const t = THEMES[id], p = t.pal, f = VOICE[t.v], u = t.ui;
  const cv = h('canvas', { width: 64, height: 64, style: 'width:32px;height:32px', 'data-tm': id }); drawThemeIcon(cv.getContext('2d'), id, 64);
  return h('button', { type: 'button', class: 'theme-card' + (o && o.on ? ' on' : ''), title: t.tag, style: 'background:' + p.bg2 + ';border-color:' + p.line + ';color:' + p.tx + ';border-radius:' + (typeof u.rc === 'number' ? Math.min(u.rc, 14) + 'px' : u.rc.split(' ').map(x => Math.min(parseInt(x), 14) + 'px').join(' ')), onclick: o && o.onclick },
    h('span', { class: 'sw', style: 'background:linear-gradient(135deg,' + p.bg3 + ',' + p.bg + ');border-color:' + p.line }, cv),
    h('b', { style: 'font-family:' + f.head + ';text-transform:' + f.tt + ';letter-spacing:' + f.ls }, t.name),
    h('span', { class: 'dots2' }, [p.ac, p.ac2, p.gold].map(c => h('i', { style: 'background:' + c }))));
}

/* ---------- preferências (neste navegador e, com conta, no perfil) ---------- */
const Prefs = {
  v: { theme: DEFAULT_THEME, motion: true, nick: '', avatar: '' },
  _subs: [],
  init() { const saved = store.get('vtt-prefs', {}); this.v = Object.assign({ theme: DEFAULT_THEME, motion: true, nick: '', avatar: '' }, saved); this.apply(); },
  apply() { this.v.theme = applyTheme(this.v.theme); document.documentElement.classList.toggle('nomotion', !this.v.motion); applyFx(this.v.theme); },
  on(fn) { this._subs.push(fn); },
  _emit() { this._subs = this._subs.filter(f => { try { return f(this.v) !== 'off'; } catch (e) { return true; } }); },
  set(patch, quiet) {
    Object.assign(this.v, patch); store.set('vtt-prefs', this.v); this.apply();
    if (('theme' in patch || 'motion' in patch) && typeof Cloud !== 'undefined' && Cloud.user && Cloud.profile) Cloud.savePrefs({ theme: this.v.theme, motion: this.v.motion }).catch(() => { /* sem coluna no banco: fica só neste navegador */ });
    if (!quiet) this._emit();
  },
  adopt(remote) { // preferências vindas da conta (não regrava na nuvem)
    if (!remote || typeof remote !== 'object' || !THEMES[remote.theme]) return;
    Object.assign(this.v, { theme: remote.theme, motion: remote.motion !== false }); store.set('vtt-prefs', this.v); this.apply(); this._emit();
  }
};
