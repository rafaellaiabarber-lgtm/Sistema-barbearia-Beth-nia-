"use client";

import { useActionState } from "react";
import { atualizarDuracaoServico, type ServicoState } from "@/lib/actions/servicos";

const estadoInicial: ServicoState = {};

export function DuracaoServicoForm({ servicoId, duracaoMinutos }: { servicoId: string; duracaoMinutos: number }) {
  const acaoComId = atualizarDuracaoServico.bind(null, servicoId);
  const [estado, formAction, pendente] = useActionState(acaoComId, estadoInicial);

  return (
    <form action={formAction} className="flex items-center gap-1.5">
      <input
        name="duracao"
        type="number"
        min={1}
        defaultValue={duracaoMinutos}
        className="w-16 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-2 py-1 text-xs"
      />
      <span className="text-xs text-neutral-400 dark:text-neutral-500">min</span>
      <button
        type="submit"
        disabled={pendente}
        className="text-xs text-orange-600 dark:text-orange-400 hover:underline disabled:opacity-60"
      >
        {pendente ? "..." : "Salvar"}
      </button>
      {estado.erro && <p className="text-red-600 text-xs">{estado.erro}</p>}
    </form>
  );
}
