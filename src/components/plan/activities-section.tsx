import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { proposeActivity } from "@/app/actions/actividades";
import { ActivityRow } from "@/components/plan/activity-row";
import type { Activity, ActivityNote } from "@/lib/types";

interface ActivityWithExtras extends Activity {
  responsible_name: string | null;
  notes: (ActivityNote & { person_name: string })[];
}

export function ActivitiesSection({
  planId,
  activities,
  participants,
  isAdmin,
  currentPersonId,
}: {
  planId: string;
  activities: ActivityWithExtras[];
  participants: { id: string; full_name: string }[];
  isAdmin: boolean;
  currentPersonId: string;
}) {
  const approved = activities.filter((a) => a.status === "aprobada");
  const pending = activities.filter((a) => a.status === "pendiente");

  return (
    <Card>
      <CardHeader>
        <h2 className="font-bold">Actividades</h2>
        <p className="text-sm text-ink-soft">
          El itinerario del plan, quién responde por cada cosa y las ideas de todos.
          {!isAdmin && " Cualquiera puede proponer una actividad; el admin la aprueba."}
        </p>
      </CardHeader>
      <CardBody className="space-y-4">
        {approved.length === 0 && pending.length === 0 ? (
          <p className="rounded-2xl bg-surface-muted/70 px-4 py-6 text-center text-sm text-ink-soft">
            Aún no hay actividades registradas.
          </p>
        ) : (
          <>
            {approved.length > 0 && (
              <ul className="space-y-2">
                {approved.map((activity) => (
                  <ActivityRow
                    key={activity.id}
                    activity={activity}
                    planId={planId}
                    participants={participants}
                    isAdmin={isAdmin}
                    currentPersonId={currentPersonId}
                  />
                ))}
              </ul>
            )}
            {pending.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft/70">
                  Propuestas pendientes
                </p>
                <ul className="space-y-2">
                  {pending.map((activity) => (
                    <ActivityRow
                      key={activity.id}
                      activity={activity}
                      planId={planId}
                      participants={participants}
                      isAdmin={isAdmin}
                      currentPersonId={currentPersonId}
                    />
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        <form
          action={proposeActivity}
          className="grid gap-3 rounded-2xl border border-dashed border-ink/10 p-4 sm:grid-cols-2"
        >
          <input type="hidden" name="planId" value={planId} />
          <div className="sm:col-span-2">
            <Label htmlFor="activityName">Nombre de la actividad</Label>
            <Input id="activityName" name="name" placeholder="Ej. Buceo en Playa Blanca" required />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="activityDescription">Observaciones (opcional)</Label>
            <Textarea
              id="activityDescription"
              name="description"
              rows={2}
              placeholder="Detalles, ideas iniciales..."
            />
          </div>
          <div>
            <Label htmlFor="activityDate">Fecha</Label>
            <Input id="activityDate" name="activityDate" type="date" />
          </div>
          <div>
            <Label htmlFor="estimatedCost">Costo estimado (COP)</Label>
            <Input id="estimatedCost" name="estimatedCost" type="number" min="0" placeholder="0" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="responsiblePersonId">Responsable (opcional)</Label>
            <Select id="responsiblePersonId" name="responsiblePersonId" defaultValue="">
              <option value="">Sin asignar</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" size="sm">
              {isAdmin ? "+ Agregar actividad" : "+ Proponer actividad"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
