-- ============================================================
-- SOFANA · Migración 0009 — Álbumes de Highlights
-- ============================================================
-- · albums: agrupaciones de recuerdos (highlights).
-- · memories.album_id: un highlight puede pertenecer a un álbum.
-- · trips.album_id: un viaje (El Tour) puede enlazarse a un álbum,
--   de modo que sus fotos quedan asociadas a ese viaje.
-- · RLS: solo los dos miembros del space, como el resto.
-- ============================================================

create table public.albums (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);
create index albums_space_idx on public.albums (space_id, created_at desc);

alter table public.albums enable row level security;

create policy "albums: leer si eres del space"
  on public.albums for select to authenticated
  using (public.is_space_member(space_id));
create policy "albums: crear firmando como tú"
  on public.albums for insert to authenticated
  with check (public.is_space_member(space_id) and created_by = auth.uid());
create policy "albums: editar si eres del space"
  on public.albums for update to authenticated
  using (public.is_space_member(space_id))
  with check (public.is_space_member(space_id));
create policy "albums: borrar si eres del space"
  on public.albums for delete to authenticated
  using (public.is_space_member(space_id));

-- Enlaces opcionales. on delete set null: borrar el álbum NO borra
-- los highlights ni los viajes, solo los desvincula.
alter table public.memories
  add column if not exists album_id uuid references public.albums (id) on delete set null;
create index if not exists memories_album_idx on public.memories (album_id);

alter table public.trips
  add column if not exists album_id uuid references public.albums (id) on delete set null;
create index if not exists trips_album_idx on public.trips (album_id);
