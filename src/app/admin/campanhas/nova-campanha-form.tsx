"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { Barbeiro, Produto, Servico } from "@prisma/client";
import { criarCampanha, type CampanhaState } from "@/lib/actions/campanhas";

const estadoInicial: CampanhaState = {};

type ItemForm = { selecao: string; quantidade: string };
const ITEM_VAZIO: ItemForm = { selecao: "", quantidade: "1" };

export function NovaCampanhaForm({
  barbeiros,
  produtos,
  servicos,
}: {
  barbeiros: Barbeiro[];
  produtos: Produto[];
  servicos: Servico[];
}) {
  const [estado, formAction, pendente] = useActionState(criarCampanha, estadoInicial);
  const [itens, setItens] = useState<ItemForm[]>([ITEM_VAZIO]);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!estado.erro && !pendente) {
      formRef.current?.reset();
      setItens([{ ...ITEM_VAZIO }]);
    }
  }, [estado, pendente]);

  function atualizar(i: number, campo: keyof ItemForm, valor: string) {
    setItens((atual) => atual.map((item, idx) => (idx === i ? { ...item, [campo]: valor } : item)));
  }

  function remover(i: number) {
    setItens((atual) => atual.filter((_, idx) => idx !== i));
  }

  function adicionar() {
    setItens((atual) => [...atual, { ...ITEM_VAZIO }]);
  }

  if (produtos.length === 0 && servicos.length === 0) return null;

  return (
    <details className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6 shadow-sm">
      <summary className="cursor-pointer font-semibold text-slate-800 dark:text-slate-100 select-none">
        Nova campanha
      </summary>
      <form ref={formRef} action={formAction} className="mt-4">
        <div className="flex flex-wrap items-end gap-3 mb-4">
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
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Título (opcional)</label>
            <input
              name="titulo"
              placeholder="Ex: Kit inverno"
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-48"
            />
          </div>
        </div>

        <p className="text-slate-700 dark:text-slate-200 text-sm font-semibold mb-2">O que precisa vender:</p>
        <div className="space-y-2 mb-2">
          {itens.map((item, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2">
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Item {i + 1}</label>
                <select
                  name="itemSelecao"
                  required
                  value={item.selecao}
                  onChange={(e) => atualizar(i, "selecao", e.target.value)}
                  className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-sm w-56"
                >
                  <option value="" disabled>
                    Escolha
                  </option>
                  {produtos.length > 0 && (
                    <optgroup label="Produtos">
                      {produtos.map((p) => (
                        <option key={p.id} value={`produto:${p.id}`}>
                          {p.nome}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {servicos.length > 0 && (
                    <optgroup label="Serviços">
                      {servicos.map((s) => (
                        <option key={s.id} value={`servico:${s.id}`}>
                          {s.nome}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Quantidade</label>
                <input
                  name="itemQuantidade"
                  type="number"
                  min={1}
                  required
                  value={item.quantidade}
                  onChange={(e) => atualizar(i, "quantidade", e.target.value)}
                  className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-sm w-20"
                />
              </div>
              {itens.length > 1 && (
                <button
                  type="button"
                  onClick={() => remover(i)}
                  className="text-slate-400 dark:text-slate-500 hover:text-red-600 text-sm py-1.5"
                >
                  Remover
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={adicionar} className="text-blue-600 hover:underline text-sm mb-4 block">
          + Adicionar item
        </button>

        {estado.erro && <p className="text-red-600 text-sm mb-3">{estado.erro}</p>}

        <button
          type="submit"
          disabled={pendente}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-4 py-2 text-sm"
        >
          {pendente ? "Criando..." : "Criar campanha"}
        </button>
      </form>
    </details>
  );
}
