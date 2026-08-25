"use client";

import { useState } from "react";

export function CopiarLinkButton({ url }: { url: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // clipboard indisponível (ex: sem HTTPS) — o link já aparece selecionável na tela
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className="text-sm rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold px-3 py-1.5"
    >
      {copiado ? "Copiado! ✓" : "Copiar link"}
    </button>
  );
}
