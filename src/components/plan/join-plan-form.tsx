"use client";

import { useActionState } from "react";
import { joinPlanByCode, type JoinPlanState } from "@/app/actions/planes";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";

const initialState: JoinPlanState = {};

export function JoinPlanForm({ defaultCode }: { defaultCode?: string }) {
  const [state, formAction, pending] = useActionState(joinPlanByCode, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="code">Código del plan</Label>
        <Input
          id="code"
          name="code"
          placeholder="Ej. K7P2M9X"
          defaultValue={defaultCode}
          className="uppercase tracking-widest"
          required
        />
      </div>
      <FieldError>{state.error}</FieldError>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Uniéndote..." : "Unirme al plan"}
      </Button>
    </form>
  );
}
