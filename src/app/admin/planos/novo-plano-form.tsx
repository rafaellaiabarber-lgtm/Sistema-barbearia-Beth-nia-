"use client";

import { useActionState, useEffect, useRef } from "react";
import { criarPlano, type PlanoState } from "@/lib/actions/planos";
import { NOMES_DIAS_SEMANA } from "@/lib/assinaturas";

const estadoInicial: PlanoState = {};

export function NovoPlanoForm() {
  const [estado, formAction, pendente] = useActionState(criarPlano, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.sucesso) {
      formRef.current?.reset();
    }
  }, [estado]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6 flex flex-wrap items-end gap-3 shadow-sm"
    >
      <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Nome do plano</label>
        <input
          name="nome"
          required
          placeholder="Ex: Plano Mensal"
          className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-48"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Preço mensal (R$)</label>
        <input
          name="preco"
          required
          placeholder="99,00"
          className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-28"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Serviços incluídos/mês</label>
        <input
          name="cota"
          type="number"
          min={1}
          required
          placeholder="4"
          className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-32"
        />
      </div>
      <div className="w-full">
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
          Dias que o plano cobre (deixe tudo desmarcado pra valer todo dia)
        </label>
        <div className="flex flex-wrap gap-2">
          {NOMES_DIAS_SEMANA.map((nome, i) => (
            <label
              key={i}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-600 px-2.5 py-1.5 text-sm cursor-pointer has-[:checked]:bg-lime-50 has-[:checked]:border-lime-400 dark:has-[:checked]:bg-lime-950"
            >
              <input type="checkbox" name="diasSemana" value={i} className="accent-lime-600" />
              {nome}
            </label>
          ))}
        </div>
      </div>
      <button
        type="submit"
        disabled={pendente}
        className="rounded-lg bg-lime-600 hover:bg-lime-700 disabled:opacity-60 text-slate-950 font-semibold px-4 py-2 text-sm"
      >
        {pendente ? "Adicionando..." : "Adicionar plano"}
      </button>
      {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
    </form>
  );
}
