"use server";

import { revalidatePath } from "next/cache";
import { requirePerson, requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export async function proposeActivity(formData: FormData) {
  const person = await requirePerson();
  const supabase = await createClient();

  const planId = formData.get("planId") as string;
  const name = (formData.get("name") as string)?.trim();
  const activityDate = (formData.get("activityDate") as string) || null;
  const responsiblePersonId = (formData.get("responsiblePersonId") as string) || null;
  const estimatedCost = formData.get("estimatedCost");

  if (!planId || !name) return;

  await supabase.from("sa_activities").insert({
    plan_id: planId,
    name,
    activity_date: activityDate,
    responsible_person_id: responsiblePersonId || null,
    estimated_cost_cop: estimatedCost ? Number(estimatedCost) : null,
    proposed_by: person.id,
    status: person.role === "admin" ? "aprobada" : "pendiente",
  });

  revalidatePath(`/planes/${planId}`);
}

export async function approveActivity(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const activityId = formData.get("activityId") as string;
  const planId = formData.get("planId") as string;

  await supabase.from("sa_activities").update({ status: "aprobada" }).eq("id", activityId);
  revalidatePath(`/planes/${planId}`);
}

export async function deleteActivity(formData: FormData) {
  // Cubre tanto "el admin quita/rechaza una actividad" como "quien la
  // propuso retira su propia propuesta pendiente" — la política de RLS
  // decide cuál de los dos casos aplica según quién esté autenticado.
  await requirePerson();
  const supabase = await createClient();

  const activityId = formData.get("activityId") as string;
  const planId = formData.get("planId") as string;

  await supabase.from("sa_activities").delete().eq("id", activityId);
  revalidatePath(`/planes/${planId}`);
}
