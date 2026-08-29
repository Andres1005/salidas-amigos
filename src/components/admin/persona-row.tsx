"use client";

import { useTransition } from "react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { approvePerson, rejectPerson, deletePerson } from "@/app/actions/personas";
import type { Person } from "@/lib/types";

export function PersonaRow({ person }: { person: Person }) {
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(() => {
      void approvePerson(person.id);
    });
  }

  function handleReject() {
    if (!confirm(`¿Rechazar la solicitud de ${person.full_name}?`)) return;
    startTransition(() => {
      void rejectPerson(person.id);
    });
  }

  function handleDelete() {
    if (!confirm(`¿Eliminar a ${person.full_name}? Esta acción no se puede deshacer.`)) return;
    startTransition(() => {
      void deletePerson(person.id);
    });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-4 rounded-2xl border border-ink/5 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <Avatar name={person.full_name} />
        <div>
          <p className="font-bold">{person.full_name}</p>
          {!person.is_guest && <p className="text-sm text-ink-soft">{person.email}</p>}
        </div>
        {person.role === "admin" && <Badge tone="sun">Admin</Badge>}
        {person.is_guest && <Badge tone="neutral">Sin cuenta</Badge>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!person.is_guest && person.status === "pendiente" && (
          <>
            <Badge tone="sun">Pendiente de aprobación</Badge>
            <Button type="button" size="sm" disabled={isPending} onClick={handleApprove}>
              Aprobar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={handleReject}
              className="text-coral-600 hover:bg-coral-50"
            >
              Rechazar
            </Button>
          </>
        )}

        {!person.is_guest && person.status === "aprobado" && <Badge tone="primary">✓ Activo</Badge>}

        {person.status === "rechazado" && (
          <>
            <Badge tone="neutral">Rechazada</Badge>
            <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={handleApprove}>
              Aprobar de todos modos
            </Button>
          </>
        )}

        {person.role !== "admin" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={handleDelete}
            className="text-coral-600 hover:bg-coral-50"
          >
            Eliminar
          </Button>
        )}
      </div>
    </motion.div>
  );
}
