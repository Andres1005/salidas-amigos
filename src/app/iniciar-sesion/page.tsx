import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function IniciarSesionPage() {
  return (
    <AuthShell
      eyebrow="Bienvenido de nuevo"
      title="Inicia sesión"
      subtitle="Entra para ver tus planes, registrar gastos y revisar liquidaciones."
    >
      <LoginForm />
    </AuthShell>
  );
}
