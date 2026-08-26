-- Notas tipo conversación por actividad ("compremos 2 libras", etc.),
-- auto-asignarse una actividad sin responsable, y que quien propuso una
-- actividad pueda editarla/eliminarla incluso después de aprobada (antes
-- solo podía retirarla mientras seguía pendiente).

-- ---------------------------------------------------------------------------
-- sa_activity_notes
-- ---------------------------------------------------------------------------
create table if not exists public.sa_activity_notes (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.sa_activities (id) on delete cascade,
  person_id uuid not null references public.sa_people (id),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists sa_activity_notes_activity_id_idx on public.sa_activity_notes (activity_id);

alter table public.sa_activity_notes enable row level security;

drop policy if exists "sa_activity_notes_select_participant_or_admin" on public.sa_activity_notes;
create policy "sa_activity_notes_select_participant_or_admin" on public.sa_activity_notes
  for select using (
    exists (
      select 1 from public.sa_activities a
      where a.id = activity_id
        and (public.sa_is_plan_participant(a.plan_id) or public.sa_is_admin())
    )
  );

drop policy if exists "sa_activity_notes_insert_participant" on public.sa_activity_notes;
create policy "sa_activity_notes_insert_participant" on public.sa_activity_notes
  for insert with check (
    person_id = public.sa_current_person_id()
    and exists (
      select 1 from public.sa_activities a
      where a.id = activity_id
        and (public.sa_is_plan_participant(a.plan_id) or public.sa_is_admin())
    )
  );

drop policy if exists "sa_activity_notes_delete_own_or_admin" on public.sa_activity_notes;
create policy "sa_activity_notes_delete_own_or_admin" on public.sa_activity_notes
  for delete using (person_id = public.sa_current_person_id() or public.sa_is_admin());

-- ---------------------------------------------------------------------------
-- sa_activities: quien la propuso puede editarla/eliminarla siempre, no
-- solo mientras está pendiente.
-- ---------------------------------------------------------------------------
drop policy if exists "sa_activities_update_admin" on public.sa_activities;
drop policy if exists "sa_activities_update_admin_or_owner" on public.sa_activities;
create policy "sa_activities_update_admin_or_owner" on public.sa_activities
  for update
  using (public.sa_is_admin() or proposed_by = public.sa_current_person_id())
  with check (public.sa_is_admin() or proposed_by = public.sa_current_person_id());

drop policy if exists "sa_activities_delete_admin" on public.sa_activities;
drop policy if exists "sa_activities_delete_own_pending" on public.sa_activities;
drop policy if exists "sa_activities_delete_admin_or_owner" on public.sa_activities;
create policy "sa_activities_delete_admin_or_owner" on public.sa_activities
  for delete using (public.sa_is_admin() or proposed_by = public.sa_current_person_id());

-- ---------------------------------------------------------------------------
-- sa_claim_activity: cualquier participante del plan puede asignarse a sí
-- mismo una actividad sin responsable, o quitarse a sí mismo. No permite
-- quitarle la tarea a alguien más.
-- ---------------------------------------------------------------------------
create or replace function public.sa_claim_activity(target_activity_id uuid, assign boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_id uuid;
  v_person_id uuid;
begin
  v_person_id := public.sa_current_person_id();
  if v_person_id is null then
    raise exception 'No autorizado';
  end if;

  select plan_id into v_plan_id from public.sa_activities where id = target_activity_id;
  if v_plan_id is null then
    raise exception 'Actividad no encontrada';
  end if;

  if not exists (
    select 1 from public.sa_plan_participants
    where plan_id = v_plan_id and person_id = v_person_id
  ) then
    raise exception 'No participas en este plan';
  end if;

  if assign then
    update public.sa_activities
    set responsible_person_id = v_person_id
    where id = target_activity_id
      and (responsible_person_id is null or responsible_person_id = v_person_id);
  else
    update public.sa_activities
    set responsible_person_id = null
    where id = target_activity_id and responsible_person_id = v_person_id;
  end if;
end;
$$;

grant execute on function public.sa_claim_activity(uuid, boolean) to authenticated;
