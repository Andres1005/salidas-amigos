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
    // Si la cuenta todavía no está aprobada esto no hace nada (RLS lo
    // bloquea silenciosamente); una vez aprobada, requirePerson() ya
    // manda a la persona a su panel normal.
    await supabase.rpc("sa_join_plan_by_code", { code: planCode });
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
): Promise<{ authUserId: string } | { error: string }> {
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (created.user) {
    return { authUserId: created.user.id };
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

  return { authUserId: existingUser.id };
}

const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Ingresa tu nombre."),
    email: z.string().trim().toLowerCase().email("Ingresa un correo válido."),
    password: z.string().min(8, "La contraseña debe tener mínimo 8 caracteres."),
    confirmPassword: z.string(),
    planCode: z.string().trim().toUpperCase().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

/**
 * Único flujo de registro: nombre, correo y contraseña, sin códigos. Una
 * persona nueva queda con status 'pendiente' hasta que el admin la
 * aprueba desde /admin/personas — puede iniciar sesión, pero no ve nada
 * hasta entonces (lo bloquea requirePerson()). Si venía del link de un
 * plan, queda asociada a ese plan de una vez para que aparezca apenas
 * la aprueben.
 */
export async function register(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    planCode: formData.get("planCode") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { fullName, email, password, planCode } = parsed.data;
  const admin = createAdminClient();

  let planId: string | null = null;
  if (planCode) {
    const { data: plan } = await admin
      .from("sa_plans")
      .select("id")
      .eq("join_code", planCode)
      .eq("status", "abierto")
      .maybeSingle();
    planId = plan?.id ?? null;
  }

  const { data: existingPerson } = await admin
    .from("sa_people")
    .select("id, status, auth_user_id")
    .eq("email", email)
    .maybeSingle();

  if (existingPerson?.auth_user_id) {
    return { error: "Ya existe una cuenta con ese correo. Inicia sesión." };
  }

  const authResult = await createOrReuseAuthUser(admin, email, password);
  if ("error" in authResult) return authResult;
  const { authUserId } = authResult;

  let personId = existingPerson?.id ?? null;

  if (personId) {
    const { error: updateError } = await admin
      .from("sa_people")
      .update({ auth_user_id: authUserId })
      .eq("id", personId);

    if (updateError) return { error: "No pudimos crear tu cuenta. Intenta de nuevo." };
  } else {
    const { data: newPerson, error: insertError } = await admin
      .from("sa_people")
      .insert({
        full_name: fullName,
        email,
        role: "member",
        status: "pendiente",
        invite_code: generateInviteCode(),
        auth_user_id: authUserId,
      })
      .select("id")
      .single();

    if (insertError || !newPerson) {
      return { error: "No pudimos crear tu cuenta. Intenta de nuevo." };
    }

    personId = newPerson.id;
  }

  if (planId) {
    await admin
      .from("sa_plan_participants")
      .insert({ plan_id: planId, person_id: personId, share_weight: 1 });
  }

  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email, password });

  redirect("/panel");
}
