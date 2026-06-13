-- ============================================================
-- SOFANA · Migración 0002 — Row Level Security
-- ============================================================
-- QUÉ HACE ESTO, EN SIMPLE:
-- · Se activa RLS en TODAS las tablas: sin una política que lo
--   permita explícitamente, nadie puede leer ni escribir nada.
-- · La regla universal es is_space_member(space_id): solo los dos
--   miembros del space ven y tocan las filas de su space.
-- · El control es simétrico: ambos pueden crear, editar y borrar
--   todo (no hay "dueño" con más poder).
-- ============================================================

-- ---------- profiles ----------
alter table public.profiles enable row level security;

-- "Puedes ver tu propio perfil y el de tu pareja (si comparten space)."
create policy "profiles: ver el propio y el de la pareja"
  on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from public.spaces s
      where (s.member_a = auth.uid() or s.member_b = auth.uid())
        and (s.member_a = profiles.id or s.member_b = profiles.id)
    )
  );

-- "Solo puedes editar TU propio perfil (nombre, avatar)."
create policy "profiles: editar solo el propio"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------- spaces ----------
alter table public.spaces enable row level security;

-- "Solo los miembros ven su space."
create policy "spaces: ver solo si eres miembro"
  on public.spaces for select to authenticated
  using (member_a = auth.uid() or member_b = auth.uid());

-- "Puedes crear un space solo si tú eres member_a y aún no hay pareja."
create policy "spaces: crear como member_a"
  on public.spaces for insert to authenticated
  with check (member_a = auth.uid() and member_b is null);

-- "La segunda persona puede 'reclamar' el lugar libre (member_b null),
--  quedando ella misma como member_b. Un trigger (abajo) garantiza que
--  no se pueda tocar nada más en esa operación."
create policy "spaces: reclamar lugar libre como member_b"
  on public.spaces for update to authenticated
  using (member_b is null)
  with check (member_b = auth.uid());

-- "Los miembros pueden editar su space (p. ej. el nombre). El trigger
--  de abajo impide tocar los miembros en esta vía."
create policy "spaces: editar si eres miembro"
  on public.spaces for update to authenticated
  using (member_a = auth.uid() or member_b = auth.uid())
  with check (member_a = auth.uid() or member_b = auth.uid());

-- Trigger de refuerzo: al reclamar, solo puede cambiar member_b
-- (de null a auth.uid()); member_a, name e id quedan intactos.
create or replace function public.guard_space_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.member_a is distinct from new.member_a
     or old.id is distinct from new.id
     or old.created_at is distinct from new.created_at then
    raise exception 'Solo se puede reclamar el lugar de member_b';
  end if;
  if old.member_b is distinct from new.member_b then
    if old.member_b is not null or new.member_b <> auth.uid() then
      raise exception 'member_b solo puede pasar de null a tu propio usuario';
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_space_update
  before update on public.spaces
  for each row execute function public.guard_space_update();

-- ---------- Macro de políticas por tabla de contenido ----------
-- Para cada tabla: leer/crear/editar/borrar SOLO si eres miembro
-- del space de la fila. Al crear, además, debes firmar como tú
-- (author_id / created_by / owner_id = tu usuario).

-- memories — "Highlights: solo la pareja los ve y administra."
alter table public.memories enable row level security;
create policy "memories: leer si eres del space"
  on public.memories for select to authenticated
  using (public.is_space_member(space_id));
create policy "memories: crear firmando como tú"
  on public.memories for insert to authenticated
  with check (public.is_space_member(space_id) and author_id = auth.uid());
create policy "memories: editar si eres del space"
  on public.memories for update to authenticated
  using (public.is_space_member(space_id))
  with check (public.is_space_member(space_id));
create policy "memories: borrar si eres del space"
  on public.memories for delete to authenticated
  using (public.is_space_member(space_id));

-- memory_media — hereda la pertenencia a través de su memory.
alter table public.memory_media enable row level security;
create policy "memory_media: leer si el memory es de tu space"
  on public.memory_media for select to authenticated
  using (exists (select 1 from public.memories m
                 where m.id = memory_id and public.is_space_member(m.space_id)));
create policy "memory_media: crear si el memory es de tu space"
  on public.memory_media for insert to authenticated
  with check (exists (select 1 from public.memories m
                      where m.id = memory_id and public.is_space_member(m.space_id)));
