"use client";

import { useActionState, useRef, useEffect } from "react";
import { criarConta, type ContaState } from "@/lib/actions/contas";
import { LABEL_CATEGORIA_DESPESA } from "@/lib/format";

const estadoInicial: ContaState = {};

export function NovaContaForm({ tipo }: { tipo: "PAGAR" | "RECEBER" }) {
  const acao = criarConta.bind(null, tipo);
  const [estado, formAction, pendente] = useActionState(acao, estadoInicial);
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
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-4 flex flex-wrap items-end gap-3 shadow-sm"
    >
      <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Descrição</label>
        <input
          name="descricao"
          required
          placeholder={tipo === "PAGAR" ? "Ex: aluguel, fornecedor..." : "Ex: cliente, parceria..."}
          className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-56"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Valor (R$)</label>
        <input
          name="valor"
          required
          placeholder="100,00"
          className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-28"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Vencimento</label>
        <input
          name="vencimento"
          type="date"
          required
          className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
        />
      </div>
      {tipo === "PAGAR" && (
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
      <button
        type="submit"
        disabled={pendente}
        className="rounded-lg bg-lime-400 hover:bg-lime-300 disabled:opacity-60 text-slate-950 font-semibold px-4 py-2 text-sm"
      >
        {pendente ? "Lançando..." : tipo === "PAGAR" ? "Adicionar conta a pagar" : "Adicionar conta a receber"}
      </button>
      {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
    </form>
  );
}
