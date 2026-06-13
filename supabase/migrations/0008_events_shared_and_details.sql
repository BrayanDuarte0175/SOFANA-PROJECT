-- ============================================================
-- SOFANA · Migración 0008 — Torneos compartidos + detalles por jornada
-- ============================================================
-- 1) is_shared en events: un torneo "compartido" deja que AMBOS
--    agreguen, editen y borren jornadas sin restricción. Un torneo
--    normal solo permite al creador agregar jornadas, y a cada autor
--    editar/borrar las suyas.
-- 2) details jsonb en event_days: datos estructurados según la
--    categoría (p. ej. lista de películas con su género).
-- ============================================================

alter table public.events
  add column if not exists is_shared boolean not null default false;

alter table public.event_days
  add column if not exists details jsonb not null default '{}'::jsonb;

-- ---------- RLS de event_days según is_shared ----------

-- INSERT: el creador del torneo siempre; los demás solo si es compartido.
drop policy if exists "event_days: crear firmando como tú" on public.event_days;
drop policy if exists "event_days: crear (creador o compartido)" on public.event_days;
create policy "event_days: crear (creador o compartido)"
  on public.event_days for insert to authenticated
  with check (
    public.is_space_member(space_id)
    and author_id = auth.uid()
    and exists (
      select 1 from public.events e
      where e.id = event_id
        and e.space_id = event_days.space_id
        and (e.is_shared or e.created_by = auth.uid())
    )
  );

-- UPDATE: el autor de la jornada, o cualquiera si el torneo es compartido.
drop policy if exists "event_days: editar solo el autor" on public.event_days;
drop policy if exists "event_days: editar (autor o compartido)" on public.event_days;
create policy "event_days: editar (autor o compartido)"
  on public.event_days for update to authenticated
  using (
    public.is_space_member(space_id) and (
      author_id = auth.uid()
      or exists (
        select 1 from public.events e
        where e.id = event_id and e.is_shared
      )
    )
  )
  with check (
    public.is_space_member(space_id) and (
      author_id = auth.uid()
      or exists (
        select 1 from public.events e
        where e.id = event_id and e.is_shared
      )
    )
  );

-- DELETE: misma regla que UPDATE.
drop policy if exists "event_days: borrar solo el autor" on public.event_days;
drop policy if exists "event_days: borrar (autor o compartido)" on public.event_days;
create policy "event_days: borrar (autor o compartido)"
  on public.event_days for delete to authenticated
  using (
    public.is_space_member(space_id) and (
      author_id = auth.uid()
      or exists (
        select 1 from public.events e
        where e.id = event_id and e.is_shared
      )
    )
  );
