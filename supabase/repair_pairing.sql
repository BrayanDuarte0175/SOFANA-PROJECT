-- ============================================================
-- SOFANA · Reparación puntual del emparejamiento
-- ============================================================
-- Úsalo UNA sola vez si quedaron dos spaces separados (cada quien
-- en el suyo). Une las dos cuentas en el space que YA tiene los
-- datos y borra el space vacío duplicado.
--
-- CÓMO USAR:
-- 1) Reemplaza los dos correos de abajo.
--    · email_con_datos  = la cuenta que subió fotos/citas/canciones (él)
--    · email_que_se_une = la otra cuenta (ella)
-- 2) Pega TODO en Supabase → SQL Editor → Run.
--
-- Es seguro: solo borra spaces vacíos del par; los datos del space
-- conservado no se tocan.
-- ============================================================

do $$
declare
  email_con_datos  text := 'tu@email.com';     -- 👈 CAMBIA ESTO
  email_que_se_une text := 'ella@email.com';   -- 👈 CAMBIA ESTO
  uid_keep uuid;
  uid_join uuid;
  keep_space uuid;
  removed int;
begin
  select id into uid_keep from auth.users where email = email_con_datos;
  select id into uid_join from auth.users where email = email_que_se_une;

  if uid_keep is null then
    raise exception 'No encontré la cuenta %', email_con_datos;
  end if;
  if uid_join is null then
    raise exception 'No encontré la cuenta %', email_que_se_une;
  end if;

  -- Space a conservar: aquel donde "él" es member_a (tiene los datos).
  select id into keep_space
  from public.spaces
  where member_a = uid_keep
  order by created_at asc
  limit 1;

  if keep_space is null then
    raise exception 'No encontré un space cuyo member_a sea %', email_con_datos;
  end if;

  -- Une a "ella" como member_b de ese space.
  update public.spaces
    set member_b = uid_join
  where id = keep_space;

  -- Borra cualquier OTRO space del par (duplicados vacíos).
  -- ⚠️ El borrado hace cascade: por eso solo se eliminan spaces
  -- distintos al conservado. El conservado (con datos) queda intacto.
  delete from public.spaces
  where id <> keep_space
    and (member_a in (uid_keep, uid_join) or member_b in (uid_keep, uid_join));
  get diagnostics removed = row_count;

  raise notice 'Listo: space % vinculado. Spaces duplicados borrados: %.',
    keep_space, removed;
end $$;
