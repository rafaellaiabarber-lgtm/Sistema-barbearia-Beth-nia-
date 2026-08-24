"use client";

import { useActionState, useState } from "react";
import { editarComissaoServico, type EditarComissaoServicoState } from "@/lib/actions/atendimentos";

const estadoInicial: EditarComissaoServicoState = {};

export function EditarComissaoServico({
  atendimentoServicoId,
  valorAtualCentavos,
}: {
  atendimentoServicoId: string;
  valorAtualCentavos: number;
}) {
  const [aberto, setAberto] = useState(false);
  const acao = editarComissaoServico.bind(null, atendimentoServicoId);
  const [estado, formAction, pendente] = useActionState(acao, estadoInicial);

  if (estado.sucesso) {
    return <span className="text-green-600 dark:text-green-400 text-xs">Corrigido ✓</span>;
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 text-xs"
      >
        Corrigir valor
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <label className="text-xs text-slate-500 dark:text-slate-400">Valor base do serviço (R$)</label>
      <input
        name="valor"
        required
        defaultValue={(valorAtualCentavos / 100).toFixed(2).replace(".", ",")}
        className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-2 py-1 text-xs w-20"
      />
      <button
        type="submit"
        disabled={pendente}
        className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-2 py-1 text-xs"
      >
        {pendente ? "Salvando..." : "Salvar"}
      </button>
      <button type="button" onClick={() => setAberto(false)} className="text-slate-400 dark:text-slate-500 text-xs">
        Cancelar
      </button>
      {estado.erro && <p className="text-red-600 text-xs w-full">{estado.erro}</p>}
    </form>
  );
}
