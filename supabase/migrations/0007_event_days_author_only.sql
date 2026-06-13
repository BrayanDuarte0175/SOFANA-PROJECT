-- ============================================================
-- SOFANA · Migración 0007 — Jornadas: editar/borrar solo el autor
-- ============================================================
-- Antes, cualquiera de los dos miembros podía editar o borrar
-- cualquier jornada del space. Ahora SOLO quien la creó puede
-- editarla, borrarla o marcarla como cumplida. Ambos siguen
-- pudiendo VERLAS (y crear las suyas).
-- ============================================================

drop policy if exists "event_days: editar si eres del space" on public.event_days;
drop policy if exists "event_days: borrar si eres del space" on public.event_days;

create policy "event_days: editar solo el autor"
  on public.event_days for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "event_days: borrar solo el autor"
  on public.event_days for delete to authenticated
  using (author_id = auth.uid());
