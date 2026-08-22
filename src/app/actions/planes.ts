"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requirePerson } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { generateInviteCode } from "@/lib/invite-code";
import type { ActionState } from "@/app/actions/personas";

const planSchema = z.object({
  name: z.string().trim().min(2, "Ponle un nombre al plan."),
  destination: z.string().trim().optional(),
  description: z.string().trim().optional(),
  coverEmoji: z.string().trim().min(1).max(4).default("🏖️"),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  splitMode: z.enum(["equitativo", "personalizado"]).default("equitativo"),
  participantIds: z.array(z.string().uuid()),
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

  let plan: { id: string } | null = null;
  for (let attempt = 0; attempt < 5 && !plan; attempt++) {
    const { data, error } = await supabase
      .from("sa_plans")
      .insert({
        name: parsed.data.name,
        destination: parsed.data.destination || null,
        description: parsed.data.description || null,
        cover_emoji: parsed.data.coverEmoji,
        start_date: parsed.data.startDate || null,
        end_date: parsed.data.endDate || null,
        split_mode: parsed.data.splitMode,
        join_code: generateInviteCode(),
        created_by: admin.id,
      })
      .select("id")
      .single();

    if (data) {
      plan = data;
    } else if (!(error?.code === "23505" && error.message.includes("join_code"))) {
      return { error: "No se pudo crear el plan." };
    }
  }

  if (!plan) {
    return { error: "No se pudo generar un código único para el plan. Intenta de nuevo." };
  }

  // El admin que crea el plan queda como participante por defecto; los
  // demás elegidos aquí se suman igual, y cualquier otra persona puede
  // unirse después con el código del plan.
  const participantIds = new Set([admin.id, ...parsed.data.participantIds]);
  const participants = [...participantIds].map((personId) => ({
    plan_id: plan!.id,
    person_id: personId,
    share_weight: 1,
  }));

  const { error: participantsError } = await supabase
    .from("sa_plan_participants")
    .insert(participants);

  if (participantsError) {
    return { error: "El plan se creó pero no se pudieron agregar los participantes." };
  }

  revalidatePath("/panel");
  redirect(`/planes/${plan.id}`);
}

export interface JoinPlanState {
  error?: string;
}

export async function joinPlanByCode(
  _prevState: JoinPlanState,
  formData: FormData
): Promise<JoinPlanState> {
  await requirePerson();
  const supabase = await createClient();

  const code = (formData.get("code") as string)?.trim();
  if (!code) return { error: "Ingresa un código." };

  const { data: planId, error } = await supabase.rpc("sa_join_plan_by_code", { code });

  if (error || !planId) {
    return { error: "Ese código de plan no es válido." };
  }

  revalidatePath("/panel");
  redirect(`/planes/${planId}`);
}

export async function addParticipant(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const planId = formData.get("planId") as string;
  const personId = formData.get("personId") as string;

  if (!planId || !personId) return;

  await supabase
    .from("sa_plan_participants")
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
    .from("sa_plan_participants")
    .update({ share_weight: shareWeight, role_label: roleLabel })
    .eq("id", participantId);

  revalidatePath(`/planes/${planId}`);
}

export async function removeParticipant(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const participantId = formData.get("participantId") as string;
  const planId = formData.get("planId") as string;

  await supabase.from("sa_plan_participants").delete().eq("id", participantId);
  revalidatePath(`/planes/${planId}`);
}
