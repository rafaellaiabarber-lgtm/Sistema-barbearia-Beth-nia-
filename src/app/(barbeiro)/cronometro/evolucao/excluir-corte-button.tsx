"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { excluirRegistroCorte } from "@/lib/actions/cronometro";

export function ExcluirCorteButton({ id }: { id: string }) {
  const [pendente, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pendente}
      aria-label="Excluir corte"
      onClick={() => {
        if (confirm("Excluir esse corte do histórico?")) startTransition(() => excluirRegistroCorte(id));
      }}
      className="text-neutral-400 hover:text-red-600 disabled:opacity-50 p-1"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
