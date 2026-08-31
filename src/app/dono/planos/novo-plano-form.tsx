"use client";

import { useActionState, useEffect, useRef } from "react";
import { criarPlanoPlataforma, type PlanoPlataformaState } from "@/lib/actions/planos-plataforma";

const estadoInicial: PlanoPlataformaState = {};

export function NovoPlanoForm() {
  const [estado, formAction, pendente] = useActionState(criarPlanoPlataforma, estadoInicial);
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
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 mb-4 flex flex-wrap items-end gap-3"
    >
      <div className="w-full sm:w-auto">
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Nome do plano</label>
        <input
          name="nome"
          required
          placeholder="Ex: Plano Mensal"
          className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-full sm:w-44"
        />
      </div>
      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Preço (R$)</label>
        <input
          name="preco"
          required
          placeholder="99,90"
          className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-24"
        />
      </div>
      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Período</label>
        <input
          name="periodo"
          required
          placeholder="mês"
          className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-24"
        />
      </div>
      <div className="w-full sm:w-auto sm:flex-1">
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Link de pagamento</label>
        <input
          name="linkPagamento"
          required
          placeholder="https://..."
          className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-full"
        />
      </div>
      <div className="w-full">
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Descrição (opcional)</label>
        <input
          name="descricao"
          placeholder="Ex: acesso completo ao sistema"
          className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-full"
        />
      </div>
      <button
        type="submit"
        disabled={pendente}
        className="rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2"
      >
        {pendente ? "Adicionando..." : "Adicionar plano"}
      </button>
      {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
    </form>
  );
}
