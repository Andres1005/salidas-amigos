import { getCurrentPerson } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SinAccesoPage() {
  const person = await getCurrentPerson();
  if (person) redirect("/panel");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 items-center justify-center bg-wave px-6 py-16">
      <div className="w-full max-w-sm rounded-3xl border border-ink/5 bg-white p-8 text-center shadow-lg">
        <span className="text-4xl">🔒</span>
        <h1 className="mt-4 text-xl font-extrabold">Tu cuenta no tiene acceso</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {user?.email ? <span className="font-semibold">{user.email}</span> : "Esta cuenta"} no
          está vinculada a Salidas Amigos. Pídele al admin del grupo que te dé acceso,
          o crea tu cuenta desde cero en <span className="font-semibold">/registro</span>.
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
