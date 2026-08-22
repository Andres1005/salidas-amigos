import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatCOP, formatDate } from "@/lib/format";
import type { Plan } from "@/lib/types";

const GRADIENTS = [
  "from-primary-500 via-primary-600 to-coral-500",
  "from-coral-500 via-coral-600 to-sun-500",
  "from-sun-400 via-sun-500 to-coral-500",
  "from-deep-600 via-primary-600 to-sun-400",
  "from-primary-600 via-deep-600 to-primary-400",
];

function gradientFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

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
      className="group block overflow-hidden rounded-3xl border border-ink/5 bg-white shadow-sm shadow-ink/5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-900/10"
    >
      <div className={`bg-gradient-to-br ${gradientFor(plan.id)} p-6 text-white`}>
        <div className="flex items-start justify-between">
          <span className="text-4xl drop-shadow-sm">{plan.cover_emoji}</span>
          <Badge tone={isOpen ? "sun" : "neutral"} className="bg-white/20 text-white">
            {isOpen ? "🟢 Abierto" : "🔒 Cerrado"}
          </Badge>
        </div>

        <h3 className="mt-4 text-lg font-extrabold tracking-tight">{plan.name}</h3>
        {plan.destination && <p className="mt-0.5 text-sm text-white/85">📍 {plan.destination}</p>}
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between">
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
      </div>
    </Link>
  );
}
