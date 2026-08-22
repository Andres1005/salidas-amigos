-- Código para unirse a un plan sin que el admin agregue participantes a
-- mano, y flujo de propuesta/aprobación de actividades.

-- ---------------------------------------------------------------------------
-- sa_plans.join_code: código corto que cualquier persona con cuenta activa
-- puede canjear para sumarse como participante del plan.
-- ---------------------------------------------------------------------------
alter table public.sa_plans add column if not exists join_code text;

do $$
declare
  r record;
  new_code text;
begin
  for r in select id from public.sa_plans where join_code is null loop
    loop
      new_code := upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 7));
      exit when not exists (select 1 from public.sa_plans where join_code = new_code);
    end loop;
    update public.sa_plans set join_code = new_code where id = r.id;
  end loop;
end $$;

alter table public.sa_plans alter column join_code set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'sa_plans_join_code_key'
  ) then
    alter table public.sa_plans add constraint sa_plans_join_code_key unique (join_code);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- sa_join_plan_by_code: cualquier persona autenticada puede canjear el
-- código de un plan y quedar agregada como participante (peso 1). Corre con
-- privilegios del dueño de la función para no depender de una política de
-- RLS que exponga a quién se puede insertar en sa_plan_participants.
-- ---------------------------------------------------------------------------
create or replace function public.sa_join_plan_by_code(code text)
returns uuid
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

  select id into v_plan_id
  from public.sa_plans
  where join_code = upper(trim(code)) and status = 'abierto';

  if v_plan_id is null then
    raise exception 'Código de plan inválido';
  end if;

  insert into public.sa_plan_participants (plan_id, person_id, share_weight)
  values (v_plan_id, v_person_id, 1)
  on conflict (plan_id, person_id) do nothing;

  return v_plan_id;
end;
$$;

grant execute on function public.sa_join_plan_by_code(text) to authenticated;

-- ---------------------------------------------------------------------------
-- sa_activities: propuesta y aprobación. Cualquier participante puede
-- proponer una actividad (queda 'pendiente'); solo el admin aprueba o
-- elimina; quien la propuso puede retirarla mientras siga pendiente.
-- ---------------------------------------------------------------------------
alter table public.sa_activities
  add column if not exists status text not null default 'aprobada' check (status in ('pendiente', 'aprobada')),
  add column if not exists proposed_by uuid references public.sa_people (id);

drop policy if exists "sa_activities_admin_write" on public.sa_activities;

create policy "sa_activities_insert_participant" on public.sa_activities
  for insert with check (
    (public.sa_is_plan_participant(plan_id) and proposed_by = public.sa_current_person_id())
    or public.sa_is_admin()
  );

create policy "sa_activities_update_admin" on public.sa_activities
  for update using (public.sa_is_admin()) with check (public.sa_is_admin());

create policy "sa_activities_delete_admin" on public.sa_activities
  for delete using (public.sa_is_admin());

create policy "sa_activities_delete_own_pending" on public.sa_activities
  for delete using (proposed_by = public.sa_current_person_id() and status = 'pendiente');
