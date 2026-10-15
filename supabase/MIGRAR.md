# Mudar o Tabletop RPG para outro projeto/organização do Supabase

Projeto antigo (será excluído): `tabletop-rpg` · ref `dulzopyrmklficdjjgiu` · região sa-east-1 · Postgres 17
Estado na hora do backup: **0 usuários, 0 campanhas, 0 personagens, 0 imagens** → não há dados para migrar, só a estrutura.

## 1. Criar o projeto novo
1. Dashboard do Supabase → escolha a organização certa → **New project**.
2. Nome `tabletop-rpg`, região **South America (São Paulo)**, defina e guarde a senha do banco.

## 2. Recriar o banco (1 minuto)
1. No projeto novo: **SQL Editor → New query**.
2. Cole o conteúdo inteiro de `supabase/001_schema.sql` e clique **Run**. (Pode rodar de novo sem problema.)
3. Confira em **Table Editor**: `profiles`, `campaigns`, `campaign_assets`, `characters`, `campaign_members`, todas com RLS ligado.

## 3. Pegar a URL e a chave do projeto novo
Project Settings → **API Keys** (ou Connect): copie a **Project URL** (`https://XXXX.supabase.co`) e a chave
**anon / publishable** (`eyJ…` ou `sb_publishable_…`). A chave `service_role`/secret NUNCA vai no código.

## 4. Apontar o app para o projeto novo
```
node supabase/trocar-projeto.js https://XXXX.supabase.co SUA_CHAVE_PUBLICA
```
Isso edita `src/cloud.js`, refaz o build e atualiza o `index.html`. Depois é só subir o `index.html` (e `src/`) no GitHub.
(Sem Node: abra `src/cloud.js`, troque `url` e `key` no bloco `CLOUD` e rode `node build.js`.)

## 5. Refazer os ajustes de painel (não vêm no SQL)
- **Authentication → URL Configuration:** Site URL = URL do GitHub Pages; Redirect URLs = `https://SEU-USUARIO.github.io/tabletop-rpg/**`
- **Authentication → Sign In / Providers:** ligar **Allow anonymous sign-ins** (convidado); "Confirm email" a seu critério.
- **Google (opcional):** novo OAuth Client com redirect `https://NOVOREF.supabase.co/auth/v1/callback` (o ref mudou!) e colar Client ID/Secret.
  Se já tinha um OAuth Client, adicione esse novo redirect nele e remova o antigo.
- **SMTP próprio** antes de abrir para outras pessoas.
- Realtime: nada a configurar (usa Broadcast público por código).

## 6. Testar
Abra o site, crie conta, monte uma campanha, entre como convidado numa aba anônima com o código.
