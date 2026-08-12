"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { criarMovimentoCaixa, type MovimentoCaixaState } from "@/lib/actions/caixa";

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
      className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-wrap items-end gap-3 shadow-sm"
    >
      <div>
        <label className="block text-xs text-slate-500 mb-1">Tipo</label>
        <div className="flex rounded-lg overflow-hidden border border-slate-300">
          <button
            type="button"
            onClick={() => setTipo("SAIDA")}
            className={`px-3 py-2 text-sm font-medium ${
              tipo === "SAIDA" ? "bg-red-600 text-white" : "bg-slate-100 text-slate-500"
            }`}
          >
            Saída
          </button>
          <button
            type="button"
            onClick={() => setTipo("ENTRADA")}
            className={`px-3 py-2 text-sm font-medium ${
              tipo === "ENTRADA" ? "bg-green-600 text-white" : "bg-slate-100 text-slate-500"
            }`}
          >
            Entrada
          </button>
        </div>
        <input type="hidden" name="tipo" value={tipo} />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Descrição</label>
        <input
          name="descricao"
          required
          placeholder="Ex: compra de material, troco..."
          className="rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm w-56"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Valor (R$)</label>
        <input
          name="valor"
          required
          placeholder="20,00"
          className="rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm w-28"
        />
      </div>
      <button
        type="submit"
        disabled={pendente}
        className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-4 py-2 text-sm"
      >
        {pendente ? "Lançando..." : "Lançar"}
      </button>
      {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
    </form>
  );
}
