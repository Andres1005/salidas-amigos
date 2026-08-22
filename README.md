# Salidas Amigos

App para administrar salidas, planes y gastos con amigos: gestiona personas, planes, actividades y responsables, registra gastos en pesos colombianos y, al cerrar un plan, calcula automáticamente quién le debe a quién (con el menor número de transferencias posible).

Acceso cerrado: solo las personas que el admin agrega manualmente pueden crear una cuenta, usando un código de invitación único.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Actions)
- [Supabase](https://supabase.com) (Postgres + Auth, con Row Level Security)
- Tailwind CSS v4 + [Framer Motion](https://motion.dev)

## Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta en orden los archivos de `supabase/migrations/`:
   - `0001_init.sql` — esquema (personas, planes, participantes, actividades, gastos, liquidaciones) y RLS.
   - `0002_seed_admin.sql` — crea tu fila de persona admin (ajusta el correo si lo necesitas antes de ejecutar).
3. Copia `.env.local.example` a `.env.local` y completa las tres variables con los valores de **Project Settings → API** de tu proyecto.
4. Obtén tu código de invitación de admin con:
   ```sql
   select full_name, email, invite_code from public.people where role = 'admin';
   ```
5. Ve a `/registro`, canjea ese código con tu correo y activa tu cuenta.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Flujo general

1. El admin agrega personas en `/admin/personas` y comparte el código de invitación de cada una.
2. Cada persona activa su cuenta en `/registro` con ese código.
3. El admin crea planes en `/admin/planes/nuevo` y selecciona quiénes participan.
4. Cualquier participante registra gastos dentro del plan (`/planes/[id]`); el admin gestiona actividades, responsables y el peso de reparto de cada participante (para invitados u homenajeados que no pagan).
5. Al cerrar el plan, se calcula la liquidación final en COP y queda guardada como historial.
