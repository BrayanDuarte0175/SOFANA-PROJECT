-- ============================================================
-- SOFANA · Migración 0001 — Esquema inicial
-- ============================================================
-- Crea las tablas base de la app. Toda la data pertenece a un
-- "space" (El Match) compartido por exactamente dos personas.
-- ============================================================

-- ---------- Tipos ----------
create type public.media_type as enum ('image', 'video');
create type public.promise_status as enum ('pending', 'kept', 'broken');
create type public.date_status as enum ('scheduled', 'done', 'cancelled');

-- ---------- profiles ----------
-- Espejo público de auth.users: nombre visible y avatar.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Crea el perfil automáticamente cuando se registra un usuario.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- spaces (El Match) ----------
-- Un único espacio compartido. member_b queda null hasta que la
-- segunda persona entra por primera vez y "reclama" su lugar.
create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'El Match',
  member_a uuid not null references public.profiles (id) on delete cascade,
  member_b uuid references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint members_distinct check (member_b is null or member_a <> member_b)
);

-- ---------- Función central de membresía ----------
-- Devuelve true si el usuario autenticado es miembro del space.
-- SECURITY DEFINER para poder usarse dentro de políticas RLS de
-- otras tablas sin chocar con el RLS de spaces.
create or replace function public.is_space_member(sid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.spaces s
    where s.id = sid
      and (s.member_a = auth.uid() or s.member_b = auth.uid())
  );
$$;

-- ---------- memories (Highlights) ----------
create table public.memories (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  event_date date,
  location text,
  created_at timestamptz not null default now()
);
create index memories_space_idx on public.memories (space_id, event_date desc);

create table public.memory_media (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories (id) on delete cascade,
  storage_path text not null,
  media_type public.media_type not null,
  created_at timestamptz not null default now()
);
create index memory_media_memory_idx on public.memory_media (memory_id);

-- ---------- questions (Rallies) ----------
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  answer text,
  answered_by uuid references public.profiles (id),
  answered_at timestamptz,
  created_at timestamptz not null default now()
);
create index questions_space_idx on public.questions (space_id, created_at desc);

-- ---------- promises (Match Points) ----------
create table public.promises (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  due_date date,
  status public.promise_status not null default 'pending',
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index promises_space_idx on public.promises (space_id, status, due_date);

-- ---------- dates (Próximos partidos / citas) ----------
create table public.dates (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  scheduled_at timestamptz not null,
  location text,
  notes text,
  status public.date_status not null default 'scheduled',
  created_at timestamptz not null default now()
);
create index dates_space_idx on public.dates (space_id, scheduled_at);

-- ---------- trips (El Tour) ----------
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  destination text not null,
  start_date date,
  end_date date,
  notes text,
  checklist jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index trips_space_idx on public.trips (space_id, start_date);

-- ---------- vault_media (El Vault) ----------
create table public.vault_media (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,
  media_type public.media_type not null,
  caption text,
  created_at timestamptz not null default now()
);
create index vault_media_space_idx on public.vault_media (space_id, created_at desc);

-- ---------- comments y reactions ----------
-- Sobre memories ('memory') y vault_media ('vault_media').
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('memory', 'vault_media')),
  target_id uuid not null,
  body text not null,
  created_at timestamptz not null default now()
);
create index comments_target_idx on public.comments (target_type, target_id, created_at);

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('memory', 'vault_media')),
  target_id uuid not null,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (author_id, target_type, target_id, emoji)
);
create index reactions_target_idx on public.reactions (target_type, target_id);
