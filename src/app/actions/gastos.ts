"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requirePerson, requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

const expenseSchema = z.object({
  planId: z.string().uuid(),
  description: z.string().trim().min(2, "Describe el gasto."),
  amountCop: z.coerce.number().positive("El monto debe ser mayor a cero."),
  category: z.enum([
    "alojamiento",
    "transporte",
    "comida",
    "actividades",
    "entradas",
    "compras",
    "otros",
  ]),
  paidByPersonId: z.string().uuid(),
  activityId: z.string().uuid().optional().or(z.literal("")),
  expenseDate: z.string().optional(),
});

export interface ExpenseFormState {
  error?: string;
}

export async function createExpense(
  _prevState: ExpenseFormState,
  formData: FormData
): Promise<ExpenseFormState> {
  const person = await requirePerson();
  const supabase = await createClient();

  const parsed = expenseSchema.safeParse({
    planId: formData.get("planId"),
    description: formData.get("description"),
    amountCop: formData.get("amountCop"),
    category: formData.get("category"),
    paidByPersonId: formData.get("paidByPersonId"),
    activityId: formData.get("activityId"),
    expenseDate: formData.get("expenseDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { error } = await supabase.from("expenses").insert({
    plan_id: parsed.data.planId,
    description: parsed.data.description,
    amount_cop: parsed.data.amountCop,
    category: parsed.data.category,
    paid_by_person_id: parsed.data.paidByPersonId,
    activity_id: parsed.data.activityId || null,
    expense_date: parsed.data.expenseDate || undefined,
    created_by: person.id,
  });

  if (error) {
    return { error: "No se pudo registrar el gasto." };
  }

  revalidatePath(`/planes/${parsed.data.planId}`);
  return {};
}

export async function deleteExpense(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const expenseId = formData.get("expenseId") as string;
  const planId = formData.get("planId") as string;

  await supabase.from("expenses").delete().eq("id", expenseId);
  revalidatePath(`/planes/${planId}`);
}
