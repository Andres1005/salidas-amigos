"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export interface ActionState {
  error?: string;
  success?: string;
}

export async function approvePerson(personId: string): Promise<ActionState> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("sa_people")
    .update({ status: "aprobado" })
    .eq("id", personId);

  if (error) return { error: "No se pudo aprobar." };

  revalidatePath("/admin/personas");
  revalidatePath("/panel");
  return { success: "Persona aprobada." };
}

export async function rejectPerson(personId: string): Promise<ActionState> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("sa_people")
    .update({ status: "rechazado" })
    .eq("id", personId);

  if (error) return { error: "No se pudo rechazar." };

  revalidatePath("/admin/personas");
  return { success: "Solicitud rechazada." };
}

export async function deletePerson(personId: string): Promise<ActionState> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("sa_people").delete().eq("id", personId);

  if (error) {
    return {
      error:
        "No se pudo eliminar. Es posible que esta persona ya tenga gastos o planes asociados.",
    };
  }

  revalidatePath("/admin/personas");
  return { success: "Persona eliminada." };
}
