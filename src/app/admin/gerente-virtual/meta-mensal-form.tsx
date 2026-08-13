"use client";

import { useActionState } from "react";
import { atualizarMetaFaturamentoMensal } from "@/lib/actions/caixa";
import type { ConfiguracaoFinanceiraState } from "@/lib/actions/caixa";

const estadoInicial: ConfiguracaoFinanceiraState = {};

export function MetaMensalForm({ metaAtual }: { metaAtual: number | null }) {
  const [estado, formAction, pendente] = useActionState(atualizarMetaFaturamentoMensal, estadoInicial);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
      <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Meta de faturamento mensal (R$)</label>
        <input
          name="meta"
          placeholder="35000,00"
          defaultValue={metaAtual !== null ? (metaAtual / 100).toFixed(2).replace(".", ",") : ""}
          className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-40"
        />
      </div>
      <button
        type="submit"
        disabled={pendente}
        className="rounded-lg bg-lime-600 hover:bg-lime-700 disabled:opacity-60 text-slate-950 text-sm font-semibold px-4 py-2"
      >
        {pendente ? "Salvando..." : "Salvar meta"}
      </button>
      {estado.sucesso && <p className="text-green-600 text-sm">Meta atualizada!</p>}
      {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
    </form>
  );
}
