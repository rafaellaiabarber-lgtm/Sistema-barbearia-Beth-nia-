"use client";

import { useActionState, useEffect, useRef } from "react";
import { criarDespesaBarbeiro, type DespesaBarbeiroState } from "@/lib/actions/despesas-barbeiro";

const estadoInicial: DespesaBarbeiroState = {};

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

export function NovaDespesaForm() {
  const [estado, formAction, pendente] = useActionState(criarDespesaBarbeiro, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);
  const dataRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!estado.erro && !pendente) {
      formRef.current?.reset();
      if (dataRef.current) dataRef.current.value = hoje();
    }
  }, [estado, pendente]);

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 mb-6 shadow-sm">
      <p className="font-semibold text-neutral-800 dark:text-neutral-100 mb-3">Nova despesa</p>
      <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Descrição</label>
          <input
            name="descricao"
            required
            placeholder="Gasolina, pomada, almoço..."
            className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-56"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Valor (R$)</label>
          <input
            name="valor"
            required
            inputMode="decimal"
            placeholder="0,00"
            className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-28"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Data</label>
          <input
            ref={dataRef}
            name="data"
            type="date"
            required
            defaultValue={hoje()}
            className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={pendente}
          className="rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-semibold px-4 py-2 text-sm"
        >
          {pendente ? "Salvando..." : "Adicionar despesa"}
        </button>
        {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
      </form>
    </div>
  );
}
