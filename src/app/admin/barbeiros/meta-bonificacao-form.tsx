"use client";

import { useActionState, useRef } from "react";
import { atualizarMetaBonificacao, type BarbeiroState } from "@/lib/actions/barbeiros";

const estadoInicial: BarbeiroState = {};

export function MetaBonificacaoForm({
  barbeiroId,
  metaFaturamentoCentavos,
  bonificacaoCentavos,
}: {
  barbeiroId: string;
  metaFaturamentoCentavos: number | null;
  bonificacaoCentavos: number | null;
}) {
  const acaoComId = atualizarMetaBonificacao.bind(null, barbeiroId);
  const [estado, formAction, pendente] = useActionState(acaoComId, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs text-slate-400 dark:text-slate-500 mb-1">Meta de faturamento/mês (R$)</label>
        <input
          name="meta"
          placeholder="sem meta"
          defaultValue={metaFaturamentoCentavos !== null ? (metaFaturamentoCentavos / 100).toFixed(2).replace(".", ",") : ""}
          className="w-32 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-400 dark:text-slate-500 mb-1">Bonificação ao bater a meta (R$)</label>
        <input
          name="bonificacao"
          placeholder="sem bônus"
          defaultValue={bonificacaoCentavos !== null ? (bonificacaoCentavos / 100).toFixed(2).replace(".", ",") : ""}
          className="w-32 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pendente}
        className="text-sm text-blue-600 hover:underline disabled:opacity-60 py-1.5"
      >
        {pendente ? "..." : "Salvar"}
      </button>
      {estado.erro && <p className="text-red-600 text-xs w-full">{estado.erro}</p>}
    </form>
  );
}
