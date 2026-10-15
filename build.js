const fs = require('fs'), path = require('path');
const S = f => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const js = ['core.js', 'art.js', 'catalog.js', 'lights.js', 'render.js', 'net.js', 'cloud.js', 'engine.js', 'templates.js', 'ui_base.js', 'ui_player.js', 'ui_master.js', 'ui_auth.js', 'ui_main.js'].map(f => '/* ---- ' + f + ' ---- */\n' + S(f)).join('\n');
const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="#0a0b0d">
<title>Tabletop — Mesa de imersão</title>
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
