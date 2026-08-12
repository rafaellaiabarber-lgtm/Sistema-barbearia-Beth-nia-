"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { Barbeiro, Produto } from "@prisma/client";
import { registrarVendaProduto, type VendaProdutoState } from "@/lib/actions/vendas-produto";
import { formatarReais } from "@/lib/format";
import { SeletorFormaPagamento } from "../../forma-pagamento-selector";

const estadoInicial: VendaProdutoState = {};

export function NovaVendaProdutoForm({ barbeiros, produtos }: { barbeiros: Barbeiro[]; produtos: Produto[] }) {
  const [estado, formAction, pendente] = useActionState(registrarVendaProduto, estadoInicial);
  const [produtoId, setProdutoId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const produtoSelectRef = useRef<HTMLSelectElement>(null);
  const produtoIdRef = useRef(produtoId);
  produtoIdRef.current = produtoId;

  useEffect(() => {
    if (estado.sucesso) {
      formRef.current?.reset();
      setProdutoId("");
      return;
    }
    if (estado.erro) {
      // React reseta os campos do <form> após a action rodar, mesmo em erro de validação.
      // Reaplica o valor controlado pra não perder a escolha do produto.
      if (produtoSelectRef.current) produtoSelectRef.current.value = produtoIdRef.current;
    }
  }, [estado]);

  const produtoSelecionado = produtos.find((p) => p.id === produtoId);

  if (produtos.length === 0) return null;

  return (
    <details className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6 shadow-sm">
      <summary className="cursor-pointer font-semibold text-slate-800 dark:text-slate-100 select-none">Nova venda de produto</summary>
      <form ref={formRef} action={formAction} className="mt-4">
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Produto</label>
            <select
              ref={produtoSelectRef}
              name="produtoId"
              required
              value={produtoId}
              onChange={(e) => setProdutoId(e.target.value)}
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-48"
            >
              <option value="" disabled>
                Escolha
              </option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} — {formatarReais(p.precoCentavos)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Barbeiro</label>
            <select
              name="barbeiroId"
              required
              defaultValue=""
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
            >
              <option value="" disabled>
                Escolha
              </option>
              {barbeiros.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Quantidade</label>
            <input
              name="quantidade"
              type="number"
              min={1}
              defaultValue={1}
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-20"
            />
          </div>
        </div>

        {produtoSelecionado && (
          <p className="text-blue-600 font-semibold mb-3">
            Preço unitário: {formatarReais(produtoSelecionado.precoCentavos)}
          </p>
        )}

        <p className="text-slate-700 dark:text-slate-200 text-sm font-semibold mb-2">Forma de pagamento:</p>
        <div className="mb-3 max-w-sm">
          <SeletorFormaPagamento />
        </div>

        {estado.erro && <p className="text-red-600 text-sm mb-3">{estado.erro}</p>}

        <button
          type="submit"
          disabled={pendente}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-4 py-2 text-sm"
        >
          {pendente ? "Registrando..." : "Registrar venda"}
        </button>
      </form>
    </details>
  );
}
