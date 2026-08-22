import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default async function IniciarSesionPage({
  searchParams,
}: {
  searchParams: Promise<{ planCode?: string }>;
}) {
  const { planCode } = await searchParams;

  return (
    <AuthShell
      eyebrow="Bienvenido de nuevo"
      title="Inicia sesión"
      subtitle={
        planCode
          ? "Inicia sesión y te unimos directo al plan al que te invitaron."
          : "Entra para ver tus planes, registrar gastos y revisar liquidaciones."
      }
    >
      <LoginForm planCode={planCode} />
    </AuthShell>
  );
}
