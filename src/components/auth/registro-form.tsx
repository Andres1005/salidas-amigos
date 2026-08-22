"use client";

import { useActionState } from "react";
import Link from "next/link";
import { redeemInvite, type AuthFormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";

const initialState: AuthFormState = {};

export function RegistroForm() {
  const [state, formAction, pending] = useActionState(redeemInvite, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="inviteCode">Código de invitación</Label>
        <Input
          id="inviteCode"
          name="inviteCode"
          placeholder="Ej. K7P2M9X"
          className="uppercase tracking-widest"
          required
        />
      </div>
      <div>
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="El correo con el que te invitaron"
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" placeholder="Mínimo 8 caracteres" required />
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirma tu contraseña</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required />
      </div>

      <FieldError>{state.error}</FieldError>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Activando..." : "Activar mi cuenta"}
      </Button>

      <p className="text-center text-sm text-ink-soft">
        ¿Ya tienes cuenta?{" "}
        <Link href="/iniciar-sesion" className="font-semibold text-primary-600 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
