import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import { PlanForm } from "@/components/admin/plan-form";
import type { Person } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NuevoPlanPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: people } = await supabase
    .from("people")
    .select("*")
    .order("full_name", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-bold uppercase tracking-wide text-primary-600">Nuevo plan</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
        Arma la próxima salida
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        Crea el plan, elige quiénes participan y luego agrega actividades y gastos.
      </p>

      <Card className="mt-8">
        <CardBody className="pt-6">
          <PlanForm people={(people ?? []) as Person[]} />
        </CardBody>
      </Card>
    </div>
  );
}
