import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { createActivity, deleteActivity } from "@/app/actions/actividades";
import { formatCOP, formatDate } from "@/lib/format";
import type { Activity } from "@/lib/types";

interface ActivityWithResponsible extends Activity {
  responsible_name: string | null;
}

export function ActivitiesSection({
  planId,
  activities,
  participants,
  isAdmin,
}: {
  planId: string;
  activities: ActivityWithResponsible[];
  participants: { id: string; full_name: string }[];
  isAdmin: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-bold">Actividades</h2>
        <p className="text-sm text-ink-soft">El itinerario del plan y quién responde por cada cosa.</p>
      </CardHeader>
      <CardBody className="space-y-4">
        {activities.length === 0 ? (
          <p className="rounded-2xl bg-surface-muted/70 px-4 py-6 text-center text-sm text-ink-soft">
            Aún no hay actividades registradas.
          </p>
        ) : (
          <ul className="space-y-2">
            {activities.map((activity) => (
              <li
                key={activity.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-surface-muted/70 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-bold">{activity.name}</p>
                  <p className="text-xs text-ink-soft">
                    {formatDate(activity.activity_date)}
                    {activity.estimated_cost_cop
                      ? ` · Estimado ${formatCOP(activity.estimated_cost_cop)}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {activity.responsible_name && (
                    <div className="flex items-center gap-1.5" title={`Responsable: ${activity.responsible_name}`}>
                      <Avatar name={activity.responsible_name} size="sm" />
                    </div>
                  )}
                  {isAdmin && (
                    <form action={deleteActivity}>
                      <input type="hidden" name="activityId" value={activity.id} />
                      <input type="hidden" name="planId" value={planId} />
                      <ConfirmSubmit
                        message="¿Eliminar esta actividad?"
                        className="text-xs font-semibold text-coral-500 hover:text-coral-700"
                      >
                        Eliminar
                      </ConfirmSubmit>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {isAdmin && (
          <form
            action={createActivity}
            className="grid gap-3 rounded-2xl border border-dashed border-ink/10 p-4 sm:grid-cols-2"
          >
            <input type="hidden" name="planId" value={planId} />
            <div className="sm:col-span-2">
              <Label htmlFor="activityName">Nombre de la actividad</Label>
              <Input id="activityName" name="name" placeholder="Ej. Buceo en Playa Blanca" required />
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
              <Label htmlFor="responsiblePersonId">Responsable</Label>
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
                + Agregar actividad
              </Button>
            </div>
          </form>
        )}
      </CardBody>
    </Card>
  );
}
