-- Salidas Amigos — esquema inicial
-- Personas, planes, participantes, actividades, gastos y liquidaciones.
--
-- Todas las tablas y funciones usan el prefijo `sa_` a propósito: este
-- proyecto de Supabase es compartido con otras apps (p. ej. cadenas de
-- ahorro), así que el prefijo evita cualquier choque de nombres en el
-- esquema `public` y deja claro qué pertenece a Salidas Amigos.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- sa_people: el roster cerrado de amigos administrado por el/la admin.
-- Solo quien tiene una fila aquí (con invite_code válido) puede crear cuenta.
-- ---------------------------------------------------------------------------
create table if not exists public.sa_people (
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
-- sa_plans: cada salida/viaje/plan.
-- ---------------------------------------------------------------------------
create table if not exists public.sa_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  destination text,
  cover_emoji text not null default '🏖️',
  start_date date,
  end_date date,
  status text not null default 'abierto' check (status in ('abierto', 'cerrado')),
  split_mode text not null default 'equitativo' check (split_mode in ('equitativo', 'personalizado')),
  created_by uuid not null references public.sa_people (id),
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- sa_plan_participants: quién participa en cada plan y con qué peso se le
-- divide el gasto (share_weight = 0 para invitados/homenajeados que no pagan).
-- ---------------------------------------------------------------------------
create table if not exists public.sa_plan_participants (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.sa_plans (id) on delete cascade,
  person_id uuid not null references public.sa_people (id) on delete cascade,
  share_weight numeric(6, 2) not null default 1 check (share_weight >= 0),
  role_label text,
  created_at timestamptz not null default now(),
  unique (plan_id, person_id)
);

-- ---------------------------------------------------------------------------
-- sa_activities: itinerario del plan, cada una con un responsable.
-- ---------------------------------------------------------------------------
create table if not exists public.sa_activities (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.sa_plans (id) on delete cascade,
  name text not null,
  description text,
  activity_date date,
  responsible_person_id uuid references public.sa_people (id),
  estimated_cost_cop numeric(12, 2),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- sa_expenses: gastos reales, siempre en pesos colombianos.
-- ---------------------------------------------------------------------------
create table if not exists public.sa_expenses (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.sa_plans (id) on delete cascade,
  activity_id uuid references public.sa_activities (id) on delete set null,
  description text not null,
  category text not null default 'otros' check (
    category in ('alojamiento', 'transporte', 'comida', 'actividades', 'entradas', 'compras', 'otros')
  ),
  amount_cop numeric(12, 2) not null check (amount_cop > 0),
  paid_by_person_id uuid not null references public.sa_people (id),
  created_by uuid not null references public.sa_people (id),
  expense_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- sa_settlements: liquidación final calculada al cerrar el plan.
-- ---------------------------------------------------------------------------
create table if not exists public.sa_settlements (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.sa_plans (id) on delete cascade,
  from_person_id uuid not null references public.sa_people (id),
  to_person_id uuid not null references public.sa_people (id),
  amount_cop numeric(12, 2) not null check (amount_cop > 0),
  created_at timestamptz not null default now()
);

create index if not exists sa_plan_participants_plan_id_idx on public.sa_plan_participants (plan_id);
create index if not exists sa_plan_participants_person_id_idx on public.sa_plan_participants (person_id);
create index if not exists sa_activities_plan_id_idx on public.sa_activities (plan_id);
create index if not exists sa_expenses_plan_id_idx on public.sa_expenses (plan_id);
create index if not exists sa_settlements_plan_id_idx on public.sa_settlements (plan_id);

-- ---------------------------------------------------------------------------
-- Helpers de autorización (security definer para evitar recursión de RLS)
-- ---------------------------------------------------------------------------
create or replace function public.sa_current_person_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from public.sa_people where auth_user_id = auth.uid();
$$;

create or replace function public.sa_is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select role = 'admin' from public.sa_people where auth_user_id = auth.uid()),
    false
  );
$$;

create or replace function public.sa_is_plan_participant(target_plan_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.sa_plan_participants
    where plan_id = target_plan_id and person_id = public.sa_current_person_id()
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.sa_people enable row level security;
alter table public.sa_plans enable row level security;
alter table public.sa_plan_participants enable row level security;
alter table public.sa_activities enable row level security;
alter table public.sa_expenses enable row level security;
alter table public.sa_settlements enable row level security;

-- sa_people
create policy "sa_people_select_self_or_admin" on public.sa_people
  for select using (auth_user_id = auth.uid() or public.sa_is_admin());

create policy "sa_people_admin_write" on public.sa_people
  for all using (public.sa_is_admin()) with check (public.sa_is_admin());

-- sa_plans
create policy "sa_plans_select_participant_or_admin" on public.sa_plans
  for select using (public.sa_is_plan_participant(id) or public.sa_is_admin());

create policy "sa_plans_admin_write" on public.sa_plans
  for all using (public.sa_is_admin()) with check (public.sa_is_admin());

-- sa_plan_participants
create policy "sa_plan_participants_select_participant_or_admin" on public.sa_plan_participants
  for select using (public.sa_is_plan_participant(plan_id) or public.sa_is_admin());

create policy "sa_plan_participants_admin_write" on public.sa_plan_participants
  for all using (public.sa_is_admin()) with check (public.sa_is_admin());

-- sa_activities
create policy "sa_activities_select_participant_or_admin" on public.sa_activities
  for select using (public.sa_is_plan_participant(plan_id) or public.sa_is_admin());

create policy "sa_activities_admin_write" on public.sa_activities
  for all using (public.sa_is_admin()) with check (public.sa_is_admin());

-- sa_expenses: los participantes pueden registrar sus propios gastos en un
-- plan abierto; borrar/editar cualquier gasto queda solo para admin.
create policy "sa_expenses_select_participant_or_admin" on public.sa_expenses
  for select using (public.sa_is_plan_participant(plan_id) or public.sa_is_admin());

create policy "sa_expenses_insert_participant" on public.sa_expenses
  for insert with check (
    (public.sa_is_plan_participant(plan_id) and created_by = public.sa_current_person_id())
    or public.sa_is_admin()
  );

create policy "sa_expenses_modify_admin" on public.sa_expenses
  for update using (public.sa_is_admin()) with check (public.sa_is_admin());

create policy "sa_expenses_delete_admin" on public.sa_expenses
  for delete using (public.sa_is_admin());

-- sa_settlements: solo lectura para participantes, escritura solo admin (al cerrar el plan)
create policy "sa_settlements_select_participant_or_admin" on public.sa_settlements
  for select using (public.sa_is_plan_participant(plan_id) or public.sa_is_admin());

create policy "sa_settlements_admin_write" on public.sa_settlements
  for all using (public.sa_is_admin()) with check (public.sa_is_admin());
