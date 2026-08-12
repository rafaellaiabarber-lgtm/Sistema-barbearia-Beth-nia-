"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { Produto } from "@prisma/client";
import { atualizarProduto, alternarAtivoProduto, excluirProduto, type ProdutoState } from "@/lib/actions/produtos";
import { formatarReais } from "@/lib/format";

const estadoInicial: ProdutoState = {};

export function ProdutoRow({ produto }: { produto: Produto }) {
  const [editando, setEditando] = useState(false);
  const acaoComId = atualizarProduto.bind(null, produto.id);
  const [estado, formAction, pendente] = useActionState(acaoComId, estadoInicial);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (estado.sucesso) setEditando(false);
  }, [estado]);

  useEffect(() => {
    if (editando) rowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [editando]);

  const margemCentavos = produto.precoCentavos - produto.custoCentavos;

  return (
    <div
      ref={rowRef}
      className={`flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm scroll-mt-20 ${
        !produto.ativo ? "opacity-50" : ""
      }`}
    >
      {editando ? (
        <form action={formAction} className="flex flex-wrap items-end gap-3 w-full">
          <div className="w-full sm:w-auto">
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Nome</label>
            <input
              name="nome"
              required
              defaultValue={produto.nome}
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-full sm:w-40"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Preço (R$)</label>
            <input
              name="preco"
              required
              defaultValue={(produto.precoCentavos / 100).toFixed(2).replace(".", ",")}
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-24"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Custo (R$)</label>
            <input
              name="custo"
              defaultValue={(produto.custoCentavos / 100).toFixed(2).replace(".", ",")}
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-24"
            />
          </div>
          <button
            type="submit"
            disabled={pendente}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-3 py-2"
          >
            {pendente ? "Salvando..." : "Salvar"}
          </button>
          <button
            type="button"
            onClick={() => setEditando(false)}
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 px-2 py-2"
          >
            Cancelar
          </button>
          {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
        </form>
      ) : (
        <>
          <div>
            <p className="font-semibold">{produto.nome}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              preço {formatarReais(produto.precoCentavos)} · custo {formatarReais(produto.custoCentavos)} · margem{" "}
              <span className={margemCentavos < 0 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                {formatarReais(margemCentavos)}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600"
            >
              Editar
            </button>
            <form action={alternarAtivoProduto.bind(null, produto.id, !produto.ativo)}>
              <button className="text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600">
                {produto.ativo ? "Desativar" : "Ativar"}
              </button>
            </form>
            <form action={excluirProduto.bind(null, produto.id)}>
              <button className="text-sm text-slate-400 dark:text-slate-500 hover:text-red-600">Excluir</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
