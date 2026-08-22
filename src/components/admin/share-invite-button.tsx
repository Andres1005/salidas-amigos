"use client";

import { Button } from "@/components/ui/button";

export function ShareInviteButton({
  fullName,
  inviteCode,
  className,
}: {
  fullName: string;
  inviteCode: string;
  className?: string;
}) {
  async function share() {
    const url = `${window.location.origin}/registro?codigo=${encodeURIComponent(inviteCode)}`;
    const text = `¡Hola ${fullName.split(" ")[0]}! Te agrego a Salidas Amigos 🌴\n\nActiva tu cuenta con este link:\n${url}\n\nCódigo por si te lo pide: ${inviteCode}`;

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // el usuario cerró el share sheet
      }
      return;
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={share} className={className}>
      📲 Compartir
    </Button>
  );
}
