"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoRefresh({ intervaloMs = 20000 }: { intervaloMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      // Página em segundo plano (tela bloqueada, outra aba) não precisa buscar dados novos —
      // isso sozinho já respondia por boa parte do tráfego do banco de dados no plano gratuito.
      if (document.visibilityState === "visible") router.refresh();
    }, intervaloMs);
    return () => clearInterval(id);
  }, [router, intervaloMs]);

  return null;
}
