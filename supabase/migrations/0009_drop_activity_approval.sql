-- Se quita el paso de "aprobar actividad": cualquiera puede crear una
-- actividad y queda activa de una vez, sin que el admin tenga que
-- aprobarla. Esto deja sin sentido las actividades que ya estaban en
-- 'pendiente' — se marcan como 'aprobada' para que dejen de pedir
-- aprobación.

update public.sa_activities
set status = 'aprobada'
where status = 'pendiente';
