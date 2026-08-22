"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AuthFormState {
  error?: string;
}

const loginSchema = z.object({
  email: z.string().trim().email("Ingresa un correo válido."),
  password: z.string().min(1, "Ingresa tu contraseña."),
});

export async function login(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Correo o contraseña incorrectos." };
  }

  redirect("/panel");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

const redeemSchema = z
  .object({
    inviteCode: z
      .string()
      .trim()
      .min(4, "El código de invitación no es válido.")
      .transform((v) => v.toUpperCase()),
    email: z.string().trim().toLowerCase().email("Ingresa un correo válido."),
    password: z.string().min(8, "La contraseña debe tener mínimo 8 caracteres."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export async function redeemInvite(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = redeemSchema.safeParse({
    inviteCode: formData.get("inviteCode"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { inviteCode, email, password } = parsed.data;
  const admin = createAdminClient();

  const { data: person, error: lookupError } = await admin
    .from("people")
    .select("id, email, invite_status, auth_user_id")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (lookupError || !person) {
    return { error: "El código de invitación no existe." };
  }

  if (person.invite_status === "canjeada" || person.auth_user_id) {
    return { error: "Este código ya fue usado. Inicia sesión." };
  }

  if (person.email.toLowerCase() !== email) {
    return {
      error: "Ese correo no coincide con la invitación. Usa el correo que te compartieron.",
    };
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return {
      error:
        createError?.message === "User already registered"
          ? "Ya existe una cuenta con ese correo. Inicia sesión."
          : "No pudimos crear tu cuenta. Intenta de nuevo.",
    };
  }

  const { error: updateError } = await admin
    .from("people")
    .update({ auth_user_id: created.user.id, invite_status: "canjeada" })
    .eq("id", person.id);

  if (updateError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: "No pudimos activar tu cuenta. Intenta de nuevo." };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    redirect("/iniciar-sesion?activada=1");
  }

  redirect("/panel");
}
