import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatCOP, formatDate } from "@/lib/format";
import type { Plan } from "@/lib/types";

export function PlanCard({
  plan,
  totalCOP,
  participantCount,
}: {
  plan: Plan;
  totalCOP: number;
  participantCount: number;
}) {
  const isOpen = plan.status === "abierto";

  return (
    <Link
      href={`/planes/${plan.id}`}
      className="group block rounded-3xl border border-ink/5 bg-white p-6 shadow-sm shadow-ink/5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-900/10"
    >
      <div className="flex items-start justify-between">
        <span className="text-3xl">{plan.cover_emoji}</span>
        <Badge tone={isOpen ? "primary" : "neutral"}>
          {isOpen ? "Abierto" : "Cerrado"}
        </Badge>
      </div>

      <h3 className="mt-4 text-lg font-extrabold text-ink transition-colors group-hover:text-primary-600">
        {plan.name}
      </h3>
      {plan.destination && (
        <p className="mt-0.5 text-sm text-ink-soft">📍 {plan.destination}</p>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-ink/5 pt-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft/70">
            Gastado
          </p>
          <p className="text-base font-extrabold text-ink">{formatCOP(totalCOP)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft/70">
            Personas
          </p>
          <p className="text-base font-extrabold text-ink">{participantCount}</p>
        </div>
      </div>

      {plan.start_date && (
        <p className="mt-3 text-xs text-ink-soft">
          {formatDate(plan.start_date)}
          {plan.end_date ? ` — ${formatDate(plan.end_date)}` : ""}
        </p>
      )}
    </Link>
  );
}
