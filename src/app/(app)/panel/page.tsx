import { requirePerson } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { PlanCard } from "@/components/plan/plan-card";
import { LinkButton } from "@/components/ui/button";
import type { Plan } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PanelPage() {
  const person = await requirePerson();
  const supabase = await createClient();

  const { data: plans } = await supabase
    .from("plans")
    .select("*")
    .order("created_at", { ascending: false });

  const planIds = (plans ?? []).map((p) => p.id);

  const [{ data: expenses }, { data: participants }] = await Promise.all([
    planIds.length
      ? supabase.from("expenses").select("plan_id, amount_cop").in("plan_id", planIds)
      : Promise.resolve({ data: [] as { plan_id: string; amount_cop: number }[] }),
    planIds.length
      ? supabase.from("plan_participants").select("plan_id").in("plan_id", planIds)
      : Promise.resolve({ data: [] as { plan_id: string }[] }),
  ]);

  const totalsByPlan = new Map<string, number>();
  for (const e of expenses ?? []) {
    totalsByPlan.set(e.plan_id, (totalsByPlan.get(e.plan_id) ?? 0) + Number(e.amount_cop));
  }
  const countByPlan = new Map<string, number>();
  for (const p of participants ?? []) {
    countByPlan.set(p.plan_id, (countByPlan.get(p.plan_id) ?? 0) + 1);
  }

  const typedPlans = (plans ?? []) as Plan[];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-primary-600">
            {person.role === "admin" ? "Todos los planes" : "Tus planes"}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Hola, {person.full_name.split(" ")[0]} 👋
          </h1>
        </div>
        {person.role === "admin" && (
          <LinkButton href="/admin/planes/nuevo">+ Nuevo plan</LinkButton>
        )}
      </div>

      {typedPlans.length === 0 ? (
        <div className="mt-16 rounded-3xl border border-dashed border-ink/15 bg-white/60 p-12 text-center">
          <p className="text-4xl">🏝️</p>
          <h2 className="mt-3 text-lg font-bold">Todavía no hay planes por aquí</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {person.role === "admin"
              ? "Crea el primer plan y agrega a tu parche."
              : "Cuando el admin te agregue a un plan, aparecerá aquí."}
          </p>
          {person.role === "admin" && (
            <LinkButton href="/admin/planes/nuevo" className="mt-6">
              Crear el primer plan
            </LinkButton>
          )}
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {typedPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              totalCOP={totalsByPlan.get(plan.id) ?? 0}
              participantCount={countByPlan.get(plan.id) ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
