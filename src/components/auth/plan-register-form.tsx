"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerViaPlanCode, type AuthFormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";

const initialState: AuthFormState = {};

export function PlanRegisterForm({ planCode }: { planCode: string }) {
  const [state, formAction, pending] = useActionState(registerViaPlanCode, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="planCode" value={planCode} />
      <div>
        <Label htmlFor="fullName">Tu nombre</Label>
        <Input id="fullName" name="fullName" placeholder="Ej. Camila Ramírez" required />
      </div>
      <div>
        <Label htmlFor="email">Correo</Label>
        <Input id="email" name="email" type="email" placeholder="tucorreo@ejemplo.com" required />
      </div>
      <div>
        <Label htmlFor="password">Contraseña</Label>
        <PasswordInput id="password" name="password" placeholder="Mínimo 8 caracteres" required />
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirma tu contraseña</Label>
        <PasswordInput id="confirmPassword" name="confirmPassword" required />
      </div>

      <FieldError>{state.error}</FieldError>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Creando tu cuenta..." : "Crear cuenta y unirme"}
      </Button>

      <p className="text-center text-sm text-ink-soft">
        ¿Ya tienes cuenta?{" "}
        <Link
          href={`/iniciar-sesion?planCode=${planCode}`}
          className="font-semibold text-primary-600 hover:underline"
        >
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
