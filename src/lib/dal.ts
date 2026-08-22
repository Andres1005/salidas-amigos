import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Person } from "@/lib/types";

/**
 * Resolves the signed-in Supabase auth user to their `people` row.
 * Memoized per request so it can be called from many places without
 * re-querying. Returns null when there's no session or no matching person.
 */
export const getCurrentPerson = cache(async (): Promise<Person | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: person } = await supabase
    .from("sa_people")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return person as Person | null;
});

export async function requirePerson(): Promise<Person> {
  const person = await getCurrentPerson();
  // El proxy ya garantiza que hay una sesión de Supabase Auth válida aquí.
  // Si no hay persona vinculada, es una cuenta de Auth sin fila en
  // sa_people (puede pasar si este proyecto de Supabase es compartido con
  // otra app) — no un caso de "no ha iniciado sesión".
  if (!person) redirect("/sin-acceso");
  return person;
}

export async function requireAdmin(): Promise<Person> {
  const person = await requirePerson();
  if (person.role !== "admin") redirect("/panel");
  return person;
}
