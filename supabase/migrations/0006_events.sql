-- ============================================================
-- SOFANA · Migración 0006 — Torneos (eventos por días)
-- ============================================================
-- Un "torneo" es un evento de varios días. Cada día es una
-- "jornada" con su propio plan: una cita, una película, una
-- llamada, un poema, una canción dedicada, un mensaje, etc.
--
-- · Las jornadas pueden ser en días seguidos, intermedios o
--   espaciados: cada una lleva su PROPIA fecha.
-- · Una jornada puede estar SELLADA (locked): es una sorpresa que
--   solo se revela el día que le toca. El contenido se oculta de
--   verdad del lado del servidor (ver lib/events.ts).
-- · Cada jornada tiene un nivel de importancia y un color de acento
--   para personalizar su tarjeta. Las jornadas "grand slam" lucen
--   un diseño exclusivo.
-- · RLS igual que el resto: solo los dos miembros del space.
-- ============================================================

create table public.events (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  start_date date not null,
  end_date date not null,
  accent text not null default 'court'
    check (accent in ('court', 'ball', 'clay', 'rosa', 'cielo', 'violeta')),
  emoji text,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  constraint event_dates check (end_date >= start_date)
);
create index events_space_idx on public.events (space_id, start_date desc);

create table public.event_days (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  space_id uuid not null references public.spaces (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  day_date date not null,
  category text not null default 'other'
    check (category in (
      'date', 'movie', 'call', 'game', 'poem', 'song',
      'message', 'surprise', 'other'
    )),
  title text not null,
  content text,
  at_time text,
  location text,
  song_url text,
  locked boolean not null default false,
  done boolean not null default false,
  accent text not null default 'court'
    check (accent in ('court', 'ball', 'clay', 'rosa', 'cielo', 'violeta')),
  importance text not null default 'normal'
    check (importance in ('normal', 'special', 'grand')),
  created_at timestamptz not null default now()
);
create index event_days_event_idx on public.event_days (event_id, day_date);
create index event_days_space_date_idx on public.event_days (space_id, day_date);

-- ---------- RLS ----------
alter table public.events enable row level security;

create policy "events: leer si eres del space"
  on public.events for select to authenticated
  using (public.is_space_member(space_id));
create policy "events: crear firmando como tú"
  on public.events for insert to authenticated
  with check (public.is_space_member(space_id) and created_by = auth.uid());
create policy "events: editar si eres del space"
  on public.events for update to authenticated
  using (public.is_space_member(space_id))
  with check (public.is_space_member(space_id));
create policy "events: borrar si eres del space"
  on public.events for delete to authenticated
  using (public.is_space_member(space_id));

alter table public.event_days enable row level security;

create policy "event_days: leer si eres del space"
  on public.event_days for select to authenticated
  using (public.is_space_member(space_id));
create policy "event_days: crear firmando como tú"
  on public.event_days for insert to authenticated
  with check (public.is_space_member(space_id) and author_id = auth.uid());
create policy "event_days: editar si eres del space"
  on public.event_days for update to authenticated
  using (public.is_space_member(space_id))
  with check (public.is_space_member(space_id));
create policy "event_days: borrar si eres del space"
  on public.event_days for delete to authenticated
  using (public.is_space_member(space_id));
