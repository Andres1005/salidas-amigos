import { redirect } from "next/navigation";
import { getCurrentPerson } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function PendienteAprobacionPage() {
  const person = await getCurrentPerson();
  if (!person) redirect("/sin-acceso");
  if (person.status === "aprobado") redirect("/panel");
  if (person.status === "rechazado") redirect("/sin-acceso");

  const supabase = await createClient();
  const { data: pendingPlan } = await supabase
    .from("sa_plan_participants")
    .select("plan:sa_plans(name)")
    .eq("person_id", person.id)
    .limit(1)
    .maybeSingle();

  const planName = (pendingPlan as unknown as { plan: { name: string } | null } | null)?.plan
    ?.name;

  return (
    <div className="flex flex-1 items-center justify-center bg-wave px-6 py-16">
      <div className="w-full max-w-sm rounded-3xl border border-ink/5 bg-white p-8 text-center shadow-lg">
        <span className="text-4xl">⏳</span>
        <h1 className="mt-4 text-xl font-extrabold">Tu cuenta está pendiente</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Hola {person.full_name.split(" ")[0]}, el admin del grupo todavía
          tiene que aprobar tu acceso.
          {planName && (
            <>
              {" "}
              En cuanto te aprueben vas a ver el plan{" "}
              <span className="font-semibold">“{planName}”</span> en tu panel.
            </>
          )}{" "}
          Vuelve a entrar más tarde.
        </p>
        <form action={logout} className="mt-6">
          <Button type="submit" variant="outline" className="w-full">
            Cerrar sesión
          </Button>
        </form>
      </div>
    </div>
  );
}
