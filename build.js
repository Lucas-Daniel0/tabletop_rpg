const fs = require('fs'), path = require('path');
const S = f => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const js = ['core.js', 'art.js', 'catalog.js', 'lights.js', 'items.js', 'glyphs2.js', 'itemdb.js', 'icons_el.js', 'bloodbg.js', 'fx.js', 'themes.js', 'render.js', 'net.js', 'cloud.js', 'engine.js', 'templates.js', 'templates_dnd.js', 'ui_base.js', 'ui_items.js', 'ui_player.js', 'ui_master.js', 'ui_auth.js', 'ui_profile.js', 'ui_main.js'].map(f => '/* ---- ' + f + ' ---- */\n' + S(f)).join('\n');
const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="#0a0b0d">
<title>Tabletop — Mesa de imersão</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="preconnect" href="https://cdn.jsdelivr.net">
<script id="sb-cdn" async src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js" onerror="window.__sbErr=1"></script>
<style>
${S('style.css')}
</style>
</head>
<body>
<div id="root"></div>
<script>
${js}
</script>
</body>
</html>
`;
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'tabletop.html'), html);
console.log('dist/tabletop.html', (html.length / 1024).toFixed(0) + ' KB');
