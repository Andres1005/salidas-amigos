import { Card, CardBody } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { PlanParticipant, Person } from "@/lib/types";

interface ParticipantWithPerson extends PlanParticipant {
  person: Pick<Person, "id" | "full_name" | "status" | "is_guest"> | null;
}

export function PlanMembers({ participants }: { participants: ParticipantWithPerson[] }) {
  return (
    <Card>
      <CardBody className="py-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-soft">
          {participants.length} {participants.length === 1 ? "persona" : "personas"} en el plan
        </p>
        {participants.length === 0 ? (
          <p className="text-sm text-ink-soft">Todavía no hay nadie en este plan.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {participants.map((p) => {
              const name = p.person?.full_name ?? "Alguien";
              const status = p.person?.status;
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-2 rounded-full bg-surface-muted/70 py-1 pl-1 pr-3"
                >
                  <Avatar name={name} size="sm" />
                  <span className="text-sm font-semibold text-ink">{name}</span>
                  {status === "pendiente" && <Badge tone="sun">Por aprobar</Badge>}
                  {status === "rechazado" && <Badge tone="coral">Rechazada</Badge>}
                  {p.person?.is_guest && <Badge tone="neutral">Sin cuenta</Badge>}
                  {p.role_label && <Badge tone="sun">{p.role_label}</Badge>}
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
