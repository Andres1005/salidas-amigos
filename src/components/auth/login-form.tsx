"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthFormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";

const initialState: AuthFormState = {};

export function LoginForm({ planCode }: { planCode?: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {planCode && <input type="hidden" name="planCode" value={planCode} />}
      <div>
        <Label htmlFor="email">Correo</Label>
        <Input id="email" name="email" type="email" placeholder="tucorreo@ejemplo.com" required />
      </div>
      <div>
        <Label htmlFor="password">Contraseña</Label>
        <PasswordInput id="password" name="password" placeholder="••••••••" required />
      </div>

      <FieldError>{state.error}</FieldError>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Entrando..." : "Iniciar sesión"}
      </Button>

      <p className="text-center text-sm text-ink-soft">
        ¿Eres nuevo?{" "}
        <Link
          href={planCode ? `/registro?planCode=${planCode}` : "/registro"}
          className="font-semibold text-primary-600 hover:underline"
        >
          Crea tu cuenta
        </Link>
      </p>
    </form>
  );
}
