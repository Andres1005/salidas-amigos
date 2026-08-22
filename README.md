# Salidas Amigos

App para administrar salidas, planes y gastos con amigos: gestiona personas, planes, actividades y responsables, registra gastos en pesos colombianos y, al cerrar un plan, calcula automáticamente quién le debe a quién (con el menor número de transferencias posible).

Acceso cerrado por aprobación: cualquiera puede pedir una cuenta (desde `/registro` o el link de un plan), pero nadie entra hasta que el admin del grupo aprueba la solicitud desde `/admin/personas`.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Actions)
- [Supabase](https://supabase.com) (Postgres + Auth, con Row Level Security)
- Tailwind CSS v4 + [Framer Motion](https://motion.dev)

## Configurar Supabase

Este proyecto puede vivir en su propio proyecto de Supabase, o **compartir uno
que ya uses para otra app** (por ejemplo, uno con límite de proyectos en el
plan gratis). Todas las tablas y funciones usan el prefijo `sa_`
(`sa_people`, `sa_plans`, `sa_plan_participants`, `sa_activities`,
`sa_expenses`, `sa_settlements`, `sa_is_admin()`, etc.) precisamente para
convivir en el esquema `public` sin chocar con las tablas de otra app.

Una cosa que **sí** es compartida entre apps del mismo proyecto: el pool de
autenticación (`auth.users`). Si alguien ya tiene cuenta ahí por la otra app,
el flujo de `/registro` reutiliza ese mismo usuario de Auth (le actualiza la
contraseña) en vez de fallar. Si una cuenta de Auth no tiene una fila
vinculada en `sa_people`, la app la manda a `/sin-acceso` en vez de dejarla
entrar — así los datos de ambas apps quedan aislados por RLS aunque
compartan el proyecto.

1. Crea un proyecto nuevo en [supabase.com](https://supabase.com), o entra al proyecto existente que vayas a reutilizar.
2. En **SQL Editor**, ejecuta en orden los archivos de `supabase/migrations/`:
   - `0001_init.sql` — esquema (`sa_people`, `sa_plans`, `sa_plan_participants`, `sa_activities`, `sa_expenses`, `sa_settlements`) y RLS.
   - `0002_seed_admin.sql` — crea tu fila de persona admin (ajusta el correo si lo necesitas antes de ejecutar).
   - `0003_plan_join_and_activity_approval.sql` — código para unirse a un plan y aprobación de actividades.
   - `0004_approval_based_access.sql` — agrega el estado de aprobación de cuentas (`pendiente` / `aprobado` / `rechazado`).
3. Copia `.env.local.example` a `.env.local` y completa las tres variables con los valores de **Project Settings → API** de ese proyecto.
4. Ve a `/registro` y crea tu cuenta con el mismo correo de la fila admin que sembró `0002_seed_admin.sql` — como esa fila ya queda `aprobado` por la migración `0004`, entras directo sin que nadie tenga que aprobarte.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Flujo general

1. Cualquiera crea su cuenta en `/registro` (nombre, correo, contraseña) — sola o desde el link de un plan específico. Queda en estado **pendiente**.
2. El admin revisa las solicitudes en `/admin/personas` y las aprueba o rechaza. Recién aprobada, la persona puede entrar.
3. El admin crea planes en `/admin/planes/nuevo` y elige participantes entre las personas ya aprobadas, o comparte el código/link del plan para que se sumen solas.
4. Cualquier participante registra gastos dentro del plan (`/planes/[id]`) y puede proponer actividades; el admin las aprueba, gestiona responsables y el peso de reparto de cada participante (para invitados u homenajeados que no pagan).
5. Al cerrar el plan, se calcula la liquidación final en COP y queda guardada como historial.
