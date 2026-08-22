"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateInviteCode } from "@/lib/invite-code";

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

  const planCode = (formData.get("planCode") as string) || null;
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Correo o contraseña incorrectos." };
  }

  if (planCode) {
    const { data: planId } = await supabase.rpc("sa_join_plan_by_code", { code: planCode });
    if (planId) redirect(`/planes/${planId}`);
  }

  redirect("/panel");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/**
 * Crea el usuario de Auth para este correo, o si el proyecto de Supabase
 * también sirve otra app y ese correo ya tiene un usuario ahí, reutiliza
 * ese usuario fijándole la contraseña que la persona acaba de elegir.
 */
async function createOrReuseAuthUser(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
  password: string
): Promise<{ authUserId: string; isNewUser: boolean } | { error: string }> {
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (created.user) {
    return { authUserId: created.user.id, isNewUser: true };
  }

  if (!createError?.message.toLowerCase().includes("already been registered")) {
    return { error: "No pudimos crear tu cuenta. Intenta de nuevo." };
  }

  const { data: existing } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existingUser = existing?.users.find((u) => u.email?.toLowerCase() === email);

  if (!existingUser) {
    return { error: "No pudimos activar tu cuenta. Intenta de nuevo." };
  }

  const { error: updatePasswordError } = await admin.auth.admin.updateUserById(existingUser.id, {
    password,
  });

  if (updatePasswordError) {
    return { error: "No pudimos activar tu cuenta. Intenta de nuevo." };
  }

  return { authUserId: existingUser.id, isNewUser: false };
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
  const planCode = (formData.get("planCode") as string) || null;
  const admin = createAdminClient();

  const { data: person, error: lookupError } = await admin
    .from("sa_people")
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

  const authResult = await createOrReuseAuthUser(admin, email, password);
  if ("error" in authResult) return authResult;
  const { authUserId, isNewUser } = authResult;

  const { error: updateError } = await admin
    .from("sa_people")
    .update({ auth_user_id: authUserId, invite_status: "canjeada" })
    .eq("id", person.id);

  if (updateError) {
    if (isNewUser) await admin.auth.admin.deleteUser(authUserId);
    return { error: "No pudimos activar tu cuenta. Intenta de nuevo." };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    redirect(planCode ? `/iniciar-sesion?planCode=${planCode}` : "/iniciar-sesion?activada=1");
  }

  if (planCode) {
    const { data: planId } = await supabase.rpc("sa_join_plan_by_code", { code: planCode });
    if (planId) redirect(`/planes/${planId}`);
  }

  redirect("/panel");
}

const planRegisterSchema = z
  .object({
    fullName: z.string().trim().min(2, "Ingresa tu nombre."),
    email: z.string().trim().toLowerCase().email("Ingresa un correo válido."),
    password: z.string().min(8, "La contraseña debe tener mínimo 8 caracteres."),
    confirmPassword: z.string(),
    planCode: z.string().trim().min(4, "El link del plan no es válido.").toUpperCase(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

/**
 * Registro directo desde el link de un plan: el código del plan es la
 * autorización (lo comparte quien organiza, a quien quiera), así que no
 * hace falta que el admin haya agregado antes a la persona en /admin/personas.
 */
export async function registerViaPlanCode(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = planRegisterSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    planCode: formData.get("planCode"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { fullName, email, password, planCode } = parsed.data;
  const admin = createAdminClient();

  const { data: plan } = await admin
    .from("sa_plans")
    .select("id")
    .eq("join_code", planCode)
    .eq("status", "abierto")
    .maybeSingle();

  if (!plan) {
    return { error: "Ese link de plan no es válido o el plan ya se cerró." };
  }

  const { data: existingPerson } = await admin
    .from("sa_people")
    .select("id, invite_status, auth_user_id")
    .eq("email", email)
    .maybeSingle();

  if (existingPerson?.invite_status === "canjeada" || existingPerson?.auth_user_id) {
    return { error: "Ya existe una cuenta con ese correo. Inicia sesión." };
  }

  const authResult = await createOrReuseAuthUser(admin, email, password);
  if ("error" in authResult) return authResult;
  const { authUserId, isNewUser } = authResult;

  let personId = existingPerson?.id ?? null;

  if (personId) {
    const { error: updateError } = await admin
      .from("sa_people")
      .update({ auth_user_id: authUserId, invite_status: "canjeada" })
      .eq("id", personId);

    if (updateError) {
      if (isNewUser) await admin.auth.admin.deleteUser(authUserId);
      return { error: "No pudimos activar tu cuenta. Intenta de nuevo." };
    }
  } else {
    const { data: newPerson, error: insertError } = await admin
      .from("sa_people")
      .insert({
        full_name: fullName,
        email,
        role: "member",
        invite_code: generateInviteCode(),
        invite_status: "canjeada",
        auth_user_id: authUserId,
      })
      .select("id")
      .single();

    if (insertError || !newPerson) {
      if (isNewUser) await admin.auth.admin.deleteUser(authUserId);
      return { error: "No pudimos crear tu cuenta. Intenta de nuevo." };
    }

    personId = newPerson.id;
  }

  await admin
    .from("sa_plan_participants")
    .insert({ plan_id: plan.id, person_id: personId, share_weight: 1 });

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

  if (signInError) {
    redirect(`/iniciar-sesion?planCode=${planCode}`);
  }

  redirect(`/planes/${plan.id}`);
}
