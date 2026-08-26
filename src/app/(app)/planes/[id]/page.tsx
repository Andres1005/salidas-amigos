import { notFound } from "next/navigation";
import { requirePerson } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { PlanHeader } from "@/components/plan/plan-header";
import { BalanceSummary } from "@/components/plan/balance-summary";
import { ActivitiesSection } from "@/components/plan/activities-section";
import type { ActivityBudgetTotals } from "@/components/plan/activities-section";
import { ExpensesSection } from "@/components/plan/expenses-section";
import { ParticipantsSection } from "@/components/plan/participants-section";
import type {
  Activity,
  ActivityNote,
  Expense,
  Person,
  Plan,
  PlanParticipant,
  Settlement,
} from "@/lib/types";
import type { ParticipantTally, Transfer } from "@/lib/settlement";

export const dynamic = "force-dynamic";

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const person = await requirePerson();
  const supabase = await createClient();

  const { data: plan } = await supabase
    .from("sa_plans")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!plan) notFound();

  const [
    { data: participantRows },
    { data: activityRows },
    { data: expenseRows },
    { data: settlementRows },
    { data: allPeople },
  ] = await Promise.all([
    supabase
      .from("sa_plan_participants")
      .select("*, person:sa_people(id, full_name)")
      .eq("plan_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("sa_activities")
      .select("*")
      .eq("plan_id", id)
      .order("activity_date", { ascending: true }),
    supabase
      .from("sa_expenses")
      .select("*")
      .eq("plan_id", id)
      .order("expense_date", { ascending: false }),
    supabase.from("sa_settlements").select("*").eq("plan_id", id),
    supabase.from("sa_people").select("*").eq("status", "aprobado").order("full_name", { ascending: true }),
  ]);

  const typedPlan = plan as Plan;
  const participants = (participantRows ?? []) as (PlanParticipant & {
    person: Pick<Person, "id" | "full_name"> | null;
  })[];
  const activities = (activityRows ?? []) as Activity[];
  const expenses = (expenseRows ?? []) as Expense[];
  const settlements = (settlementRows ?? []) as Settlement[];
  const people = (allPeople ?? []) as Person[];

  const activityIds = activities.map((a) => a.id);
  const { data: noteRows } =
    activityIds.length > 0
      ? await supabase
          .from("sa_activity_notes")
          .select("*")
          .in("activity_id", activityIds)
          .order("created_at", { ascending: true })
      : { data: [] as ActivityNote[] };
  const notes = (noteRows ?? []) as ActivityNote[];

  const nameById = new Map(
    participants.map((p) => [p.person_id, p.person?.full_name ?? "Alguien"])
  );
  const participantOptions = participants.map((p) => ({
    id: p.person_id,
    full_name: p.person?.full_name ?? "Alguien",
  }));
  const availablePeople = people.filter(
    (p) => !participants.some((pp) => pp.person_id === p.id)
  );

  const paidByPerson = new Map<string, number>();
  for (const expense of expenses) {
    paidByPerson.set(
      expense.paid_by_person_id,
      (paidByPerson.get(expense.paid_by_person_id) ?? 0) + Number(expense.amount_cop)
    );
  }

  const tallies: ParticipantTally[] = participants.map((p) => ({
    personId: p.person_id,
    name: p.person?.full_name ?? "Alguien",
    weight: Number(p.share_weight),
    paid: paidByPerson.get(p.person_id) ?? 0,
  }));

  const storedTransfers: Transfer[] = settlements.map((s) => ({
    fromPersonId: s.from_person_id,
    fromName: nameById.get(s.from_person_id) ?? "Alguien",
    toPersonId: s.to_person_id,
    toName: nameById.get(s.to_person_id) ?? "Alguien",
    amount: Number(s.amount_cop),
  }));

  const notesByActivity = new Map<string, (ActivityNote & { person_name: string })[]>();
  for (const note of notes) {
    const withName = { ...note, person_name: nameById.get(note.person_id) ?? "Alguien" };
    const list = notesByActivity.get(note.activity_id) ?? [];
    list.push(withName);
    notesByActivity.set(note.activity_id, list);
  }

  const activitiesWithResponsible = activities.map((a) => ({
    ...a,
    responsible_name: a.responsible_person_id ? nameById.get(a.responsible_person_id) ?? null : null,
    notes: notesByActivity.get(a.id) ?? [],
  }));

  const expensesWithPayer = expenses.map((e) => ({
    ...e,
    paid_by_name: nameById.get(e.paid_by_person_id) ?? "Alguien",
  }));

  const totalEstimated = activities.reduce(
    (sum, a) => (a.no_budget ? sum : sum + Number(a.actual_cost_cop ?? a.estimated_cost_cop ?? 0)),
    0
  );
  const totalActual = activities.reduce((sum, a) => sum + Number(a.actual_cost_cop ?? 0), 0);
  const totalWeight = participants.reduce((sum, p) => sum + Number(p.share_weight), 0);
  const budgetTotals: ActivityBudgetTotals = {
    totalEstimated,
    totalActual,
    perPerson:
      totalWeight > 0
        ? participants.map((p) => ({
            name: p.person?.full_name ?? "Alguien",
            share: totalEstimated * (Number(p.share_weight) / totalWeight),
          }))
        : [],
  };

  const isAdmin = person.role === "admin";
  const isOpen = typedPlan.status === "abierto";

  return (
    <div className="space-y-6">
      <PlanHeader plan={typedPlan} isAdmin={isAdmin} />

      <BalanceSummary
        tallies={tallies}
        isClosed={!isOpen}
        storedTransfers={storedTransfers}
        currentPersonId={person.id}
        activitiesBudget={totalEstimated}
      />

      <ExpensesSection
        planId={typedPlan.id}
        expenses={expensesWithPayer}
        participants={participantOptions}
        currentPersonId={person.id}
        isAdmin={isAdmin}
        isOpen={isOpen}
      />

      <ActivitiesSection
        planId={typedPlan.id}
        activities={activitiesWithResponsible}
        participants={participantOptions}
        budgetTotals={budgetTotals}
        isAdmin={isAdmin}
        currentPersonId={person.id}
      />

      {isAdmin && (
        <ParticipantsSection
          planId={typedPlan.id}
          participants={participants}
          availablePeople={availablePeople}
        />
      )}
    </div>
  );
}
