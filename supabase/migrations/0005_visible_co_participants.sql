-- Bug: la política de sa_people solo dejaba ver la propia fila (o al
-- admin ver todas). Eso significa que un participante normal no podía
-- leer el full_name de sus compañeros de plan al abrir /planes/[id] — el
-- embed `person:sa_people(...)` le llegaba nulo y la página truena con
-- un error de "no se puede leer full_name de null". Se agrega una
-- política adicional: cualquiera puede ver la fila de alguien con quien
-- comparte al menos un plan.

create or replace function public.sa_shares_plan_with(target_person_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.sa_plan_participants me
    join public.sa_plan_participants them on them.plan_id = me.plan_id
    where me.person_id = public.sa_current_person_id()
      and them.person_id = target_person_id
  );
$$;

create policy "sa_people_select_co_participant" on public.sa_people
  for select using (public.sa_shares_plan_with(id));
