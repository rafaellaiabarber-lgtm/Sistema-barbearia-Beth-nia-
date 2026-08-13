"use client";

import { useActionState, useRef } from "react";
import { atualizarCustoServico, type ServicoState } from "@/lib/actions/servicos";

const estadoInicial: ServicoState = {};

export function CustoServicoForm({
  servicoId,
  custoCentavos,
}: {
  servicoId: string;
  custoCentavos: number;
}) {
  const acaoComId = atualizarCustoServico.bind(null, servicoId);
  const [estado, formAction, pendente] = useActionState(acaoComId, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={formAction} className="flex items-center gap-1.5">
      <span className="text-xs text-slate-400 dark:text-slate-500">R$</span>
      <input
        name="custo"
        defaultValue={(custoCentavos / 100).toFixed(2).replace(".", ",")}
        placeholder="0,00"
        className="w-16 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-2 py-1 text-xs"
      />
      <button
        type="submit"
        disabled={pendente}
        className="text-xs text-lime-600 dark:text-lime-400 hover:underline disabled:opacity-60"
      >
        {pendente ? "..." : "Salvar"}
      </button>
      {estado.erro && <p className="text-red-600 text-xs">{estado.erro}</p>}
    </form>
  );
}
