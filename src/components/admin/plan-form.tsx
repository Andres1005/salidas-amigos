"use client";

import { useActionState, useState } from "react";
import { createPlan } from "@/app/actions/planes";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, Select, FieldError } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import type { Person } from "@/lib/types";

const EMOJIS = ["🏖️", "🏔️", "🎉", "🍻", "🚐", "⛺", "🌆", "🍽️"];

export function PlanForm({ people }: { people: Person[] }) {
  const [state, formAction, pending] = useActionState(createPlan, {});
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <Label>Ícono del plan</Label>
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-2xl border-2 text-xl transition-all",
                emoji === e
                  ? "border-primary-500 bg-primary-50 scale-110"
                  : "border-transparent bg-surface-muted hover:border-primary-200"
              )}
            >
              {e}
            </button>
          ))}
        </div>
        <input type="hidden" name="coverEmoji" value={emoji} />
      </div>

      <div>
        <Label htmlFor="name">Nombre del plan</Label>
        <Input id="name" name="name" placeholder="Ej. Puente de Tayrona" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="destination">Destino (opcional)</Label>
          <Input id="destination" name="destination" placeholder="Ej. Santa Marta" />
        </div>
        <div>
          <Label htmlFor="splitMode">Modo de reparto</Label>
          <Select id="splitMode" name="splitMode" defaultValue="equitativo">
            <option value="equitativo">Equitativo entre todos</option>
            <option value="personalizado">Personalizado (ajustas después)</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="startDate">Fecha de inicio</Label>
          <Input id="startDate" name="startDate" type="date" />
        </div>
        <div>
          <Label htmlFor="endDate">Fecha de fin</Label>
          <Input id="endDate" name="endDate" type="date" />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descripción (opcional)</Label>
        <Textarea id="description" name="description" rows={3} placeholder="Detalles del plan..." />
      </div>

      <div>
        <Label>Participantes (opcional)</Label>
        <p className="mb-3 text-xs text-ink-soft">
          Tú quedas agregado automáticamente. Marca aquí a quienes ya sepas
          que van, o simplemente crea el plan y comparte su código para que
          cada quien se una por su cuenta — podrás ajustar el peso de cada
          persona (para invitados u homenajeados) después.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {people.map((person) => {
            const checked = selected.has(person.id);
            return (
              <label
                key={person.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 transition-colors",
                  checked ? "border-primary-400 bg-primary-50" : "border-transparent bg-surface-muted"
                )}
              >
                <input
                  type="checkbox"
                  name="participantIds"
                  value={person.id}
                  checked={checked}
                  onChange={() => toggle(person.id)}
                  className="h-4 w-4 accent-primary-500"
                />
                <Avatar name={person.full_name} size="sm" />
                <span className="text-sm font-semibold">{person.full_name}</span>
              </label>
            );
          })}
        </div>
      </div>

      <FieldError>{state.error}</FieldError>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Creando plan..." : "Crear plan"}
      </Button>
    </form>
  );
}
