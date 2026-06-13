-- ============================================================
-- SOFANA · Migración 0010 — Notificaciones
-- ============================================================
-- Avisos dentro de la app: cuando uno agrega/sube algo, la pareja
-- recibe una notificación (campanita en el header), en tiempo real.
-- ============================================================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  type text not null,
  title text not null,
  body text,
  href text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_recipient_idx
  on public.notifications (recipient_id, read, created_at desc);

alter table public.notifications enable row level security;

-- Cada quien ve, marca y borra SOLO sus notificaciones.
create policy "notifications: leer las mías"
  on public.notifications for select to authenticated
  using (recipient_id = auth.uid());

-- Se crean firmando como actor, dentro del space.
create policy "notifications: crear si eres del space"
  on public.notifications for insert to authenticated
  with check (public.is_space_member(space_id) and actor_id = auth.uid());

create policy "notifications: marcar las mías"
  on public.notifications for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

create policy "notifications: borrar las mías"
  on public.notifications for delete to authenticated
  using (recipient_id = auth.uid());
