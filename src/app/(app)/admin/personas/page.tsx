import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { PersonaForm } from "@/components/admin/persona-form";
import { PersonaRow } from "@/components/admin/persona-row";
import type { Person } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PersonasPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: people } = await supabase
    .from("people")
    .select("*")
    .order("created_at", { ascending: true });

  const typedPeople = (people ?? []) as Person[];
  const pendingCount = typedPeople.filter((p) => p.invite_status === "pendiente").length;

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-wide text-primary-600">Administración</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Personas</h1>
      <p className="mt-2 max-w-xl text-sm text-ink-soft">
        Solo las personas que agregues aquí pueden crear una cuenta. Comparte el
        código de invitación de cada una para que puedan activarse en{" "}
        <span className="font-semibold">/registro</span>.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <h2 className="font-bold">Agregar nueva persona</h2>
        </CardHeader>
        <CardBody>
          <PersonaForm />
        </CardBody>
      </Card>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-bold">
          {typedPeople.length} {typedPeople.length === 1 ? "persona" : "personas"}
        </h2>
        {pendingCount > 0 && (
          <p className="text-sm text-ink-soft">
            {pendingCount} pendiente{pendingCount === 1 ? "" : "s"} de activar
          </p>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {typedPeople.map((person) => (
          <PersonaRow key={person.id} person={person} />
        ))}
      </div>
    </div>
  );
}
