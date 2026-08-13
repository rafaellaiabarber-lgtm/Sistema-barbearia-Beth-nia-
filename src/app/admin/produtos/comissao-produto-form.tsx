"use client";

import { useActionState, useRef } from "react";
import { atualizarComissaoProduto, type ProdutoState } from "@/lib/actions/produtos";

const estadoInicial: ProdutoState = {};

export function ComissaoProdutoForm({
  produtoId,
  comissaoPercentual,
}: {
  produtoId: string;
  comissaoPercentual: number | null;
}) {
  const acaoComId = atualizarComissaoProduto.bind(null, produtoId);
  const [estado, formAction, pendente] = useActionState(acaoComId, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={formAction} className="flex items-center gap-1.5">
      <input
        name="comissao"
        type="number"
        min={0}
        max={100}
        defaultValue={comissaoPercentual ?? undefined}
        placeholder="sem comissão"
        className="w-16 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-2 py-1 text-xs"
      />
      <span className="text-xs text-slate-400 dark:text-slate-500">%</span>
      <button
        type="submit"
        disabled={pendente}
        className="text-xs text-lime-600 dark:text-lime-400 hover:underline disabled:opacity-60"
      >
        {pendente ? "..." : "Salvar"}
      </button>
      {estado.erro && <p className="text-red-600 text-xs">{estado.erro}</p>}
    </form>
  );
}
