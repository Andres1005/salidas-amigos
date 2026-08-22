import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Select } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { proposeActivity, approveActivity, deleteActivity } from "@/app/actions/actividades";
import { formatCOP, formatDate } from "@/lib/format";
import type { Activity } from "@/lib/types";

interface ActivityWithResponsible extends Activity {
  responsible_name: string | null;
}

function ActivityRow({
  activity,
  planId,
  isAdmin,
  currentPersonId,
}: {
  activity: ActivityWithResponsible;
  planId: string;
  isAdmin: boolean;
  currentPersonId: string;
}) {
  const isPending = activity.status === "pendiente";
  const canWithdraw = isPending && activity.proposed_by === currentPersonId && !isAdmin;

  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-surface-muted/70 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-lg">
          🎯
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold">{activity.name}</p>
            {isPending && <Badge tone="sun">Pendiente</Badge>}
          </div>
          <p className="text-xs text-ink-soft">
            {formatDate(activity.activity_date)}
            {activity.estimated_cost_cop ? ` · Estimado ${formatCOP(activity.estimated_cost_cop)}` : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pl-[52px] sm:pl-0">
        {activity.responsible_name && (
          <div className="flex items-center gap-1.5">
            <Avatar name={activity.responsible_name} size="sm" />
            <span className="text-xs text-ink-soft">{activity.responsible_name}</span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-3 sm:ml-0">
          {isAdmin && isPending && (
            <form action={approveActivity}>
              <input type="hidden" name="activityId" value={activity.id} />
              <input type="hidden" name="planId" value={planId} />
              <button
                type="submit"
                className="text-xs font-semibold text-primary-600 hover:text-primary-800"
              >
                Aprobar
              </button>
            </form>
          )}
          {(isAdmin || canWithdraw) && (
            <form action={deleteActivity}>
              <input type="hidden" name="activityId" value={activity.id} />
              <input type="hidden" name="planId" value={planId} />
              <ConfirmSubmit
                message={canWithdraw ? "¿Retirar tu propuesta?" : "¿Eliminar esta actividad?"}
                className="text-xs font-semibold text-coral-500 hover:text-coral-700"
              >
                {canWithdraw ? "Retirar" : "Eliminar"}
              </ConfirmSubmit>
            </form>
          )}
        </div>
      </div>
    </li>
  );
}

export function ActivitiesSection({
  planId,
  activities,
  participants,
  isAdmin,
  currentPersonId,
}: {
  planId: string;
  activities: ActivityWithResponsible[];
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
          El itinerario del plan y quién responde por cada cosa.
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
              {isAdmin ? "+ Agregar actividad" : "+ Proponer actividad"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