create policy "memory_media: borrar si el memory es de tu space"
  on public.memory_media for delete to authenticated
  using (exists (select 1 from public.memories m
                 where m.id = memory_id and public.is_space_member(m.space_id)));

-- questions — "Rallies: ambos leen; cualquiera pregunta y cualquiera edita/borra."
alter table public.questions enable row level security;
create policy "questions: leer si eres del space"
  on public.questions for select to authenticated
  using (public.is_space_member(space_id));
create policy "questions: crear firmando como tú"
  on public.questions for insert to authenticated
  with check (public.is_space_member(space_id) and author_id = auth.uid());
create policy "questions: editar si eres del space"
  on public.questions for update to authenticated
  using (public.is_space_member(space_id))
  with check (public.is_space_member(space_id));
create policy "questions: borrar si eres del space"
  on public.questions for delete to authenticated
  using (public.is_space_member(space_id));

-- promises — "Match Points."
alter table public.promises enable row level security;
create policy "promises: leer si eres del space"
  on public.promises for select to authenticated
  using (public.is_space_member(space_id));
create policy "promises: crear firmando como tú"
  on public.promises for insert to authenticated
  with check (public.is_space_member(space_id) and author_id = auth.uid());
create policy "promises: editar si eres del space"
  on public.promises for update to authenticated
  using (public.is_space_member(space_id))
  with check (public.is_space_member(space_id));
create policy "promises: borrar si eres del space"
  on public.promises for delete to authenticated
  using (public.is_space_member(space_id));

-- dates — "Citas."
alter table public.dates enable row level security;
create policy "dates: leer si eres del space"
  on public.dates for select to authenticated
  using (public.is_space_member(space_id));
create policy "dates: crear firmando como tú"
  on public.dates for insert to authenticated
  with check (public.is_space_member(space_id) and created_by = auth.uid());
create policy "dates: editar si eres del space"
  on public.dates for update to authenticated
  using (public.is_space_member(space_id))
  with check (public.is_space_member(space_id));
create policy "dates: borrar si eres del space"
  on public.dates for delete to authenticated
  using (public.is_space_member(space_id));

-- trips — "El Tour."
alter table public.trips enable row level security;
create policy "trips: leer si eres del space"
  on public.trips for select to authenticated
  using (public.is_space_member(space_id));
create policy "trips: crear firmando como tú"
  on public.trips for insert to authenticated
  with check (public.is_space_member(space_id) and created_by = auth.uid());
create policy "trips: editar si eres del space"
  on public.trips for update to authenticated
  using (public.is_space_member(space_id))
  with check (public.is_space_member(space_id));
create policy "trips: borrar si eres del space"
  on public.trips for delete to authenticated
  using (public.is_space_member(space_id));

-- vault_media — "El Vault: lo más sensible; misma regla estricta."
alter table public.vault_media enable row level security;
create policy "vault_media: leer si eres del space"
  on public.vault_media for select to authenticated
  using (public.is_space_member(space_id));
create policy "vault_media: crear firmando como tú"
  on public.vault_media for insert to authenticated
  with check (public.is_space_member(space_id) and owner_id = auth.uid());
create policy "vault_media: editar si eres del space"
  on public.vault_media for update to authenticated
  using (public.is_space_member(space_id))
  with check (public.is_space_member(space_id));
create policy "vault_media: borrar si eres del space"
  on public.vault_media for delete to authenticated
  using (public.is_space_member(space_id));

-- comments
alter table public.comments enable row level security;
create policy "comments: leer si eres del space"
  on public.comments for select to authenticated
  using (public.is_space_member(space_id));
create policy "comments: crear firmando como tú"
  on public.comments for insert to authenticated
  with check (public.is_space_member(space_id) and author_id = auth.uid());
create policy "comments: borrar si eres del space"
  on public.comments for delete to authenticated
  using (public.is_space_member(space_id));

-- reactions
alter table public.reactions enable row level security;
create policy "reactions: leer si eres del space"
  on public.reactions for select to authenticated
  using (public.is_space_member(space_id));
create policy "reactions: crear firmando como tú"
  on public.reactions for insert to authenticated
  with check (public.is_space_member(space_id) and author_id = auth.uid());
create policy "reactions: borrar solo las tuyas"
  on public.reactions for delete to authenticated
  using (public.is_space_member(space_id) and author_id = auth.uid());
