import { requirePerson } from "@/lib/dal";
import { Navbar } from "@/components/app/navbar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const person = await requirePerson();

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Navbar person={person} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
