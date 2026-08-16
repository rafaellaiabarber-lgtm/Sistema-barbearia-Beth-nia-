"use client";

import { useActionState, useRef, useEffect } from "react";
import { criarOferta, type OfertaState } from "@/lib/actions/roleta";

const estadoInicial: OfertaState = {};

export function NovaOfertaForm() {
  const [estado, formAction, pendente] = useActionState(criarOferta, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!estado.erro && !pendente) {
      formRef.current?.reset();
    }
  }, [estado, pendente]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6 flex flex-wrap items-end gap-3 shadow-sm"
    >
      <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Nome do prêmio</label>
        <input
          name="nome"
          required
          placeholder="Pomada, 20% na barba..."
          className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-56"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Desconto (%, opcional)</label>
        <input
          name="desconto"
          type="number"
          min={1}
          max={100}
          placeholder="sem desconto"
          className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-36"
        />
      </div>
      <button
        type="submit"
        disabled={pendente}
        className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-4 py-2 text-sm"
      >
        {pendente ? "Adicionando..." : "Adicionar prêmio"}
      </button>
      {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
    </form>
  );
}
