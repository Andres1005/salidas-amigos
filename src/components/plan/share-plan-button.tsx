"use client";

export function SharePlanButton({ planName, code }: { planName: string; code: string }) {
  async function share() {
    const url = `${window.location.origin}/planes/unirse`;
    const text = `¡Ey! Te agrego al parche "${planName}" 🎉\n\nÚnete en Salidas Amigos con el código: ${code}\n${url}`;

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // el usuario cerró el share sheet, no hacemos nada
      }
      return;
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <button
      type="button"
      onClick={share}
      className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-white/25"
    >
      📲 Compartir por WhatsApp
    </button>
  );
}
