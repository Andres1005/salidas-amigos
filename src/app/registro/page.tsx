import { AuthShell } from "@/components/auth/auth-shell";
import { RegistroForm } from "@/components/auth/registro-form";
import { PlanRegisterForm } from "@/components/auth/plan-register-form";

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string; planCode?: string }>;
}) {
  const { codigo, planCode } = await searchParams;

  // Si llegan con el link de un plan y no traen un código personal, el
  // código del plan ya es la autorización: se registran directo, sin
  // que el admin tenga que agregarlos antes en Personas.
  if (planCode && !codigo) {
    return (
      <AuthShell
        eyebrow="Te invitaron a un plan"
        title="Crea tu cuenta"
        subtitle="Completa tus datos y quedas agregado directo al plan."
      >
        <PlanRegisterForm planCode={planCode} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Acceso por invitación"
      title="Activa tu cuenta"
      subtitle="Usa el código y el correo que te compartió el admin del grupo."
    >
      <RegistroForm defaultCode={codigo} planCode={planCode} />
    </AuthShell>
  );
}
