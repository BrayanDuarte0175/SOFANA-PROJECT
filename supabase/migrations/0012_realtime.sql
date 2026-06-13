-- ============================================================
-- SOFANA · Migración 0012 — Realtime
-- ============================================================
-- Publica las tablas en `supabase_realtime` para que los cambios
-- lleguen al instante a la otra persona (la app se refresca sola).
-- El RLS sigue protegiendo: cada quien solo recibe lo de su space.
-- ============================================================

do $$
declare
  t text;
  tables text[] := array[
    'notifications', 'memories', 'memory_media', 'questions', 'promises',
    'dates', 'trips', 'vault_media', 'songs', 'events', 'event_days',
    'albums', 'comments', 'reactions'
  ];
begin
  foreach t in array tables loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
