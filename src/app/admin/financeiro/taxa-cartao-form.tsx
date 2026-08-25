"use client";

import { useActionState } from "react";
import { atualizarTaxaCartao, type ConfiguracaoFinanceiraState } from "@/lib/actions/caixa";
import { percentualX100ParaValor } from "@/lib/format";

const estadoInicial: ConfiguracaoFinanceiraState = {};

export function TaxaCartaoForm({ taxaCartaoPercentualX100 }: { taxaCartaoPercentualX100: number | null }) {
  const [estado, formAction, pendente] = useActionState(atualizarTaxaCartao, estadoInicial);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs text-neutral-400 dark:text-neutral-500 mb-1">Taxa da maquininha (%)</label>
        <input
          name="taxaCartao"
          placeholder="sem taxa definida"
          defaultValue={taxaCartaoPercentualX100 !== null ? percentualX100ParaValor(taxaCartaoPercentualX100) : ""}
          className="w-40 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pendente}
        className="text-sm text-orange-600 dark:text-orange-400 hover:underline disabled:opacity-60 py-1.5"
      >
        {pendente ? "..." : "Salvar"}
      </button>
      {estado.erro && <p className="text-red-600 text-xs w-full">{estado.erro}</p>}
    </form>
  );
}
