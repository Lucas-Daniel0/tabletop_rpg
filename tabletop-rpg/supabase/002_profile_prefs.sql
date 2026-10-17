-- 002 — foto de perfil e preferências (tema, animações) guardadas na conta.
-- Rode uma vez no SQL Editor do projeto. É seguro rodar de novo. O app funciona sem isto (guarda só no navegador).
alter table public.profiles add column if not exists avatar text;
alter table public.profiles add column if not exists prefs jsonb not null default '{}'::jsonb;
