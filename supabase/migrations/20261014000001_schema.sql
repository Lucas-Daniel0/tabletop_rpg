-- =====================================================================
-- TABLETOP RPG — esquema completo do banco (Supabase / Postgres 17)
-- Exportado do projeto "tabletop-rpg" (ref dulzopyrmklficdjjgiu) em 2026-10-15.
-- Como usar num projeto novo: Supabase → SQL Editor → New query → cole TUDO → Run.
-- É seguro rodar mais de uma vez (idempotente).
-- =====================================================================

-- ---------- TABELAS ----------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  is_guest     boolean not null default false,
  onboarded    boolean not null default false,
  default_role text not null default 'player' check (default_role in ('player','master')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.campaigns (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  name       text not null default 'Nova campanha',
  code       text not null unique,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaign_assets (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  id          text not null,
  data        text not null,
  created_at  timestamptz not null default now(),
  primary key (campaign_id, id)
);

create table if not exists public.characters (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  name       text not null default 'Personagem',
  style      jsonb not null default '{}'::jsonb,
  image      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaign_members (
  campaign_id  uuid not null references public.campaigns(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  character_id uuid references public.characters(id) on delete set null,
  joined_at    timestamptz not null default now(),
  primary key (campaign_id, user_id)
);

create index if not exists campaign_members_user_idx on public.campaign_members (user_id);
create index if not exists campaigns_owner_idx       on public.campaigns (owner_id);
create index if not exists characters_owner_idx      on public.characters (owner_id);

-- ---------- FUNÇÕES ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path to '' as $$
begin new.updated_at = now(); return new; end $$;

create or replace function public.gen_campaign_code()
returns text language plpgsql security definer set search_path to '' as $$
declare alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; c text; i int;
begin
  loop
    c := '';
    for i in 1..6 loop c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1); end loop;
    exit when not exists (select 1 from public.campaigns where code = c);
  end loop;
  return c;
end $$;

create or replace function public.campaigns_set_code()
returns trigger language plpgsql security definer set search_path to '' as $$
begin
  if new.code is null or new.code = '' then new.code := public.gen_campaign_code(); end if;
  return new;
end $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path to '' as $$
begin
  insert into public.profiles (id, display_name, is_guest)
  values (new.id,
          coalesce(nullif(new.raw_user_meta_data->>'display_name',''), nullif(new.raw_user_meta_data->>'full_name',''), nullif(new.raw_user_meta_data->>'name',''), ''),
          coalesce(new.is_anonymous, false))
  on conflict (id) do nothing;
  return new;
end $$;

-- entrar numa mesa pelo código (o jogador nunca lê a campanha direto)
create or replace function public.join_campaign(p_code text, p_character uuid default null)
returns table(campaign_id uuid, campaign_name text)
language plpgsql security definer set search_path to '' as $$
#variable_conflict use_column
declare c public.campaigns;
begin
  if auth.uid() is null then raise exception 'não autenticado'; end if;
  select * into c from public.campaigns where code = upper(trim(p_code));
  if not found then raise exception 'código de campanha inválido'; end if;
  if p_character is not null and not exists (select 1 from public.characters ch where ch.id = p_character and ch.owner_id = auth.uid()) then
    raise exception 'personagem inválido';
  end if;
  insert into public.campaign_members (campaign_id, user_id, character_id) values (c.id, auth.uid(), p_character)
  on conflict on constraint campaign_members_pkey do update set character_id = coalesce(excluded.character_id, public.campaign_members.character_id);
  return query select c.id, c.name;
end $$;

-- lista "Minhas mesas": campanhas que mestro + campanhas em que jogo
create or replace function public.my_campaigns()
returns table(id uuid, name text, code text, role text, updated_at timestamptz)
language sql stable security definer set search_path to '' as $$
  select c.id, c.name, c.code, 'master'::text, c.updated_at from public.campaigns c where c.owner_id = auth.uid()
  union all
  select c.id, c.name, c.code, 'player'::text, c.updated_at from public.campaign_members m join public.campaigns c on c.id = m.campaign_id where m.user_id = auth.uid()
  order by 5 desc
$$;

-- ---------- GATILHOS ----------
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

drop trigger if exists campaigns_code on public.campaigns;
create trigger campaigns_code before insert on public.campaigns for each row execute function public.campaigns_set_code();

drop trigger if exists campaigns_touch on public.campaigns;
create trigger campaigns_touch before update on public.campaigns for each row execute function public.touch_updated_at();

drop trigger if exists characters_touch on public.characters;
create trigger characters_touch before update on public.characters for each row execute function public.touch_updated_at();

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- ---------- SEGURANÇA (RLS) ----------
alter table public.profiles         enable row level security;
alter table public.campaigns        enable row level security;
alter table public.campaign_assets  enable row level security;
alter table public.characters       enable row level security;
alter table public.campaign_members enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists campaigns_owner_all on public.campaigns;
create policy campaigns_owner_all on public.campaigns for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop policy if exists assets_owner_all on public.campaign_assets;
create policy assets_owner_all on public.campaign_assets for all to authenticated
  using      (exists (select 1 from public.campaigns c where c.id = campaign_assets.campaign_id and c.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.campaigns c where c.id = campaign_assets.campaign_id and c.owner_id = (select auth.uid())));

drop policy if exists characters_owner_all on public.characters;
create policy characters_owner_all on public.characters for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop policy if exists members_select on public.campaign_members;
create policy members_select on public.campaign_members for select to authenticated
  using (user_id = (select auth.uid()) or exists (select 1 from public.campaigns c where c.id = campaign_members.campaign_id and c.owner_id = (select auth.uid())));
drop policy if exists members_update_own on public.campaign_members;
create policy members_update_own on public.campaign_members for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists members_delete_own on public.campaign_members;
create policy members_delete_own on public.campaign_members for delete to authenticated using (user_id = (select auth.uid()));

-- ---------- PERMISSÕES ----------
-- O app só usa o papel "authenticated" (convidados anônimos também são authenticated).
revoke all on public.profiles, public.campaigns, public.campaign_assets, public.characters, public.campaign_members from anon;
-- concede explicitamente (alguns projetos novos não dão acesso automático às tabelas do schema public)
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles, public.campaigns, public.campaign_assets, public.characters, public.campaign_members to authenticated;

revoke all on function public.touch_updated_at()      from public, anon, authenticated;
revoke all on function public.gen_campaign_code()     from public, anon, authenticated;
revoke all on function public.campaigns_set_code()    from public, anon, authenticated;
revoke all on function public.handle_new_user()       from public, anon, authenticated;
revoke all on function public.join_campaign(text,uuid) from public, anon;
revoke all on function public.my_campaigns()          from public, anon;
grant execute on function public.join_campaign(text,uuid) to authenticated;
grant execute on function public.my_campaigns()           to authenticated;
