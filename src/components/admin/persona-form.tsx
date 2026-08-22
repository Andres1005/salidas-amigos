"use client";

import { useActionState, useEffect, useRef } from "react";
import { createPerson, type ActionState } from "@/app/actions/personas";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";

const initialState: ActionState = {};

export function PersonaForm() {
  const [state, formAction, pending] = useActionState(createPerson, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <div>
        <Label htmlFor="fullName">Nombre completo</Label>
        <Input id="fullName" name="fullName" placeholder="Ej. Camila Ramírez" required />
      </div>
      <div>
        <Label htmlFor="email">Correo</Label>
        <Input id="email" name="email" type="email" placeholder="camila@ejemplo.com" required />
      </div>
      <Button type="submit" disabled={pending} className="h-11">
        {pending ? "Agregando..." : "+ Agregar persona"}
      </Button>

      {state.error && (
        <div className="sm:col-span-3">
          <FieldError>{state.error}</FieldError>
        </div>
      )}
      {state.success && (
        <p className="text-sm font-medium text-primary-700 sm:col-span-3">{state.success}</p>
      )}
    </form>
  );
}
