"use client";

import { useState, useTransition } from "react";
import { corrigirComissaoAtendimentosCobertos } from "@/lib/actions/atendimentos";

export function CorrigirComissaoCobertaButton() {
  const [pendente, iniciarTransicao] = useTransition();
  const [resultado, setResultado] = useState<number | null>(null);

  function corrigir() {
    iniciarTransicao(async () => {
      const estado = await corrigirComissaoAtendimentosCobertos();
      setResultado(estado.corrigidos ?? 0);
    });
  }

  if (resultado !== null) {
    return (
      <p className="text-sm text-green-600 dark:text-green-400 mb-4">
        {resultado === 0
          ? "Nenhum atendimento antigo precisava de correção."
          : `${resultado} atendimento(s) antigo(s) corrigido(s) — a comissão já reflete o valor normal do serviço.`}
      </p>
    );
  }

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={corrigir}
        disabled={pendente}
        className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-60"
      >
        {pendente ? "Corrigindo..." : "Corrigir comissão de atendimentos antigos cobertos pela assinatura"}
      </button>
      <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
        Corrige de uma vez só os atendimentos cobertos pela assinatura que ficaram com comissão zerada antes
        dessa correção existir, usando o preço atual do serviço.
      </p>
    </div>
  );
}
