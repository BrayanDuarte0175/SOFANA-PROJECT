-- ============================================================
-- SOFANA · Migración 0004 — La Playlist (música)
-- ============================================================
-- QUÉ HACE ESTO, EN SIMPLE:
-- · Tabla `songs`: cada canción pertenece a un space. Puede ser
--   un ENLACE (Spotify / YouTube / YouTube Music) que se reproduce
--   embebido en la app, o un ARCHIVO de audio subido a un bucket
--   privado.
-- · RLS igual que el resto: solo los dos miembros del space leen y
--   administran sus canciones.
-- · Bucket PRIVADO `music` con las mismas reglas que memories/vault:
--   acceso solo a archivos dentro de la carpeta del propio space,
--   servidos por signed URLs de corta duración.
-- ============================================================

-- ---------- songs ----------
create table public.songs (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  added_by uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  artist text,
  -- 'spotify' | 'youtube' | 'upload'
  source text not null check (source in ('spotify', 'youtube', 'upload')),
  -- spotify: track/album/playlist/episode/show ; youtube: video/playlist
  embed_kind text,
  -- id para el reproductor embebido (enlaces)
  external_id text,
  -- enlace original para "abrir en la app externa"
  external_url text,
  -- ruta en el bucket `music` (solo para archivos subidos)
  storage_path text,
  note text,
  created_at timestamptz not null default now(),
  -- Coherencia de datos: los enlaces necesitan external_id; los
  -- archivos subidos necesitan storage_path.
  constraint song_payload check (
    (source = 'upload' and storage_path is not null)
    or (source in ('spotify', 'youtube') and external_id is not null)
  )
);
create index songs_space_idx on public.songs (space_id, created_at desc);

-- ---------- RLS de songs ----------
alter table public.songs enable row level security;

create policy "songs: leer si eres del space"
  on public.songs for select to authenticated
  using (public.is_space_member(space_id));

create policy "songs: crear firmando como tú"
  on public.songs for insert to authenticated
  with check (public.is_space_member(space_id) and added_by = auth.uid());

create policy "songs: editar si eres del space"
  on public.songs for update to authenticated
  using (public.is_space_member(space_id))
  with check (public.is_space_member(space_id));

create policy "songs: borrar si eres del space"
  on public.songs for delete to authenticated
  using (public.is_space_member(space_id));

-- ---------- Bucket privado `music` ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'music', 'music', false, 104857600,
  array[
    'audio/mpeg','audio/mp3','audio/mp4','audio/aac','audio/ogg',
    'audio/opus','audio/wav','audio/x-wav','audio/flac','audio/x-flac',
    'audio/x-m4a','audio/m4a','audio/webm','audio/3gpp'
  ]
)
on conflict (id) do nothing;

-- "Solo los miembros del space (primera carpeta del path) pueden
--  ver, subir, actualizar o borrar audios de ese space."
create policy "music: leer si eres del space"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'music'
    and public.is_space_member(((storage.foldername(name))[1])::uuid)
  );

create policy "music: subir a tu space"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'music'
    and public.is_space_member(((storage.foldername(name))[1])::uuid)
  );

create policy "music: actualizar en tu space"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'music'
    and public.is_space_member(((storage.foldername(name))[1])::uuid)
  );

create policy "music: borrar en tu space"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'music'
    and public.is_space_member(((storage.foldername(name))[1])::uuid)
  );
