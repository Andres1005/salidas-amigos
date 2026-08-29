import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { PersonaRow } from "@/components/admin/persona-row";
import type { Person } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PersonasPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: people } = await supabase
    .from("sa_people")
    .select("*")
    .order("created_at", { ascending: true });

  const typedPeople = (people ?? []) as Person[];
  const accounts = typedPeople.filter((p) => !p.is_guest);
  const guests = typedPeople.filter((p) => p.is_guest);
  const pending = accounts.filter((p) => p.status === "pendiente");
  const approved = accounts.filter((p) => p.status === "aprobado");
  const rejected = accounts.filter((p) => p.status === "rechazado");

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-wide text-primary-600">Administración</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Personas</h1>
      <p className="mt-2 max-w-xl text-sm text-ink-soft">
        Cualquiera puede pedir una cuenta desde <span className="font-semibold">/registro</span>{" "}
        o el link de un plan, pero nadie entra hasta que tú apruebas su solicitud aquí.
      </p>

      {pending.length > 0 && (
        <div className="mt-8">
          <h2 className="font-bold">
            {pending.length} solicitud{pending.length === 1 ? "" : "es"} pendiente
            {pending.length === 1 ? "" : "s"}
          </h2>
          <div className="mt-4 space-y-3">
            {pending.map((person) => (
              <PersonaRow key={person.id} person={person} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="font-bold">
          {approved.length} {approved.length === 1 ? "persona activa" : "personas activas"}
        </h2>
        {approved.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-surface-muted/70 px-4 py-6 text-center text-sm text-ink-soft">
            Todavía no hay personas aprobadas.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {approved.map((person) => (
              <PersonaRow key={person.id} person={person} />
            ))}
          </div>
        )}
      </div>

      {rejected.length > 0 && (
        <div className="mt-8">
          <h2 className="font-bold text-ink-soft">Rechazadas</h2>
          <div className="mt-4 space-y-3">
            {rejected.map((person) => (
              <PersonaRow key={person.id} person={person} />
            ))}
          </div>
        </div>
      )}

      {guests.length > 0 && (
        <div className="mt-8">
          <h2 className="font-bold">
            {guests.length} {guests.length === 1 ? "invitado sin cuenta" : "invitados sin cuenta"}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Personas agregadas directamente a un plan sin que se registren en la app.
          </p>
          <div className="mt-4 space-y-3">
            {guests.map((person) => (
              <PersonaRow key={person.id} person={person} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
