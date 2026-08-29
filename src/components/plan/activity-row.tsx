"use client";

import { useState } from "react";
import { ChevronDown, MessageCircle, Pencil, Trash2, UserMinus, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import {
  cancelActivityInvite,
  claimActivity,
  deleteActivity,
  deleteActivityNote,
  addActivityNote,
  respondActivityInvite,
  setActivityActualCost,
  unassignActivity,
  updateActivity,
} from "@/app/actions/actividades";
import { cn } from "@/lib/cn";
import { formatCOP, formatDate, formatDateTime } from "@/lib/format";
import type { Activity, ActivityNote } from "@/lib/types";

interface ActivityWithExtras extends Activity {
  responsible_name: string | null;
  invited_name: string | null;
  notes: (ActivityNote & { person_name: string })[];
}

function moneyLabel(activity: ActivityWithExtras) {
  if (activity.no_budget) return { text: "Sin costo", tone: "text-ink-soft" };
  if (activity.actual_cost_cop != null) {
    const overBudget = activity.estimated_cost_cop != null && activity.actual_cost_cop > activity.estimated_cost_cop;
    return { text: `Gastado ${formatCOP(activity.actual_cost_cop)}`, tone: overBudget ? "text-coral-600" : "text-primary-700" };
  }
  if (activity.estimated_cost_cop != null) {
    return { text: `Estimado ${formatCOP(activity.estimated_cost_cop)}`, tone: "text-ink-soft" };
  }
  return { text: "Sin presupuesto", tone: "text-ink-soft/60 italic" };
}

function ActionPill({
  onClick,
  icon,
  children,
  tone = "default",
}: {
  onClick?: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  tone?: "default" | "primary" | "danger";
}) {
  const toneClass =
    tone === "primary"
      ? "text-primary-700 hover:bg-primary-100"
      : tone === "danger"
        ? "text-coral-600 hover:bg-coral-100"
        : "text-ink-soft hover:bg-ink/5 hover:text-ink";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
        toneClass
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function InviteResponse({ activity, planId }: { activity: ActivityWithExtras; planId: string }) {
  return (
    <div className="rounded-xl bg-sun-50 p-3">
      <p className="text-sm font-semibold text-sun-800">Te invitaron como responsable de esta actividad.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <form action={respondActivityInvite}>
          <input type="hidden" name="activityId" value={activity.id} />
          <input type="hidden" name="planId" value={planId} />
          <input type="hidden" name="accept" value="true" />
          <Button type="submit" size="sm">
            Aceptar
          </Button>
        </form>
        <form action={respondActivityInvite}>
          <input type="hidden" name="activityId" value={activity.id} />
          <input type="hidden" name="planId" value={planId} />
          <input type="hidden" name="accept" value="false" />
          <Button type="submit" size="sm" variant="outline">
            Rechazar
          </Button>
        </form>
      </div>
    </div>
  );
}

function ClaimForm({ activity, planId }: { activity: ActivityWithExtras; planId: string }) {
  const [open, setOpen] = useState(false);
  const needsBudgetInfo = !activity.no_budget && activity.estimated_cost_cop == null;

  if (!needsBudgetInfo) {
    return (
      <form action={claimActivity}>
        <input type="hidden" name="activityId" value={activity.id} />
        <input type="hidden" name="planId" value={planId} />
        <ActionPill icon={<UserPlus size={14} />} tone="primary">
          Asignarme
        </ActionPill>
      </form>
    );
  }

  if (!open) {
    return (
      <ActionPill icon={<UserPlus size={14} />} tone="primary" onClick={() => setOpen(true)}>
        Asignarme
      </ActionPill>
    );
  }

  return (
    <form
      action={claimActivity}
      onSubmit={(e) => {
        const form = e.currentTarget;
        const noBudget = (form.elements.namedItem("noBudget") as HTMLInputElement)?.checked;
        const cost = (form.elements.namedItem("estimatedCost") as HTMLInputElement)?.value;
        if (!noBudget && !cost) {
          e.preventDefault();
          alert("Indica un presupuesto aproximado o marca la actividad como sin costo.");
        }
      }}
      className="flex w-full flex-wrap items-end gap-2 rounded-xl bg-white/70 p-2.5"
    >
      <input type="hidden" name="activityId" value={activity.id} />
      <input type="hidden" name="planId" value={planId} />
      <div>
        <Label htmlFor={`claim-cost-${activity.id}`} className="mb-1 text-xs">
          Presupuesto aprox. (COP)
        </Label>
        <Input
          id={`claim-cost-${activity.id}`}
          name="estimatedCost"
          type="number"
          min="0"
          className="h-9 w-36 py-1.5 text-sm"
          placeholder="0"
        />
      </div>
      <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-soft">
        <input type="checkbox" name="noBudget" className="h-3.5 w-3.5" />
        Sin costo
      </label>
      <Button type="submit" size="sm">
        Confirmar
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
        Cancelar
      </Button>
    </form>
  );
}

function ActualCostSection({
  activity,
  planId,
  isAssignee,
  isAdmin,
}: {
  activity: ActivityWithExtras;
  planId: string;
  isAssignee: boolean;
  isAdmin: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (activity.no_budget) return null;

  if (activity.actual_cost_cop != null && !editing) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-ink">Gasto real: {formatCOP(activity.actual_cost_cop)}</span>
        {isAdmin ? (
          <button type="button" className="text-ink-soft hover:text-ink" onClick={() => setEditing(true)}>
            Editar
          </button>
        ) : (
          <span className="text-ink-soft/70">(solo el admin puede modificarlo)</span>
        )}
      </div>
    );
  }

  // Solo el responsable de la tarea puede registrar el gasto real la primera
  // vez; el admin solo interviene para corregirlo una vez ya existe.
  if (!isAssignee) return null;

  return (
    <form
      action={setActivityActualCost}
      onSubmit={(e) => {
        const input = e.currentTarget.elements.namedItem("amount") as HTMLInputElement;
        const value = Number(input?.value);
        if (!value || value <= 0) {
          e.preventDefault();
          return;
        }
        const message =
          activity.actual_cost_cop != null
            ? `¿Confirmas cambiar el gasto real a ${formatCOP(value)}?`
            : `¿Confirmas que gastaste ${formatCOP(value)} en "${activity.name}"? Una vez lo registres no podrás modificarlo (solo el admin podrá hacerlo).`;
        if (!confirm(message)) {
          e.preventDefault();
          return;
        }
        setEditing(false);
      }}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="activityId" value={activity.id} />
      <input type="hidden" name="planId" value={planId} />
      <Input
        name="amount"
        type="number"
        min="0"
        defaultValue={activity.actual_cost_cop ?? ""}
        placeholder="Gasto real (COP)"
        className="h-8 w-40 py-1 text-xs"
      />
      <Button type="submit" size="sm" className="h-8 px-3 text-xs">
        Registrar
      </Button>
      {editing && (
        <Button type="button" size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={() => setEditing(false)}>
          Cancelar
        </Button>
      )}
    </form>
  );
}

function EditForm({
  activity,
  planId,
  participants,
  canAssign,
  onDone,
}: {
  activity: ActivityWithExtras;
  planId: string;
  participants: { id: string; full_name: string }[];
  canAssign: boolean;
  onDone: () => void;
}) {
  return (
    <form
      action={async (formData) => {
        await updateActivity(formData);
        onDone();
      }}
      className="grid gap-3 rounded-xl bg-white/70 p-3 sm:grid-cols-2"
    >
      <input type="hidden" name="activityId" value={activity.id} />
      <input type="hidden" name="planId" value={planId} />
      <div className="sm:col-span-2">
        <Label htmlFor={`name-${activity.id}`}>Nombre</Label>
        <Input id={`name-${activity.id}`} name="name" defaultValue={activity.name} required />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`description-${activity.id}`}>Observaciones</Label>
        <Textarea
          id={`description-${activity.id}`}
          name="description"
          rows={2}
          defaultValue={activity.description ?? ""}
          placeholder="Detalles, ideas, lo que haga falta..."
        />
      </div>
      <div>
        <Label htmlFor={`date-${activity.id}`}>Fecha</Label>
        <Input id={`date-${activity.id}`} name="activityDate" type="date" defaultValue={activity.activity_date ?? ""} />
      </div>
      <div>
        <Label htmlFor={`cost-${activity.id}`}>Presupuesto aprox. (COP)</Label>
        <Input
          id={`cost-${activity.id}`}
          name="estimatedCost"
          type="number"
          min="0"
          defaultValue={activity.estimated_cost_cop ?? ""}
        />
        <label className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-ink-soft">
          <input type="checkbox" name="noBudget" defaultChecked={activity.no_budget} className="h-3.5 w-3.5" />
          Esta tarea no tiene costo
        </label>
      </div>
      {canAssign && (
        <div className="sm:col-span-2">
          <Label htmlFor={`responsible-${activity.id}`}>Responsable</Label>
          <Select
            id={`responsible-${activity.id}`}
            name="responsiblePersonId"
            defaultValue={activity.responsible_person_id ?? activity.invited_person_id ?? ""}
          >
            <option value="">Sin asignar</option>
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </Select>
          <p className="mt-1.5 text-xs text-ink-soft">
            Si eliges a otra persona, le llega como invitación para aceptar (no queda asignada de una vez).
          </p>
        </div>
      )}
      <div className="flex gap-3 sm:col-span-2">
        <Button type="submit" size="sm">
          Guardar
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export function ActivityRow({
  activity,
  planId,
  participants,
  isAdmin,
  currentPersonId,
}: {
  activity: ActivityWithExtras;
  planId: string;
  participants: { id: string; full_name: string }[];
  isAdmin: boolean;
  currentPersonId: string;
}) {
  const isInvitee = activity.invited_person_id === currentPersonId;
  const [expanded, setExpanded] = useState(isInvitee);
  const [editing, setEditing] = useState(false);

  const isAssignee = activity.responsible_person_id === currentPersonId;
  const isOwnerOfUnassigned = !activity.responsible_person_id && activity.proposed_by === currentPersonId;
  const canManage = isAdmin || isAssignee || isOwnerOfUnassigned;
  const canAssign = isAdmin || isOwnerOfUnassigned;
  const canClaim = !activity.responsible_person_id && !activity.invited_person_id;
  const money = moneyLabel(activity);

  return (
    <li className="rounded-2xl bg-surface-muted/70">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-base">
          🎯
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-sm font-bold">{activity.name}</p>
            {activity.invited_person_id && <Badge tone="sun">Por confirmar</Badge>}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-ink-soft">
            <span>
              {activity.responsible_name ??
                (activity.invited_name ? `Invitado: ${activity.invited_name}` : "Sin responsable")}
            </span>
            <span>·</span>
            <span className={money.tone}>{money.text}</span>
          </div>
        </div>
        {activity.notes.length > 0 && (
          <span className="flex shrink-0 items-center gap-1 text-xs text-ink-soft">
            <MessageCircle size={14} />
            {activity.notes.length}
          </span>
        )}
        <ChevronDown
          size={18}
          className={cn("shrink-0 text-ink-soft transition-transform", expanded && "rotate-180")}
        />
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-ink/5 px-4 pb-4 pt-3">
          {editing ? (
            <EditForm
              activity={activity}
              planId={planId}
              participants={participants}
              canAssign={canAssign}
              onDone={() => setEditing(false)}
            />
          ) : (
            <>
              {activity.description && <p className="text-sm text-ink-soft">{activity.description}</p>}
              <p className="text-xs text-ink-soft">
                {activity.activity_date ? formatDate(activity.activity_date) : "Sin fecha"}
              </p>

              {activity.responsible_person_id && (
                <ActualCostSection activity={activity} planId={planId} isAssignee={isAssignee} isAdmin={isAdmin} />
              )}

              {isInvitee && <InviteResponse activity={activity} planId={planId} />}

              <div className="flex flex-wrap items-center gap-1 border-t border-ink/5 pt-2">
                {canClaim && <ClaimForm activity={activity} planId={planId} />}
                {canManage && activity.invited_person_id && !isInvitee && (
                  <form action={cancelActivityInvite}>
                    <input type="hidden" name="activityId" value={activity.id} />
                    <input type="hidden" name="planId" value={planId} />
                    <ActionPill icon={<UserMinus size={14} />}>Cancelar invitación</ActionPill>
                  </form>
                )}
                {isAdmin && activity.responsible_person_id && (
                  <form action={unassignActivity}>
                    <input type="hidden" name="activityId" value={activity.id} />
                    <input type="hidden" name="planId" value={planId} />
                    <ActionPill icon={<UserMinus size={14} />}>Quitar responsable</ActionPill>
                  </form>
                )}
                {canManage && (
                  <ActionPill icon={<Pencil size={14} />} onClick={() => setEditing(true)}>
                    Editar
                  </ActionPill>
                )}
                {canManage && (
                  <form action={deleteActivity} className="ml-auto">
                    <input type="hidden" name="activityId" value={activity.id} />
                    <input type="hidden" name="planId" value={planId} />
                    <ConfirmSubmit
                      message="¿Eliminar esta actividad?"
                      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-coral-600 transition-colors hover:bg-coral-100"
                    >
                      <Trash2 size={14} />
                      Eliminar
                    </ConfirmSubmit>
                  </form>
                )}
              </div>

              <div className="space-y-3 border-t border-ink/5 pt-3">
                {activity.notes.length > 0 && (
                  <ul className="space-y-2">
                    {activity.notes.map((note) => (
                      <li key={note.id} className="flex items-start gap-2">
                        <Avatar name={note.person_name} size="sm" />
                        <div className="flex-1 rounded-xl bg-white/80 px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold">{note.person_name}</p>
                            <span className="text-[10px] text-ink-soft/70">{formatDateTime(note.created_at)}</span>
                          </div>
                          <p className="text-sm text-ink">{note.body}</p>
                        </div>
                        {(isAdmin || note.person_id === currentPersonId) && (
                          <form action={deleteActivityNote}>
                            <input type="hidden" name="noteId" value={note.id} />
                            <input type="hidden" name="planId" value={planId} />
                            <button type="submit" className="text-xs text-coral-500 hover:text-coral-700">
                              ✕
                            </button>
                          </form>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <form action={addActivityNote} className="flex items-end gap-2">
                  <input type="hidden" name="activityId" value={activity.id} />
                  <input type="hidden" name="planId" value={planId} />
                  <Textarea
                    name="body"
                    rows={1}
                    placeholder="Escribe una idea o nota... ej. compremos 2 libras de carne"
                    className="flex-1"
                    required
                  />
                  <Button type="submit" size="sm">
                    Enviar
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </li>
  );
}
