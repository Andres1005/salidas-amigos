-- Refina el flujo de responsables de actividades:
--   1. Una vez alguien queda asignado a una actividad, solo el admin puede
--      cambiar o quitar esa asignación (ya no hay auto-des-asignación).
--   2. La actividad queda "gestionada" (editar nombre/observaciones/fecha/
--      presupuesto) solo por su responsable (o por quien la propuso mientras
--      sigue sin responsable), además del admin.
--   3. Se agrega un valor de "gasto real" por actividad que solo se puede
--      registrar una vez; después de eso solo el admin lo puede modificar.
--   4. Se agrega la posibilidad de marcar una actividad como "sin costo".

alter table public.sa_activities
  add column if not exists no_budget boolean not null default false;

alter table public.sa_activities
  add column if not exists actual_cost_cop numeric null;

-- ---------------------------------------------------------------------------
-- UPDATE / DELETE: admin, o el responsable actual, o (si aún no tiene
-- responsable) quien la propuso.
-- ---------------------------------------------------------------------------
drop policy if exists "sa_activities_update_admin" on public.sa_activities;
drop policy if exists "sa_activities_update_admin_or_owner" on public.sa_activities;
create policy "sa_activities_update_admin_or_owner" on public.sa_activities
  for update
  using (
    public.sa_is_admin()
    or responsible_person_id = public.sa_current_person_id()
    or (responsible_person_id is null and proposed_by = public.sa_current_person_id())
  )
  with check (
    public.sa_is_admin()
    or responsible_person_id = public.sa_current_person_id()
    or (responsible_person_id is null and proposed_by = public.sa_current_person_id())
  );

drop policy if exists "sa_activities_delete_admin" on public.sa_activities;
drop policy if exists "sa_activities_delete_own_pending" on public.sa_activities;
drop policy if exists "sa_activities_delete_admin_or_owner" on public.sa_activities;
create policy "sa_activities_delete_admin_or_owner" on public.sa_activities
  for delete using (
    public.sa_is_admin()
    or responsible_person_id = public.sa_current_person_id()
    or (responsible_person_id is null and proposed_by = public.sa_current_person_id())
  );

-- ---------------------------------------------------------------------------
-- sa_claim_activity: se reemplaza para exigir un presupuesto aproximado (o
-- marcar la actividad como "sin costo") al momento de auto-asignarse, y para
-- que solo el admin pueda des-asignar.
-- ---------------------------------------------------------------------------
drop function if exists public.sa_claim_activity(uuid, boolean);

create or replace function public.sa_claim_activity(
  target_activity_id uuid,
  assign boolean,
  p_estimated_cost_cop numeric default null,
  mark_no_budget boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_id uuid;
  v_person_id uuid;
  v_current_responsible uuid;
  v_current_estimated numeric;
  v_current_no_budget boolean;
begin
  v_person_id := public.sa_current_person_id();
  if v_person_id is null then
    raise exception 'No autorizado';
  end if;

  select plan_id, responsible_person_id, estimated_cost_cop, no_budget
    into v_plan_id, v_current_responsible, v_current_estimated, v_current_no_budget
    from public.sa_activities where id = target_activity_id;

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
    if v_current_responsible is not null and not public.sa_is_admin() then
      raise exception 'Esta actividad ya tiene responsable';
    end if;

    if not v_current_no_budget and not mark_no_budget
       and v_current_estimated is null and p_estimated_cost_cop is null then
      raise exception 'Indica un presupuesto aproximado o marca la actividad como sin costo';
    end if;

    update public.sa_activities
    set responsible_person_id = v_person_id,
        no_budget = case when mark_no_budget then true else no_budget end,
        estimated_cost_cop = coalesce(p_estimated_cost_cop, estimated_cost_cop)
    where id = target_activity_id;
  else
    -- Des-asignar ya solo lo puede hacer el admin; el responsable ya no
    -- puede auto-liberarse la tarea.
    if not public.sa_is_admin() then
      raise exception 'Solo el administrador puede cambiar la asignación';
    end if;

    update public.sa_activities
    set responsible_person_id = null
    where id = target_activity_id;
  end if;
end;
$$;

grant execute on function public.sa_claim_activity(uuid, boolean, numeric, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- sa_set_activity_actual_cost: el responsable puede registrar el gasto real
-- de su actividad una sola vez; después solo el admin lo puede modificar.
-- ---------------------------------------------------------------------------
create or replace function public.sa_set_activity_actual_cost(target_activity_id uuid, amount numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_person_id uuid;
  v_responsible uuid;
  v_current_actual numeric;
begin
  v_person_id := public.sa_current_person_id();
  if v_person_id is null then
    raise exception 'No autorizado';
  end if;

  select responsible_person_id, actual_cost_cop
    into v_responsible, v_current_actual
    from public.sa_activities where id = target_activity_id;

  if v_responsible is null then
    raise exception 'Esta actividad no tiene responsable asignado';
  end if;

  if not (public.sa_is_admin() or (v_responsible = v_person_id and v_current_actual is null)) then
    raise exception 'Solo el administrador puede modificar este valor';
  end if;

  update public.sa_activities set actual_cost_cop = amount where id = target_activity_id;
end;
$$;

grant execute on function public.sa_set_activity_actual_cost(uuid, numeric) to authenticated;
