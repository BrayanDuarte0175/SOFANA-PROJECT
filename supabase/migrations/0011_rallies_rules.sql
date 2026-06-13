-- ============================================================
-- SOFANA · Migración 0011 — Reglas de Rallies
-- ============================================================
-- · answer_edit_count: cuántas veces se editó la respuesta (máx 3,
--   se controla en el servidor).
-- · Borrar un rally: solo quien lo creó (el que sacó la pregunta).
-- ============================================================

alter table public.questions
  add column if not exists answer_edit_count int not null default 0;

drop policy if exists "questions: borrar si eres del space" on public.questions;
create policy "questions: borrar solo el autor"
  on public.questions for delete to authenticated
  using (author_id = auth.uid());
