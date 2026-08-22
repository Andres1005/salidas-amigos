"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { inviteNewParticipant } from "@/app/actions/planes";
import type { ActionState } from "@/app/actions/personas";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";

const initialState: ActionState = {};

export function InviteNewParticipantForm({ planId }: { planId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(inviteNewParticipant, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.error) formRef.current?.querySelector("input")?.focus();
  }, [state.error]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-semibold text-primary-600 hover:underline"
      >
        + Invitar a alguien nuevo a este plan
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-3 rounded-2xl border border-dashed border-ink/10 p-4 sm:grid-cols-2"
    >
      <input type="hidden" name="planId" value={planId} />
      <div>
        <Label htmlFor="newFullName">Nombre</Label>
        <Input id="newFullName" name="fullName" placeholder="Ej. Camila Ramírez" required />
      </div>
      <div>
        <Label htmlFor="newEmail">Correo</Label>
        <Input id="newEmail" name="email" type="email" placeholder="camila@ejemplo.com" required />
      </div>
      {state.error && (
        <div className="sm:col-span-2">
          <FieldError>{state.error}</FieldError>
        </div>
      )}
      <div className="flex items-center gap-3 sm:col-span-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Agregando..." : "Agregar e invitar"}
        </Button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-semibold text-ink-soft hover:text-ink"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
