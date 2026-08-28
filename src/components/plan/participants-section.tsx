import Link from "next/link";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { ParticipantPresetSelect } from "@/components/plan/participant-preset-select";
import {
  updateParticipantShare,
  removeParticipant,
  addParticipant,
} from "@/app/actions/planes";
import { presetFor } from "@/lib/participant-presets";
import type { PlanParticipant, Person } from "@/lib/types";

interface ParticipantWithPerson extends PlanParticipant {
  person: Pick<Person, "id" | "full_name" | "status"> | null;
}

export function ParticipantsSection({
  planId,
  participants,
  availablePeople,
}: {
  planId: string;
  participants: ParticipantWithPerson[];
  availablePeople: Person[];
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-bold">Participantes y reparto</h2>
        <p className="text-sm text-ink-soft">
          Elige cómo se le divide el gasto a cada quien. Por defecto todos
          pagan su parte igual; marca homenajeado/a o invitado especial para
          que no les toque pagar.
        </p>
      </CardHeader>
      <CardBody className="space-y-3">
        {participants.map((participant) => (
          <form
            key={participant.id}
            action={updateParticipantShare}
            className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface-muted/70 px-4 py-3"
          >
            <input type="hidden" name="participantId" value={participant.id} />
            <input type="hidden" name="planId" value={planId} />

            <Avatar name={participant.person?.full_name ?? "Alguien"} size="sm" />
            <span className="min-w-[9rem] text-sm font-bold">
              {participant.person?.full_name ?? "Alguien"}
            </span>
            {participant.person?.status === "pendiente" && (
              <Link href="/admin/personas">
                <Badge tone="sun">Por aprobar →</Badge>
              </Link>
            )}

            <ParticipantPresetSelect
              defaultValue={presetFor(participant.role_label, Number(participant.share_weight))}
            />

            <ConfirmSubmit
              message={`¿Quitar a ${participant.person?.full_name ?? "esta persona"} de este plan?`}
              formAction={removeParticipant}
              className="ml-auto text-xs font-semibold text-coral-500 hover:text-coral-700"
            >
              Quitar
            </ConfirmSubmit>
          </form>
        ))}

        {availablePeople.length > 0 && (
          <div className="rounded-2xl border border-dashed border-ink/10 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft/70">
              Aprobadas pero aún no están en este plan
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {availablePeople.map((p) => (
                <li key={p.id} className="rounded-full bg-surface-muted/70 px-3 py-1 text-xs font-semibold text-ink-soft">
                  {p.full_name}
                </li>
              ))}
            </ul>
            <form action={addParticipant} className="mt-3 flex flex-wrap items-center gap-3">
              <input type="hidden" name="planId" value={planId} />
              <Select name="personId" defaultValue="" className="h-10 max-w-xs">
                <option value="" disabled>
                  Agregar participante...
                </option>
                {availablePeople.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.full_name}
                  </option>
                ))}
              </Select>
              <Button type="submit" size="sm">
                + Agregar
              </Button>
            </form>
          </div>
        )}

        <p className="text-xs text-ink-soft">
          ¿La persona que buscas no aparece en la lista de arriba? Comparte el código de este plan
          (en el encabezado) para que se registre — apenas la apruebes en Personas, aparece aquí.
        </p>
      </CardBody>
    </Card>
  );
}
