import { AuthShell } from "@/components/auth/auth-shell";
import { RegistroForm } from "@/components/auth/registro-form";

export default function RegistroPage() {
  return (
    <AuthShell
      eyebrow="Acceso por invitación"
      title="Activa tu cuenta"
      subtitle="Usa el código y el correo que te compartió el admin del grupo."
    >
      <RegistroForm />
    </AuthShell>
  );
}
