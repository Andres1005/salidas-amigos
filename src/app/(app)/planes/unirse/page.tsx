import { Card, CardBody } from "@/components/ui/card";
import { JoinPlanForm } from "@/components/plan/join-plan-form";

export default async function UnirsePlanPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return (
    <div className="mx-auto max-w-md">
      <p className="text-sm font-bold uppercase tracking-wide text-primary-600">Unirme a un plan</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
        ¿Tienes un código de plan?
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        Pídeselo a quien organizó la salida — lo encuentra arriba del plan, junto al estado.
      </p>

      <Card className="mt-8">
        <CardBody className="pt-6">
          <JoinPlanForm defaultCode={code} />
        </CardBody>
      </Card>
    </div>
  );
}
