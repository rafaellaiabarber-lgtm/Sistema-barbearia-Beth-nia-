"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Mostra o endereço completo de uma página do app com botão de copiar. */
export function CopiarLink({ caminho, texto }: { caminho: string; texto?: (url: string) => string }) {
  const [copiado, setCopiado] = useState(false);
  const url = typeof window === "undefined" ? caminho : `${window.location.origin}${caminho}`;

  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 min-w-0 truncate rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-neutral-300" suppressHydrationWarning>
        {url}
      </code>
      <button
        type="button"
        onClick={() => {
          const completo = `${window.location.origin}${caminho}`;
          navigator.clipboard.writeText(texto ? texto(completo) : completo).then(() => {
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
          });
        }}
        className="shrink-0 flex items-center gap-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 px-3 py-2 text-sm font-semibold"
      >
        {copiado ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        {copiado ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}
