"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { generateInviteCode } from "@/lib/invite-code";

export interface ActionState {
  error?: string;
  success?: string;
}

const personSchema = z.object({
  fullName: z.string().trim().min(2, "El nombre es muy corto."),
  email: z.string().trim().toLowerCase().email("Ingresa un correo válido."),
});

export async function createPerson(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = personSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();

  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await supabase.from("people").insert({
      full_name: parsed.data.fullName,
      email: parsed.data.email,
      invite_code: generateInviteCode(),
    });

    if (!error) {
      revalidatePath("/admin/personas");
      return { success: "Persona agregada. Comparte su código de invitación." };
    }

    if (error.code === "23505" && error.message.includes("invite_code")) {
      continue; // colisión de código, reintenta
    }

    if (error.code === "23505") {
      return { error: "Ya existe una persona con ese correo." };
    }

    return { error: "No se pudo agregar. Intenta de nuevo." };
  }

  return { error: "No se pudo generar un código único. Intenta de nuevo." };
}

export async function regenerateInviteCode(personId: string): Promise<ActionState> {
  await requireAdmin();
  const supabase = await createClient();

  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await supabase
      .from("people")
      .update({ invite_code: generateInviteCode() })
      .eq("id", personId)
      .eq("invite_status", "pendiente");

    if (!error) {
      revalidatePath("/admin/personas");
      return { success: "Código regenerado." };
    }
    if (!(error.code === "23505" && error.message.includes("invite_code"))) {
      return { error: "No se pudo regenerar el código." };
    }
  }

  return { error: "No se pudo generar un código único." };
}

export async function deletePerson(personId: string): Promise<ActionState> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("people").delete().eq("id", personId);

  if (error) {
    return {
      error:
        "No se pudo eliminar. Es posible que esta persona ya tenga gastos o planes asociados.",
    };
  }

  revalidatePath("/admin/personas");
  return { success: "Persona eliminada." };
}
