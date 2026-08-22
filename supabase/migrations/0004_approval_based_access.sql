-- Reemplaza el modelo de códigos de invitación personales por aprobación
-- del admin: cualquiera puede registrarse (nombre + correo + contraseña,
-- opcionalmente desde el link de un plan), pero una persona nueva queda
-- en estado 'pendiente' hasta que el admin la apruebe. invite_code /
-- invite_status quedan sin uso (no se eliminan para no romper nada en
-- caliente), simplemente la app ya no depende de ellos.

alter table public.sa_people
  add column if not exists status text not null default 'pendiente'
    check (status in ('pendiente', 'aprobado', 'rechazado'));

-- Todo lo que ya existe fue curado a mano por el admin antes de este
-- cambio (incluida la fila semilla del propio admin) — se considera
-- aprobado de una vez.
update public.sa_people set status = 'aprobado' where status = 'pendiente';
