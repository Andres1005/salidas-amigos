-- Crea la fila de persona admin inicial (tú). Ajusta el nombre si quieres.
-- El invite_code generado es lo único que necesitas para canjear tu cuenta
-- en /registro la primera vez. Consúltalo después con:
--   select full_name, email, invite_code from public.people where role = 'admin';

insert into public.people (full_name, email, role, invite_code, invite_status)
values (
  'Andrés',
  'andresf.0498@gmail.com',
  'admin',
  upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8)),
  'pendiente'
)
on conflict (email) do nothing;
