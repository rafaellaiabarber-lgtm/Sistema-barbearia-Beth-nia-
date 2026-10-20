"use client";

import { useState, useTransition } from "react";
import { configurarPremiosPadrao } from "@/lib/actions/roleta";

export function ConfigurarPadraoButton() {
  const [pendente, iniciarTransicao] = useTransition();
  const [feito, setFeito] = useState(false);

  function configurar() {
    iniciarTransicao(async () => {
      await configurarPremiosPadrao();
      setFeito(true);
    });
  }

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={configurar}
        disabled={pendente}
        className="text-sm text-orange-600 dark:text-orange-400 hover:underline disabled:opacity-60"
      >
        {pendente ? "Configurando..." : "Usar prêmios padrão (sobrancelha, selagem, botox, hidratação, limpeza de pele, depilação nasal, produtos — 10% cada)"}
      </button>
      <p className="text-neutral-400 dark:text-neutral-500 text-xs mt-1">
        Desativa os prêmios atuais (sem apagar o histórico de giros já feitos) e cria esses 7 do zero, todos com
        10% de desconto — prontos pra combinar com um adesivo impresso da roleta.
      </p>
      {feito && (
        <p className="text-green-600 dark:text-green-400 text-xs mt-1">Prêmios padrão configurados — confira a lista abaixo.</p>
      )}
    </div>
  );
}
