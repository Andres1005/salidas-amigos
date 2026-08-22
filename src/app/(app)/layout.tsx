import { requirePerson } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/app/navbar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const person = await requirePerson();

  let pendingCount = 0;
  if (person.role === "admin") {
    const supabase = await createClient();
    const { count } = await supabase
      .from("sa_people")
      .select("id", { count: "exact", head: true })
      .eq("status", "pendiente");
    pendingCount = count ?? 0;
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Navbar person={person} pendingCount={pendingCount} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
