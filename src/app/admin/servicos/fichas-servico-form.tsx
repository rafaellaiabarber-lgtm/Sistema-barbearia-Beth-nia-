"use client";

import { useActionState, useRef } from "react";
import { atualizarFichasServico, type ServicoState } from "@/lib/actions/servicos";

const estadoInicial: ServicoState = {};

export function FichasServicoForm({ servicoId, fichas }: { servicoId: string; fichas: number }) {
  const acaoComId = atualizarFichasServico.bind(null, servicoId);
  const [estado, formAction, pendente] = useActionState(acaoComId, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={formAction} className="flex items-center gap-1.5">
      <input
        name="fichas"
        type="number"
        min={0}
        defaultValue={fichas || undefined}
        placeholder="0"
        className="w-16 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-2 py-1 text-xs"
      />
      <button
        type="submit"
        disabled={pendente}
        className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-60"
      >
        {pendente ? "..." : "Salvar"}
      </button>
      {estado.erro && <p className="text-red-600 text-xs">{estado.erro}</p>}
    </form>
  );
}
