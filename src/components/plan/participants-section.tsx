import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import {
  updateParticipantShare,
  removeParticipant,
  addParticipant,
} from "@/app/actions/planes";
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
          El peso controla cuánto le corresponde a cada quien. Usa 0 para
          invitados u homenajeados que no pagan, o un número distinto de 1
          para ajustar el reparto.
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

            <Input
              name="roleLabel"
              defaultValue={participant.role_label ?? ""}
              placeholder="Ej. Homenajeado"
              className="h-9 w-40 text-xs"
            />

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-ink-soft">Peso</span>
              <Input
                name="shareWeight"
                type="number"
                min="0"
                step="0.5"
                defaultValue={participant.share_weight}
                className="h-9 w-20 text-xs"
              />
            </div>

            <Button type="submit" size="sm" variant="outline">
              Guardar
            </Button>

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
      </CardBody>
    </Card>
  );
}
