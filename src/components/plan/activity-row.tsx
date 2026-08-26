"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import {
  approveActivity,
  claimActivity,
  deleteActivity,
  deleteActivityNote,
  addActivityNote,
  unclaimActivity,
  updateActivity,
} from "@/app/actions/actividades";
import { formatCOP, formatDate, formatDateTime } from "@/lib/format";
import type { Activity, ActivityNote } from "@/lib/types";

interface ActivityWithExtras extends Activity {
  responsible_name: string | null;
  notes: (ActivityNote & { person_name: string })[];
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
  const [editing, setEditing] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const isPending = activity.status === "pendiente";
  const isOwner = activity.proposed_by === currentPersonId;
  const canEdit = isAdmin || isOwner;
  const canClaim = !activity.responsible_person_id;
  const canUnclaim = activity.responsible_person_id === currentPersonId;

  if (editing) {
    return (
      <li className="rounded-2xl border-2 border-primary-300 bg-white p-4">
        <form
          action={async (formData) => {
            await updateActivity(formData);
            setEditing(false);
          }}
          className="grid gap-3 sm:grid-cols-2"
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
            <Input
              id={`date-${activity.id}`}
              name="activityDate"
              type="date"
              defaultValue={activity.activity_date ?? ""}
            />
          </div>
          <div>
            <Label htmlFor={`cost-${activity.id}`}>Costo estimado (COP)</Label>
            <Input
              id={`cost-${activity.id}`}
              name="estimatedCost"
              type="number"
              min="0"
              defaultValue={activity.estimated_cost_cop ?? ""}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor={`responsible-${activity.id}`}>Responsable</Label>
            <Select
              id={`responsible-${activity.id}`}
              name="responsiblePersonId"
              defaultValue={activity.responsible_person_id ?? ""}
            >
              <option value="">Sin asignar</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" size="sm">
              Guardar
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-surface-muted/70 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-lg">
            🎯
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold">{activity.name}</p>
              {isPending && <Badge tone="sun">Pendiente</Badge>}
            </div>
            {activity.description && (
              <p className="mt-1 text-sm text-ink-soft">{activity.description}</p>
            )}
            <p className="mt-1 text-xs text-ink-soft">
              {activity.activity_date ? formatDate(activity.activity_date) : "Sin fecha"}
              {activity.estimated_cost_cop ? ` · Estimado ${formatCOP(activity.estimated_cost_cop)}` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pl-[52px] sm:pl-0">
          {activity.responsible_name ? (
            <div className="flex items-center gap-1.5">
              <Avatar name={activity.responsible_name} size="sm" />
              <span className="text-xs text-ink-soft">{activity.responsible_name}</span>
            </div>
          ) : (
            <span className="text-xs italic text-ink-soft/70">Sin responsable</span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 pl-[52px] text-xs font-semibold sm:pl-[52px]">
        {canClaim && (
          <form action={claimActivity}>
            <input type="hidden" name="activityId" value={activity.id} />
            <input type="hidden" name="planId" value={planId} />
            <button type="submit" className="text-primary-600 hover:text-primary-800">
              Asignarme
            </button>
          </form>
        )}
        {canUnclaim && (
          <form action={unclaimActivity}>
            <input type="hidden" name="activityId" value={activity.id} />
            <input type="hidden" name="planId" value={planId} />
            <button type="submit" className="text-ink-soft hover:text-ink">
              Dejar de ser responsable
            </button>
          </form>
        )}
        {isAdmin && isPending && (
          <form action={approveActivity}>
            <input type="hidden" name="activityId" value={activity.id} />
            <input type="hidden" name="planId" value={planId} />
            <button type="submit" className="text-primary-600 hover:text-primary-800">
              Aprobar
            </button>
          </form>
        )}
        {canEdit && (
          <button type="button" className="text-ink-soft hover:text-ink" onClick={() => setEditing(true)}>
            Editar
          </button>
        )}
        {canEdit && (
          <form action={deleteActivity}>
            <input type="hidden" name="activityId" value={activity.id} />
            <input type="hidden" name="planId" value={planId} />
            <ConfirmSubmit
              message={isOwner && !isAdmin ? "¿Eliminar tu actividad?" : "¿Eliminar esta actividad?"}
              className="text-coral-500 hover:text-coral-700"
            >
              Eliminar
            </ConfirmSubmit>
          </form>
        )}
        <button
          type="button"
          className="ml-auto text-ink-soft hover:text-ink"
          onClick={() => setNotesOpen((v) => !v)}
        >
          💬 {activity.notes.length > 0 ? `${activity.notes.length} nota${activity.notes.length === 1 ? "" : "s"}` : "Notas"}
        </button>
      </div>

      {notesOpen && (
        <div className="ml-[52px] space-y-3 rounded-2xl bg-white/70 p-3">
          {activity.notes.length > 0 && (
            <ul className="space-y-2">
              {activity.notes.map((note) => (
                <li key={note.id} className="flex items-start gap-2">
                  <Avatar name={note.person_name} size="sm" />
                  <div className="flex-1 rounded-xl bg-surface-muted px-3 py-2">
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
          <form
            action={async (formData) => {
              await addActivityNote(formData);
            }}
            className="flex items-end gap-2"
          >
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
      )}
    </li>
  );
}
