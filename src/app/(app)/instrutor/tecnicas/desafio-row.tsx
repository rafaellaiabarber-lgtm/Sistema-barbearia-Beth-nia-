"use client";

import { useTransition } from "react";
import { alternarDesafioAtivo, excluirDesafio } from "@/lib/actions/cronometro";

export function DesafioRow({
  desafio,
  conquistaram,
}: {
  desafio: { id: string; titulo: string; metaMinutos: number; diasSeguidos: number; ativo: boolean; tecnicaNome: string | null };
  conquistaram: string[];
}) {
  const [pendente, startTransition] = useTransition();
  return (
    <div
      className={`bg-neutral-900 border border-neutral-800 rounded-xl p-3 shadow-sm flex flex-wrap items-center gap-3 ${
        desafio.ativo ? "" : "opacity-60"
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{desafio.titulo}</p>
        <p className="text-xs text-neutral-400">
          {desafio.diasSeguidos} dias seguidos com média abaixo de {desafio.metaMinutos} min ·{" "}
          {desafio.tecnicaNome ?? "qualquer corte"}
          {conquistaram.length > 0 && ` · conquistado por ${conquistaram.join(", ")}`}
        </p>
      </div>
      <div className="flex gap-3 text-xs">
        <button
          type="button"
          disabled={pendente}
          onClick={() => startTransition(() => alternarDesafioAtivo(desafio.id, !desafio.ativo))}
          className="text-neutral-500 hover:underline"
        >
          {desafio.ativo ? "Desativar" : "Ativar"}
        </button>
        <button
          type="button"
          disabled={pendente}
          onClick={() => {
            if (confirm("Excluir esse desafio?")) startTransition(() => excluirDesafio(desafio.id));
          }}
          className="text-red-600 hover:underline"
        >
          Excluir
        </button>
      </div>
    </div>
  );
}
