"use client";

import { useActionState, useState } from "react";
import { alterarVencimentoAssinatura, type AlterarVencimentoState } from "@/lib/actions/assinaturas";

const estadoInicial: AlterarVencimentoState = {};

export function EditarVencimento({ assinaturaId, diaAtual }: { assinaturaId: string; diaAtual: number }) {
  const [aberto, setAberto] = useState(false);
  const acao = alterarVencimentoAssinatura.bind(null, assinaturaId);
  const [estado, formAction, pendente] = useActionState(acao, estadoInicial);

  if (estado.sucesso) {
    return <span className="text-green-600 dark:text-green-400 text-sm">Vencimento alterado ✓</span>;
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="text-sm text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
      >
        Trocar vencimento
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input
        name="diaVencimento"
        type="number"
        min={1}
        max={31}
        required
        defaultValue={diaAtual}
        className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-sm w-16"
      />
      <button
        type="submit"
        disabled={pendente}
        className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-3 py-1.5 text-sm"
      >
        {pendente ? "Salvando..." : "Salvar"}
      </button>
      <button type="button" onClick={() => setAberto(false)} className="text-sm text-slate-400 dark:text-slate-500">
        Cancelar
      </button>
      {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
    </form>
  );
}
