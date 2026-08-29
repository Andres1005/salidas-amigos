import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { proposeActivity } from "@/app/actions/actividades";
import { ActivityRow } from "@/components/plan/activity-row";
import { formatCOP } from "@/lib/format";
import type { Activity, ActivityNote } from "@/lib/types";

interface ActivityWithExtras extends Activity {
  responsible_name: string | null;
  invited_name: string | null;
  notes: (ActivityNote & { person_name: string })[];
}

export interface ActivityBudgetTotals {
  totalEstimated: number;
  totalActual: number;
  perPerson: { name: string; share: number }[];
}

function BudgetSummary({ totals }: { totals: ActivityBudgetTotals }) {
  if (totals.totalEstimated === 0 && totals.totalActual === 0) return null;

  return (
    <div className="rounded-2xl bg-primary-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-primary-700">Presupuesto de actividades</p>
      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <p>
          <span className="text-ink-soft">Estimado total: </span>
          <span className="font-bold text-ink">{formatCOP(totals.totalEstimated)}</span>
        </p>
        {totals.totalActual > 0 && (
          <p>
            <span className="text-ink-soft">Ya gastado: </span>
            <span className="font-bold text-ink">{formatCOP(totals.totalActual)}</span>
          </p>
        )}
      </div>
      {totals.perPerson.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {totals.perPerson.map((p) => (
            <span key={p.name} className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-ink">
              {p.name}: {formatCOP(p.share)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function ActivitiesSection({
  planId,
  activities,
  participants,
  budgetTotals,
  isAdmin,
  currentPersonId,
}: {
  planId: string;
  activities: ActivityWithExtras[];
  participants: { id: string; full_name: string; is_guest: boolean }[];
  budgetTotals: ActivityBudgetTotals;
  isAdmin: boolean;
  currentPersonId: string;
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-bold">Actividades</h2>
        <p className="text-sm text-ink-soft">
          El itinerario del plan, quién responde por cada cosa y las ideas de todos.
        </p>
      </CardHeader>
      <CardBody className="space-y-4">
        <BudgetSummary totals={budgetTotals} />

        {activities.length === 0 ? (
          <p className="rounded-2xl bg-surface-muted/70 px-4 py-6 text-center text-sm text-ink-soft">
            Aún no hay actividades registradas.
          </p>
        ) : (
          <ul className="space-y-2">
            {activities.map((activity) => (
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
            <Label htmlFor="estimatedCost">Presupuesto aprox. (COP)</Label>
            <Input id="estimatedCost" name="estimatedCost" type="number" min="0" placeholder="0" />
            <label className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-ink-soft">
              <input type="checkbox" name="noBudget" className="h-3.5 w-3.5" />
              Esta tarea no tiene costo
            </label>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="responsiblePersonId">Responsable (opcional)</Label>
            <Select id="responsiblePersonId" name="responsiblePersonId" defaultValue="">
              <option value="">Sin asignar</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                  {p.is_guest ? " (sin cuenta)" : ""}
                </option>
              ))}
            </Select>
            <p className="mt-1.5 text-xs text-ink-soft">
              Si eliges a otra persona con cuenta, le llega como invitación para aceptar. Si eliges a alguien
              sin cuenta, queda asignada de una vez.
            </p>
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
