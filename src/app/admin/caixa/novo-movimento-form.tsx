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
      className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-6 flex flex-wrap items-end gap-3"
    >
      <div>
        <label className="block text-xs text-neutral-400 mb-1">Tipo</label>
        <div className="flex rounded-lg overflow-hidden border border-neutral-700">
          <button
            type="button"
            onClick={() => setTipo("SAIDA")}
            className={`px-3 py-2 text-sm font-medium ${
              tipo === "SAIDA" ? "bg-red-900 text-white" : "bg-neutral-800 text-neutral-400"
            }`}
          >
            Saída
          </button>
          <button
            type="button"
            onClick={() => setTipo("ENTRADA")}
            className={`px-3 py-2 text-sm font-medium ${
              tipo === "ENTRADA" ? "bg-green-800 text-white" : "bg-neutral-800 text-neutral-400"
            }`}
          >
            Entrada
          </button>
        </div>
        <input type="hidden" name="tipo" value={tipo} />
      </div>
      <div>
        <label className="block text-xs text-neutral-400 mb-1">Descrição</label>
        <input
          name="descricao"
          required
          placeholder="Ex: compra de material, troco..."
          className="rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm w-56"
        />
      </div>
      <div>
        <label className="block text-xs text-neutral-400 mb-1">Valor (R$)</label>
        <input
          name="valor"
          required
          placeholder="20,00"
          className="rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm w-28"
        />
      </div>
      <button
        type="submit"
        disabled={pendente}
        className="rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-neutral-950 font-semibold px-4 py-2 text-sm"
      >
        {pendente ? "Lançando..." : "Lançar"}
      </button>
      {estado.erro && <p className="text-red-400 text-sm w-full">{estado.erro}</p>}
    </form>
  );
}
