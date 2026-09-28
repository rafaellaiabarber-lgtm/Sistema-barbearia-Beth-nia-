"use client";

import { useState, useTransition } from "react";
import { classificarServicosPorNome } from "@/lib/actions/servicos";

export function ClassificarServicosButton() {
  const [pendente, iniciarTransicao] = useTransition();
  const [resultado, setResultado] = useState<number | null>(null);

  function classificar() {
    iniciarTransicao(async () => {
      const estado = await classificarServicosPorNome();
      setResultado(estado.alterados ?? 0);
    });
  }

  if (resultado !== null) {
    return (
      <p className="text-sm text-green-600 dark:text-green-400 mb-4">
        {resultado === 0
          ? "Todos os serviços já estavam classificados certinho."
          : `${resultado} serviço(s) reclassificado(s) — confira abaixo e ajusta com "Marcar como extra/principal" se algum ficou errado.`}
      </p>
    );
  }

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={classificar}
        disabled={pendente}
        className="text-sm text-orange-600 dark:text-orange-400 hover:underline disabled:opacity-60"
      >
        {pendente ? "Classificando..." : "Classificar serviços automaticamente (Corte/Barba = principal, resto = extra)"}
      </button>
      <p className="text-neutral-400 dark:text-neutral-500 text-xs mt-1">
        Marca como &quot;principal&quot; qualquer serviço com &quot;corte&quot; ou &quot;barba&quot; no nome (avulso ou do
        plano) e como &quot;extra&quot; todos os outros — usado no resumo dos 3 motores.
      </p>
    </div>
  );
}
