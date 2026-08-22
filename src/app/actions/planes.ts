"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/app/actions/personas";

const planSchema = z.object({
  name: z.string().trim().min(2, "Ponle un nombre al plan."),
  destination: z.string().trim().optional(),
  description: z.string().trim().optional(),
  coverEmoji: z.string().trim().min(1).max(4).default("🏖️"),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  splitMode: z.enum(["equitativo", "personalizado"]).default("equitativo"),
  participantIds: z.array(z.string().uuid()).min(1, "Selecciona al menos un participante."),
});

export async function createPlan(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const parsed = planSchema.safeParse({
    name: formData.get("name"),
    destination: formData.get("destination") || undefined,
    description: formData.get("description") || undefined,
    coverEmoji: formData.get("coverEmoji") || "🏖️",
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
    splitMode: formData.get("splitMode") || "equitativo",
    participantIds: formData.getAll("participantIds"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { data: plan, error } = await supabase
    .from("plans")
    .insert({
      name: parsed.data.name,
      destination: parsed.data.destination || null,
      description: parsed.data.description || null,
      cover_emoji: parsed.data.coverEmoji,
      start_date: parsed.data.startDate || null,
      end_date: parsed.data.endDate || null,
      split_mode: parsed.data.splitMode,
      created_by: admin.id,
    })
    .select("id")
    .single();

  if (error || !plan) {
    return { error: "No se pudo crear el plan." };
  }

  const participants = parsed.data.participantIds.map((personId) => ({
    plan_id: plan.id,
    person_id: personId,
    share_weight: 1,
  }));

  const { error: participantsError } = await supabase
    .from("plan_participants")
    .insert(participants);

  if (participantsError) {
    return { error: "El plan se creó pero no se pudieron agregar los participantes." };
  }

  revalidatePath("/panel");
  redirect(`/planes/${plan.id}`);
}

export async function addParticipant(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const planId = formData.get("planId") as string;
  const personId = formData.get("personId") as string;

  if (!planId || !personId) return;

  await supabase
    .from("plan_participants")
    .insert({ plan_id: planId, person_id: personId, share_weight: 1 });

  revalidatePath(`/planes/${planId}`);
}

export async function updateParticipantShare(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const participantId = formData.get("participantId") as string;
  const planId = formData.get("planId") as string;
  const shareWeight = Number(formData.get("shareWeight"));
  const roleLabel = (formData.get("roleLabel") as string) || null;

  if (!participantId || Number.isNaN(shareWeight) || shareWeight < 0) return;

  await supabase
    .from("plan_participants")
    .update({ share_weight: shareWeight, role_label: roleLabel })
    .eq("id", participantId);

  revalidatePath(`/planes/${planId}`);
}

export async function removeParticipant(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const participantId = formData.get("participantId") as string;
  const planId = formData.get("planId") as string;

  await supabase.from("plan_participants").delete().eq("id", participantId);
  revalidatePath(`/planes/${planId}`);
}
