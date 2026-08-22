"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { computeSettlement, type ParticipantTally } from "@/lib/settlement";

export async function closePlan(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const planId = formData.get("planId") as string;
  if (!planId) return;

  const [{ data: participants }, { data: expenses }] = await Promise.all([
    supabase
      .from("plan_participants")
      .select("person_id, share_weight, people(full_name)")
      .eq("plan_id", planId),
    supabase.from("expenses").select("amount_cop, paid_by_person_id").eq("plan_id", planId),
  ]);

  if (!participants || participants.length === 0) return;

  const paidByPerson = new Map<string, number>();
  for (const expense of expenses ?? []) {
    paidByPerson.set(
      expense.paid_by_person_id,
      (paidByPerson.get(expense.paid_by_person_id) ?? 0) + Number(expense.amount_cop)
    );
  }

  const tallies: ParticipantTally[] = participants.map((p) => ({
    personId: p.person_id,
    name:
      (p as unknown as { people: { full_name: string } | null }).people?.full_name ??
      "Sin nombre",
    weight: Number(p.share_weight),
    paid: paidByPerson.get(p.person_id) ?? 0,
  }));

  const { transfers } = computeSettlement(tallies);

  await supabase.from("settlements").delete().eq("plan_id", planId);

  if (transfers.length > 0) {
    await supabase.from("settlements").insert(
      transfers.map((t) => ({
        plan_id: planId,
        from_person_id: t.fromPersonId,
        to_person_id: t.toPersonId,
        amount_cop: t.amount,
      }))
    );
  }

  await supabase
    .from("plans")
    .update({ status: "cerrado", closed_at: new Date().toISOString() })
    .eq("id", planId);

  revalidatePath(`/planes/${planId}`);
  revalidatePath("/panel");
}

export async function reopenPlan(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const planId = formData.get("planId") as string;
  if (!planId) return;

  await supabase.from("plans").update({ status: "abierto", closed_at: null }).eq("id", planId);
  await supabase.from("settlements").delete().eq("plan_id", planId);

  revalidatePath(`/planes/${planId}`);
  revalidatePath("/panel");
}
