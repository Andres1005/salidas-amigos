"use server";

import { revalidatePath } from "next/cache";
import { requirePerson, requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export async function proposeActivity(formData: FormData) {
  const person = await requirePerson();
  const supabase = await createClient();

  const planId = formData.get("planId") as string;
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const activityDate = (formData.get("activityDate") as string) || null;
  const responsiblePersonId = (formData.get("responsiblePersonId") as string) || null;
  const estimatedCost = formData.get("estimatedCost");
  const noBudget = formData.get("noBudget") === "on";

  if (!planId || !name) return;

  await supabase.from("sa_activities").insert({
    plan_id: planId,
    name,
    description,
    activity_date: activityDate,
    responsible_person_id: responsiblePersonId || null,
    estimated_cost_cop: noBudget ? null : estimatedCost ? Number(estimatedCost) : null,
    no_budget: noBudget,
    proposed_by: person.id,
    status: person.role === "admin" ? "aprobada" : "pendiente",
  });

  revalidatePath(`/planes/${planId}`);
}

export async function updateActivity(formData: FormData) {
  // La política de RLS solo deja pasar esto al admin, al responsable actual,
  // o (si aún no tiene responsable) a quien la propuso.
  const person = await requirePerson();
  const supabase = await createClient();

  const activityId = formData.get("activityId") as string;
  const planId = formData.get("planId") as string;
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const activityDate = (formData.get("activityDate") as string) || null;
  const estimatedCost = formData.get("estimatedCost");
  const noBudget = formData.get("noBudget") === "on";

  if (!activityId || !planId || !name) return;

  const update: Record<string, unknown> = {
    name,
    description,
    activity_date: activityDate,
    estimated_cost_cop: noBudget ? null : estimatedCost ? Number(estimatedCost) : null,
    no_budget: noBudget,
  };

  // Solo el admin puede reasignar o quitar el responsable de una actividad;
  // si alguien más edita, este campo no se toca.
  if (person.role === "admin") {
    const responsiblePersonId = (formData.get("responsiblePersonId") as string) || null;
    update.responsible_person_id = responsiblePersonId || null;
  }

  await supabase.from("sa_activities").update(update).eq("id", activityId);

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
  // El admin, el responsable actual, o (si no tiene responsable) quien la
  // propuso pueden eliminarla — ver política sa_activities_delete_admin_or_owner.
  await requirePerson();
  const supabase = await createClient();

  const activityId = formData.get("activityId") as string;
  const planId = formData.get("planId") as string;

  await supabase.from("sa_activities").delete().eq("id", activityId);
  revalidatePath(`/planes/${planId}`);
}

export async function claimActivity(formData: FormData) {
  await requirePerson();
  const supabase = await createClient();

  const activityId = formData.get("activityId") as string;
  const planId = formData.get("planId") as string;
  const estimatedCost = formData.get("estimatedCost");
  const noBudget = formData.get("noBudget") === "on";

  await supabase.rpc("sa_claim_activity", {
    target_activity_id: activityId,
    assign: true,
    p_estimated_cost_cop: estimatedCost ? Number(estimatedCost) : null,
    mark_no_budget: noBudget,
  });
  revalidatePath(`/planes/${planId}`);
}

export async function unassignActivity(formData: FormData) {
  // Solo el admin puede llamar esto con éxito — lo hace cumplir el RPC.
  await requireAdmin();
  const supabase = await createClient();

  const activityId = formData.get("activityId") as string;
  const planId = formData.get("planId") as string;

  await supabase.rpc("sa_claim_activity", {
    target_activity_id: activityId,
    assign: false,
  });
  revalidatePath(`/planes/${planId}`);
}

export async function setActivityActualCost(formData: FormData) {
  await requirePerson();
  const supabase = await createClient();

  const activityId = formData.get("activityId") as string;
  const planId = formData.get("planId") as string;
  const amount = formData.get("amount");

  if (!activityId || !planId || !amount) return;

  await supabase.rpc("sa_set_activity_actual_cost", {
    target_activity_id: activityId,
    amount: Number(amount),
  });
  revalidatePath(`/planes/${planId}`);
}

export async function addActivityNote(formData: FormData) {
  const person = await requirePerson();
  const supabase = await createClient();

  const activityId = formData.get("activityId") as string;
  const planId = formData.get("planId") as string;
  const body = (formData.get("body") as string)?.trim();

  if (!activityId || !planId || !body) return;

  await supabase.from("sa_activity_notes").insert({
    activity_id: activityId,
    person_id: person.id,
    body,
  });

  revalidatePath(`/planes/${planId}`);
}

export async function deleteActivityNote(formData: FormData) {
  await requirePerson();
  const supabase = await createClient();

  const noteId = formData.get("noteId") as string;
  const planId = formData.get("planId") as string;

  await supabase.from("sa_activity_notes").delete().eq("id", noteId);
  revalidatePath(`/planes/${planId}`);
}
