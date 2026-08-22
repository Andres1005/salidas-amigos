import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
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
  person: Pick<Person, "id" | "full_name">;
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

            <Avatar name={participant.person.full_name} size="sm" />
            <span className="min-w-[9rem] text-sm font-bold">{participant.person.full_name}</span>

            <ParticipantPresetSelect
              defaultValue={presetFor(participant.role_label, Number(participant.share_weight))}
            />

            <ConfirmSubmit
              message={`¿Quitar a ${participant.person.full_name} de este plan?`}
              formAction={removeParticipant}
              className="ml-auto text-xs font-semibold text-coral-500 hover:text-coral-700"
            >
              Quitar
            </ConfirmSubmit>
          </form>
        ))}

        {availablePeople.length > 0 && (
          <form
            action={addParticipant}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-ink/10 p-4"
          >
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
        )}

        <p className="text-xs text-ink-soft">
          ¿La persona que buscas no aparece? Comparte el código de este plan (arriba)
          para que se registre — apenas la apruebes en Personas, aparece aquí.
        </p>
      </CardBody>
    </Card>
  );
}
