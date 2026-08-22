"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { regenerateInviteCode, deletePerson } from "@/app/actions/personas";
import { ShareInviteButton } from "@/components/admin/share-invite-button";
import type { Person } from "@/lib/types";

export function PersonaRow({ person }: { person: Person }) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const redeemed = person.invite_status === "canjeada";

  function copyCode() {
    navigator.clipboard.writeText(person.invite_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleRegenerate() {
    startTransition(() => {
      void regenerateInviteCode(person.id);
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
          <p className="text-sm text-ink-soft">{person.email}</p>
        </div>
        {person.role === "admin" && <Badge tone="sun">Admin</Badge>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {redeemed ? (
          <Badge tone="primary">✓ Cuenta activa</Badge>
        ) : (
          <>
            <button
              type="button"
              onClick={copyCode}
              className="rounded-full bg-surface-muted px-3 py-1.5 font-mono text-sm font-bold tracking-widest text-ink-soft transition-colors hover:bg-sun-100 hover:text-sun-800"
              title="Copiar código"
            >
              {copied ? "¡Copiado!" : person.invite_code}
            </button>
            <ShareInviteButton fullName={person.full_name} inviteCode={person.invite_code} />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={handleRegenerate}
            >
              Regenerar
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
