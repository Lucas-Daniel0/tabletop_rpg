# Tabletop RPG — mesa de imersão (Ordem Paranormal / D&D)

Site de arquivo único (`index.html`), gerado a partir de `src/` por `node build.js`.
Online com Supabase (projeto `cbttmcffujohaoqnfqgz`, organização separada do Centro de Saúde) e publicado no GitHub Pages.

## Como tudo se liga
```
git push (main) ──► GitHub Actions
                     ├─ pages.yml     → node build.js → publica no GitHub Pages
                     └─ supabase.yml  → (só se supabase/** mudou) aplica migrações novas no Supabase
```
- Mexeu em `src/`? Rode `node build.js` (opcional: o Actions refaz o build sozinho) e dê push.
- Mexeu no banco? Crie um arquivo novo em `supabase/migrations/AAAAMMDDHHMMSS_nome.sql` e dê push.
- Mexeu em login/URLs/convidado? Edite `supabase/config.toml` e dê push.

## Configuração única (uns 10 minutos)

### 1. Repositório
1. GitHub → **New repository** → nome `tabletop-rpg` (público, para o Pages gratuito) → crie vazio.
2. Nesta pasta: `git init -b main && git add . && git commit -m "Tabletop RPG" && git remote add origin https://github.com/SEU-USUARIO/tabletop-rpg.git && git push -u origin main`
3. Repositório → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. O site fica em `https://SEU-USUARIO.github.io/tabletop-rpg/` depois do primeiro workflow verde (aba **Actions**).

### 2. Segredos do GitHub (Settings → Secrets and variables → Actions → New repository secret)
| Nome | Onde pegar |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | supabase.com/dashboard/account/tokens → Generate new token |
| `SUPABASE_DB_PASSWORD` | a senha do banco que você definiu ao criar o projeto (Project Settings → Database → Reset, se esqueceu) |

Nunca coloque `service_role`, senha do banco ou token no código. A chave `sb_publishable_…` em `src/cloud.js` é pública de propósito.

### 3. Supabase (opcional se o painel já está configurado)
O projeto atual já tem o banco e o Auth prontos, então o workflow do Supabase só serve para **migrações futuras**.
Aba **Actions → Atualizar o Supabase → Run workflow**: aplica `supabase/migrations/*` (seguro rodar de novo).
Se marcar "aplicar_config_auth", ele também envia `supabase/config.toml` (convidado ligado, Site URL e Redirect URLs do seu Pages)
e **sobrescreve** o Auth do painel — use só num projeto novo.

### 4. O que continua manual (o Supabase não deixa por arquivo)
- **Google:** crie o OAuth Client no Google Cloud com redirect `https://cbttmcffujohaoqnfqgz.supabase.co/auth/v1/callback`, salve `GOOGLE_CLIENT_ID` e `GOOGLE_SECRET` como secrets, e em `config.toml` troque `enabled = true` e descomente as duas linhas.
- **SMTP próprio:** Authentication → Emails → SMTP Settings, antes de abrir para outras pessoas (o e-mail padrão do Supabase tem limite baixíssimo). Só então ligue `enable_confirmations = true`.

### 5. Testar
Abra o site, crie conta, monte uma campanha, e entre como convidado numa aba anônima com o código da mesa.

## Trocar de projeto Supabase
`node supabase/trocar-projeto.js https://NOVOREF.supabase.co CHAVE_PUBLICA` e troque `PROJECT_REF` em `.github/workflows/supabase.yml`.
Mais detalhes em `supabase/MIGRAR.md`.
