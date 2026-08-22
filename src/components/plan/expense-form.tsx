"use client";

import { useActionState, useEffect, useRef } from "react";
import { createExpense, type ExpenseFormState } from "@/app/actions/gastos";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, FieldError } from "@/components/ui/field";

const CATEGORIES: [string, string][] = [
  ["alojamiento", "🏨 Alojamiento"],
  ["transporte", "🚐 Transporte"],
  ["comida", "🍽️ Comida"],
  ["actividades", "🎟️ Actividades"],
  ["entradas", "🎫 Entradas"],
  ["compras", "🛍️ Compras"],
  ["otros", "📦 Otros"],
];

const initialState: ExpenseFormState = {};

export function ExpenseForm({
  planId,
  participants,
  currentPersonId,
}: {
  planId: string;
  participants: { id: string; full_name: string }[];
  currentPersonId: string;
}) {
  const [state, formAction, pending] = useActionState(createExpense, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current && !pending && !state.error) {
      formRef.current?.reset();
    }
  }, [state, pending]);

  return (
    <form
      ref={formRef}
      action={(formData) => {
        submitted.current = true;
        formAction(formData);
      }}
      className="grid gap-3 rounded-2xl border border-dashed border-ink/10 p-4 sm:grid-cols-2"
    >
      <input type="hidden" name="planId" value={planId} />
      <div className="sm:col-span-2">
        <Label htmlFor="description">¿Qué se pagó?</Label>
        <Input id="description" name="description" placeholder="Ej. Cena en el muelle" required />
      </div>
      <div>
        <Label htmlFor="amountCop">Monto (COP)</Label>
        <Input id="amountCop" name="amountCop" type="number" min="1" step="1" required />
      </div>
      <div>
        <Label htmlFor="category">Categoría</Label>
        <Select id="category" name="category" defaultValue="otros">
          {CATEGORIES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="paidByPersonId">¿Quién pagó?</Label>
        <Select id="paidByPersonId" name="paidByPersonId" defaultValue={currentPersonId}>
          {participants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="expenseDate">Fecha</Label>
        <Input id="expenseDate" name="expenseDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
      </div>

      {state.error && (
        <div className="sm:col-span-2">
          <FieldError>{state.error}</FieldError>
        </div>
      )}

      <div className="sm:col-span-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Guardando..." : "+ Agregar gasto"}
        </Button>
      </div>
    </form>
  );
}
