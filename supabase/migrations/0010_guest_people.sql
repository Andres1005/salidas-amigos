-- "Invitados sin cuenta": personas que van al plan (pagan, tienen una
-- actividad asignada, etc.) pero que nunca van a crear cuenta ni entrar a
-- la app — el admin las agrega directamente con solo un nombre. Se
-- reutiliza sa_people para que participen del reparto, aparezcan como
-- responsables de actividades y como quien pagó un gasto, sin tocar RLS ni
-- ninguna otra tabla: ya se pueden insertar vía la política
-- sa_people_admin_write existente.

alter table public.sa_people add column if not exists is_guest boolean not null default false;
