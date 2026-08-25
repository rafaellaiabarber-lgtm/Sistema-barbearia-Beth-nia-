"use client";

import { useActionState, useRef, useEffect } from "react";
import { criarServico, type ServicoState } from "@/lib/actions/servicos";

const estadoInicial: ServicoState = {};

export function NovoServicoForm() {
  const [estado, formAction, pendente] = useActionState(criarServico, estadoInicial);
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
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 mb-6 flex flex-wrap items-end gap-3 shadow-sm"
    >
      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Nome</label>
        <input
          name="nome"
          required
          className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-48"
        />
      </div>
      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Preço (R$)</label>
        <input
          name="preco"
          required
          placeholder="40,00"
          className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-28"
        />
      </div>
      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Custo (R$, opcional)</label>
        <input
          name="custo"
          placeholder="0,00"
          className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-28"
        />
      </div>
      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Duração (min)</label>
        <input
          name="duracao"
          type="number"
          defaultValue={30}
          className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-24"
        />
      </div>
      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Comissão (%, opcional)</label>
        <input
          name="comissao"
          type="number"
          min={0}
          max={100}
          placeholder="usa a do barbeiro"
          className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-32"
        />
      </div>
      <button
        type="submit"
        disabled={pendente}
        className="rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-semibold px-4 py-2 text-sm"
      >
        {pendente ? "Adicionando..." : "Adicionar serviço"}
      </button>
      {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
    </form>
  );
}
