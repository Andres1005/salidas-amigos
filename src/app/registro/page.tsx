import { AuthShell } from "@/components/auth/auth-shell";
import { RegistroForm } from "@/components/auth/registro-form";

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string; planCode?: string }>;
}) {
  const { codigo, planCode } = await searchParams;

  return (
    <AuthShell
      eyebrow="Acceso por invitación"
      title="Activa tu cuenta"
      subtitle={
        planCode
          ? "Activa tu cuenta y te unimos directo al plan al que te invitaron."
          : "Usa el código y el correo que te compartió el admin del grupo."
      }
    >
      <RegistroForm defaultCode={codigo} planCode={planCode} />
    </AuthShell>
  );
}
