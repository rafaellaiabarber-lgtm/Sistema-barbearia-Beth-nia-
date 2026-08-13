"use client";

import { useActionState, useRef, useEffect } from "react";
import { criarProduto, type ProdutoState } from "@/lib/actions/produtos";

const estadoInicial: ProdutoState = {};

export function NovoProdutoForm() {
  const [estado, formAction, pendente] = useActionState(criarProduto, estadoInicial);
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
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Nome</label>
        <input
          name="nome"
          required
          placeholder="Pomada modeladora"
          className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-48"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Preço (R$)</label>
        <input
          name="preco"
          required
          placeholder="35,00"
          className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-28"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Custo (R$, opcional)</label>
        <input
          name="custo"
          placeholder="0,00"
          className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-28"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Comissão (%, opcional)</label>
        <input
          name="comissao"
          type="number"
          min={0}
          max={100}
          placeholder="sem comissão"
          className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-32"
        />
      </div>
      <button
        type="submit"
        disabled={pendente}
        className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-4 py-2 text-sm"
      >
        {pendente ? "Adicionando..." : "Adicionar produto"}
      </button>
      {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
    </form>
  );
}
