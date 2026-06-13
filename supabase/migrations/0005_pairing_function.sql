-- ============================================================
-- SOFANA · Migración 0005 — Emparejamiento confiable
-- ============================================================
-- POR QUÉ:
-- El emparejamiento "a ciegas" desde el cliente (UPDATE bajo RLS)
-- era frágil: si el reclamo no encajaba con las políticas, la
-- segunda persona terminaba creando un space propio en vez de
-- unirse al de su pareja.
--
-- QUÉ HACE ESTA FUNCIÓN:
-- Resuelve el space del usuario de forma ATÓMICA y a prueba de
-- carreras. Corre como SECURITY DEFINER (omite RLS para esta lógica
-- puntual) y:
--   1. Si ya soy miembro de un space, lo devuelve.
--   2. Si existe un space con lugar libre (de la otra persona),
--      me une como member_b y lo devuelve.
--   3. Si no hay ninguno, crea uno conmigo como member_a.
-- El bloqueo de transacción evita que dos primeros logins
-- simultáneos creen spaces duplicados.
-- ============================================================

create or replace function public.join_or_create_space()
returns public.spaces
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  result public.spaces;
begin
  if uid is null then
    raise exception 'No autenticado';
  end if;

  -- Serializa el emparejamiento (mismo lock para todos los usuarios).
  perform pg_advisory_xact_lock(hashtext('sofana_space_pairing'));

  -- 1) ¿Ya soy miembro de un space?
  select * into result
  from public.spaces
  where member_a = uid or member_b = uid
  limit 1;
  if found then
    return result;
  end if;

  -- 2) ¿Hay un space con lugar libre de la otra persona? Únete.
  update public.spaces
    set member_b = uid
  where member_b is null and member_a <> uid
  returning * into result;
  if found then
    return result;
  end if;

  -- 3) Si no, crea uno nuevo conmigo como member_a.
  insert into public.spaces (member_a)
  values (uid)
  returning * into result;

  return result;
end;
$$;

grant execute on function public.join_or_create_space() to authenticated;
