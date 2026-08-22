-- Salidas Amigos — esquema inicial
-- Personas, planes, participantes, actividades, gastos y liquidaciones.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- people: el roster cerrado de amigos administrado por el/la admin.
-- Solo quien tiene una fila aquí (con invite_code válido) puede crear cuenta.
-- ---------------------------------------------------------------------------
create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  role text not null default 'member' check (role in ('admin', 'member')),
  invite_code text not null unique,
  invite_status text not null default 'pendiente' check (invite_status in ('pendiente', 'canjeada')),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- plans: cada salida/viaje/plan.
-- ---------------------------------------------------------------------------
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  destination text,
  cover_emoji text not null default '🏖️',
  start_date date,
  end_date date,
  status text not null default 'abierto' check (status in ('abierto', 'cerrado')),
  split_mode text not null default 'equitativo' check (split_mode in ('equitativo', 'personalizado')),
  created_by uuid not null references public.people (id),
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- plan_participants: quién participa en cada plan y con qué peso se le
-- divide el gasto (share_weight = 0 para invitados/homenajeados que no pagan).
-- ---------------------------------------------------------------------------
create table if not exists public.plan_participants (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  person_id uuid not null references public.people (id) on delete cascade,
  share_weight numeric(6, 2) not null default 1 check (share_weight >= 0),
  role_label text,
  created_at timestamptz not null default now(),
  unique (plan_id, person_id)
);

-- ---------------------------------------------------------------------------
-- activities: itinerario del plan, cada una con un responsable.
-- ---------------------------------------------------------------------------
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  name text not null,
  description text,
  activity_date date,
  responsible_person_id uuid references public.people (id),
  estimated_cost_cop numeric(12, 2),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- expenses: gastos reales, siempre en pesos colombianos.
-- ---------------------------------------------------------------------------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  activity_id uuid references public.activities (id) on delete set null,
  description text not null,
  category text not null default 'otros' check (
    category in ('alojamiento', 'transporte', 'comida', 'actividades', 'entradas', 'compras', 'otros')
  ),
  amount_cop numeric(12, 2) not null check (amount_cop > 0),
  paid_by_person_id uuid not null references public.people (id),
  created_by uuid not null references public.people (id),
  expense_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- settlements: liquidación final calculada al cerrar el plan.
-- ---------------------------------------------------------------------------
create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  from_person_id uuid not null references public.people (id),
  to_person_id uuid not null references public.people (id),
  amount_cop numeric(12, 2) not null check (amount_cop > 0),
  created_at timestamptz not null default now()
);

create index if not exists plan_participants_plan_id_idx on public.plan_participants (plan_id);
create index if not exists plan_participants_person_id_idx on public.plan_participants (person_id);
create index if not exists activities_plan_id_idx on public.activities (plan_id);
create index if not exists expenses_plan_id_idx on public.expenses (plan_id);
create index if not exists settlements_plan_id_idx on public.settlements (plan_id);

-- ---------------------------------------------------------------------------
-- Helpers de autorización (security definer para evitar recursión de RLS)
-- ---------------------------------------------------------------------------
create or replace function public.current_person_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from public.people where auth_user_id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select role = 'admin' from public.people where auth_user_id = auth.uid()),
    false
  );
$$;

create or replace function public.is_plan_participant(target_plan_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.plan_participants
    where plan_id = target_plan_id and person_id = public.current_person_id()
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.people enable row level security;
alter table public.plans enable row level security;
alter table public.plan_participants enable row level security;
alter table public.activities enable row level security;
alter table public.expenses enable row level security;
alter table public.settlements enable row level security;

-- people
create policy "people_select_self_or_admin" on public.people
  for select using (auth_user_id = auth.uid() or public.is_admin());

create policy "people_admin_write" on public.people
  for all using (public.is_admin()) with check (public.is_admin());

-- plans
create policy "plans_select_participant_or_admin" on public.plans
  for select using (public.is_plan_participant(id) or public.is_admin());

create policy "plans_admin_write" on public.plans
  for all using (public.is_admin()) with check (public.is_admin());

-- plan_participants
create policy "plan_participants_select_participant_or_admin" on public.plan_participants
  for select using (public.is_plan_participant(plan_id) or public.is_admin());

create policy "plan_participants_admin_write" on public.plan_participants
  for all using (public.is_admin()) with check (public.is_admin());

-- activities
create policy "activities_select_participant_or_admin" on public.activities
  for select using (public.is_plan_participant(plan_id) or public.is_admin());

create policy "activities_admin_write" on public.activities
  for all using (public.is_admin()) with check (public.is_admin());

-- expenses: los participantes pueden registrar sus propios gastos en un
-- plan abierto; borrar/editar cualquier gasto queda solo para admin.
create policy "expenses_select_participant_or_admin" on public.expenses
  for select using (public.is_plan_participant(plan_id) or public.is_admin());

create policy "expenses_insert_participant" on public.expenses
  for insert with check (
    (public.is_plan_participant(plan_id) and created_by = public.current_person_id())
    or public.is_admin()
  );

create policy "expenses_modify_admin" on public.expenses
  for update using (public.is_admin()) with check (public.is_admin());

create policy "expenses_delete_admin" on public.expenses
  for delete using (public.is_admin());

-- settlements: solo lectura para participantes, escritura solo admin (al cerrar el plan)
create policy "settlements_select_participant_or_admin" on public.settlements
  for select using (public.is_plan_participant(plan_id) or public.is_admin());

create policy "settlements_admin_write" on public.settlements
  for all using (public.is_admin()) with check (public.is_admin());
