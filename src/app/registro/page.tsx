import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ planCode?: string }>;
}) {
  const { planCode } = await searchParams;

  return (
    <AuthShell
      eyebrow={planCode ? "Te invitaron a un plan" : "Únete al parche"}
      title="Crea tu cuenta"
      subtitle={
        planCode
          ? "Completa tus datos. El admin aprueba tu acceso y quedas agregado directo al plan."
          : "Completa tus datos. El admin del grupo tiene que aprobar tu acceso antes de que puedas entrar."
      }
    >
      <RegisterForm planCode={planCode} />
    </AuthShell>
  );
}
