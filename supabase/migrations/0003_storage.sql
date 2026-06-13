-- ============================================================
-- SOFANA · Migración 0003 — Storage privado
-- ============================================================
-- QUÉ HACE ESTO, EN SIMPLE:
-- · Crea 3 buckets PRIVADOS (public = false): nada se sirve por
--   URL pública; todo acceso es vía signed URLs de corta duración
--   generadas en el servidor.
-- · Convención de rutas: <space_id>/<archivo> en memories/vault,
--   y <user_id>/<archivo> en avatars. Las políticas usan la
--   primera carpeta del path para decidir quién puede acceder.
-- · Límite de 50 MB por archivo y solo imágenes/videos.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('memories', 'memories', false, 52428800,
   array['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif','video/mp4','video/quicktime','video/webm']),
  ('vault', 'vault', false, 52428800,
   array['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif','video/mp4','video/quicktime','video/webm']),
  ('avatars', 'avatars', false, 5242880,
   array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- ---------- memories y vault ----------
-- "Solo los miembros del space (la primera carpeta del path) pueden
--  ver, subir o borrar archivos de ese space."
create policy "media: leer si eres del space"
  on storage.objects for select to authenticated
  using (
    bucket_id in ('memories', 'vault')
    and public.is_space_member(((storage.foldername(name))[1])::uuid)
  );

create policy "media: subir a tu space"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('memories', 'vault')
    and public.is_space_member(((storage.foldername(name))[1])::uuid)
  );

create policy "media: actualizar en tu space"
  on storage.objects for update to authenticated
  using (
    bucket_id in ('memories', 'vault')
    and public.is_space_member(((storage.foldername(name))[1])::uuid)
  );

create policy "media: borrar en tu space"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('memories', 'vault')
    and public.is_space_member(((storage.foldername(name))[1])::uuid)
  );

-- ---------- avatars ----------
-- "Tu avatar vive en una carpeta con tu user id: solo tú lo subes
--  o cambias; tu pareja puede verlo."
create policy "avatars: ver el propio y el de la pareja"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'avatars'
    and (
      ((storage.foldername(name))[1])::uuid = auth.uid()
      or exists (
        select 1 from public.spaces s
        where (s.member_a = auth.uid() or s.member_b = auth.uid())
          and (s.member_a = ((storage.foldername(name))[1])::uuid
               or s.member_b = ((storage.foldername(name))[1])::uuid)
      )
    )
  );

create policy "avatars: subir solo el propio"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1])::uuid = auth.uid()
  );

create policy "avatars: actualizar solo el propio"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1])::uuid = auth.uid()
  );

create policy "avatars: borrar solo el propio"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1])::uuid = auth.uid()
  );
