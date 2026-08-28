-- Cuando quien crea (o el admin) le asigna una actividad a otra persona,
-- eso ahora queda como una invitación pendiente: la persona invitada debe
-- aceptar para quedar como responsable, o puede rechazarla y la actividad
-- vuelve a quedar sin responsable. Auto-asignarse (el flujo existente de
-- "Asignarme") sigue siendo inmediato, porque ahí la propia persona ya está
-- de acuerdo.

alter table public.sa_activities
  add column if not exists invited_person_id uuid null references public.sa_people (id);

-- ---------------------------------------------------------------------------
-- sa_respond_activity_invite: solo la persona invitada puede aceptar o
-- rechazar su propia invitación.
-- ---------------------------------------------------------------------------
create or replace function public.sa_respond_activity_invite(target_activity_id uuid, accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_person_id uuid;
  v_invited uuid;
begin
  v_person_id := public.sa_current_person_id();
  if v_person_id is null then
    raise exception 'No autorizado';
  end if;

  select invited_person_id into v_invited from public.sa_activities where id = target_activity_id;

  if v_invited is null or v_invited != v_person_id then
    raise exception 'No tienes una invitación pendiente para esta actividad';
  end if;

  if accept then
    update public.sa_activities
    set responsible_person_id = v_person_id, invited_person_id = null
    where id = target_activity_id;
  else
    update public.sa_activities
    set invited_person_id = null
    where id = target_activity_id;
  end if;
end;
$$;

grant execute on function public.sa_respond_activity_invite(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- sa_claim_activity: no dejar auto-asignarse una actividad que tiene una
-- invitación pendiente para otra persona.
-- ---------------------------------------------------------------------------
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
  v_current_invited uuid;
  v_current_estimated numeric;
  v_current_no_budget boolean;
begin
  v_person_id := public.sa_current_person_id();
  if v_person_id is null then
    raise exception 'No autorizado';
  end if;

  select plan_id, responsible_person_id, invited_person_id, estimated_cost_cop, no_budget
    into v_plan_id, v_current_responsible, v_current_invited, v_current_estimated, v_current_no_budget
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

    if v_current_invited is not null and v_current_invited != v_person_id and not public.sa_is_admin() then
      raise exception 'Esta actividad tiene una invitación pendiente';
    end if;

    if not v_current_no_budget and not mark_no_budget
       and v_current_estimated is null and p_estimated_cost_cop is null then
      raise exception 'Indica un presupuesto aproximado o marca la actividad como sin costo';
    end if;

    update public.sa_activities
    set responsible_person_id = v_person_id,
        invited_person_id = null,
        no_budget = case when mark_no_budget then true else no_budget end,
        estimated_cost_cop = coalesce(p_estimated_cost_cop, estimated_cost_cop)
    where id = target_activity_id;
  else
    if not public.sa_is_admin() then
      raise exception 'Solo el administrador puede cambiar la asignación';
    end if;

    update public.sa_activities
    set responsible_person_id = null
    where id = target_activity_id;
  end if;
end;
$$;
