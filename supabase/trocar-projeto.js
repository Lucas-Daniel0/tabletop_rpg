#!/usr/bin/env node
'use strict';
// Troca a URL e a chave pública do Supabase em src/cloud.js e refaz o build.
// Uso:  node supabase/trocar-projeto.js https://NOVOREF.supabase.co CHAVE_ANON_OU_PUBLISHABLE
const fs = require('fs'), path = require('path'), cp = require('child_process');
const [url, key] = process.argv.slice(2);
if (!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url || '') || !key || key.length < 20) {
  console.error('Uso: node supabase/trocar-projeto.js https://SEU-REF.supabase.co SUA_CHAVE_PUBLICA'); process.exit(1);
}
const f = path.join(__dirname, '..', 'src', 'cloud.js');
let s = fs.readFileSync(f, 'utf8');
const before = s;
s = s.replace(/url:\s*'[^']*'/, "url: '" + url.replace(/\/$/, '') + "'").replace(/key:\s*'[^']*'/, "key: '" + key + "'");
if (s === before) { console.error('Nada mudou: confira o formato do bloco CLOUD em src/cloud.js'); process.exit(1); }
fs.writeFileSync(f, s);
console.log('src/cloud.js atualizado.');
cp.execSync('node build.js', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
const out = path.join(__dirname, '..', 'dist', 'tabletop.html');
if (fs.existsSync(out)) { fs.copyFileSync(out, path.join(__dirname, '..', 'index.html')); console.log('index.html atualizado (pronto para subir no GitHub).'); }
