import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { closePlan, reopenPlan } from "@/app/actions/cierre";
import { formatDate } from "@/lib/format";
import type { Plan } from "@/lib/types";

export function PlanHeader({ plan, isAdmin }: { plan: Plan; isAdmin: boolean }) {
  const isOpen = plan.status === "abierto";

  return (
    <div className="rounded-3xl border border-ink/5 bg-gradient-to-br from-primary-500 via-primary-600 to-coral-500 p-8 text-white shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{plan.cover_emoji}</span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{plan.name}</h1>
              {plan.destination && <p className="text-white/85">📍 {plan.destination}</p>}
            </div>
          </div>
          {(plan.start_date || plan.end_date) && (
            <p className="mt-3 text-sm text-white/80">
              {formatDate(plan.start_date)}
              {plan.end_date ? ` — ${formatDate(plan.end_date)}` : ""}
            </p>
          )}
          {plan.description && <p className="mt-2 max-w-xl text-sm text-white/85">{plan.description}</p>}
        </div>

        <div className="flex flex-col items-end gap-3">
          <Badge tone={isOpen ? "sun" : "neutral"} className="bg-white/20 text-white">
            {isOpen ? "🟢 Plan abierto" : "🔒 Plan cerrado"}
          </Badge>

          {isAdmin && (
            <form action={isOpen ? closePlan : reopenPlan}>
              <input type="hidden" name="planId" value={plan.id} />
              <Button
                type="submit"
                size="sm"
                variant={isOpen ? "secondary" : "outline"}
                className={isOpen ? "" : "border-white/40 text-white hover:bg-white/10"}
              >
                {isOpen ? "Cerrar y liquidar plan" : "Reabrir plan"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
