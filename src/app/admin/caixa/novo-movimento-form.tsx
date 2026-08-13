"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { criarMovimentoCaixa, type MovimentoCaixaState } from "@/lib/actions/caixa";
import { SeletorFormaPagamento } from "../../forma-pagamento-selector";
import { LABEL_CATEGORIA_DESPESA } from "@/lib/format";

const estadoInicial: MovimentoCaixaState = {};

export function NovoMovimentoForm() {
  const [estado, formAction, pendente] = useActionState(criarMovimentoCaixa, estadoInicial);
  const [tipo, setTipo] = useState<"ENTRADA" | "SAIDA">("SAIDA");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!estado.erro && !pendente) {
      formRef.current?.reset();
      setTipo("SAIDA");
    }
  }, [estado, pendente]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6 shadow-sm"
    >
      <div className="flex flex-wrap items-end gap-3 mb-3">
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Tipo</label>
          <div className="flex rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600">
            <button
              type="button"
              onClick={() => setTipo("SAIDA")}
              className={`px-3 py-2 text-sm font-medium ${
                tipo === "SAIDA" ? "bg-red-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              }`}
            >
              Saída
            </button>
            <button
              type="button"
              onClick={() => setTipo("ENTRADA")}
              className={`px-3 py-2 text-sm font-medium ${
                tipo === "ENTRADA" ? "bg-green-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              }`}
            >
              Entrada
            </button>
          </div>
          <input type="hidden" name="tipo" value={tipo} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Descrição</label>
          <input
            name="descricao"
            required
            placeholder="Ex: compra de material, troco..."
            className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-56"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Valor (R$)</label>
          <input
            name="valor"
            required
            placeholder="20,00"
            className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-28"
          />
        </div>
        {tipo === "SAIDA" && (
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Categoria</label>
            <select
              name="categoria"
              required
              defaultValue=""
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
            >
              <option value="" disabled>
                Escolha
              </option>
              {Object.entries(LABEL_CATEGORIA_DESPESA).map(([valor, label]) => (
                <option key={valor} value={valor}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="mb-3">
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Forma de pagamento</label>
        <div className="max-w-sm">
          <SeletorFormaPagamento />
        </div>
      </div>

      <button
        type="submit"
        disabled={pendente}
        className="rounded-lg bg-lime-400 hover:bg-lime-300 disabled:opacity-60 text-slate-950 font-semibold px-4 py-2 text-sm"
      >
        {pendente ? "Lançando..." : "Lançar"}
      </button>
      {estado.erro && <p className="text-red-600 text-sm mt-2">{estado.erro}</p>}
    </form>
  );
}
