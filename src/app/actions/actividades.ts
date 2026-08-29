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

  // Si elige a otra persona como responsable, queda como invitación
  // pendiente: solo se auto-asigna de una vez si se elige a sí mismo.
  const isSelf = responsiblePersonId === person.id;

  await supabase.from("sa_activities").insert({
    plan_id: planId,
    name,
    description,
    activity_date: activityDate,
    responsible_person_id: isSelf ? person.id : null,
    invited_person_id: responsiblePersonId && !isSelf ? responsiblePersonId : null,
    estimated_cost_cop: noBudget ? null : estimatedCost ? Number(estimatedCost) : null,
    no_budget: noBudget,
    proposed_by: person.id,
    status: "aprobada",
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

  // El admin siempre puede tocar la asignación. Quien propuso la actividad
  // también puede, pero solo mientras sigue sin responsable — una vez
  // alguien acepta, ya solo el admin la puede reasignar (o "Quitar
  // responsable"). Elegir a alguien más queda como invitación pendiente, no
  // reemplaza de una vez a un responsable ya aceptado.
  const { data: current } = await supabase
    .from("sa_activities")
    .select("responsible_person_id, proposed_by")
    .eq("id", activityId)
    .maybeSingle();

  const canAssign =
    person.role === "admin" || (!current?.responsible_person_id && current?.proposed_by === person.id);

  if (canAssign) {
    const responsiblePersonId = (formData.get("responsiblePersonId") as string) || null;

    if (!responsiblePersonId) {
      update.responsible_person_id = null;
      update.invited_person_id = null;
    } else if (responsiblePersonId !== current?.responsible_person_id) {
      if (responsiblePersonId === person.id) {
        update.responsible_person_id = person.id;
        update.invited_person_id = null;
      } else if (!current?.responsible_person_id) {
        update.invited_person_id = responsiblePersonId;
      }
    }
  }

  await supabase.from("sa_activities").update(update).eq("id", activityId);

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

export async function respondActivityInvite(formData: FormData) {
  await requirePerson();
  const supabase = await createClient();

  const activityId = formData.get("activityId") as string;
  const planId = formData.get("planId") as string;
  const accept = formData.get("accept") === "true";

  await supabase.rpc("sa_respond_activity_invite", {
    target_activity_id: activityId,
    accept,
  });
  revalidatePath(`/planes/${planId}`);
}

export async function cancelActivityInvite(formData: FormData) {
  // El admin, o quien propuso la actividad (sigue sin responsable mientras
  // la invitación está pendiente), puede cancelarla — misma política de
  // UPDATE que el resto de la edición.
  await requirePerson();
  const supabase = await createClient();

  const activityId = formData.get("activityId") as string;
  const planId = formData.get("planId") as string;

  await supabase.from("sa_activities").update({ invited_person_id: null }).eq("id", activityId);
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
