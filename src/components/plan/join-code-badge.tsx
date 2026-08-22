"use client";

import { useState } from "react";

export function JoinCodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Copiar código para invitar a este plan"
      className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-white/25"
    >
      <span className="text-white/70">Código del plan</span>
      <span className="font-mono tracking-widest">{copied ? "¡Copiado!" : code}</span>
    </button>
  );
}
