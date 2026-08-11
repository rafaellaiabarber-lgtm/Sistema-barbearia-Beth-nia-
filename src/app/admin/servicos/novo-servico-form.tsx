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
      className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-6 flex flex-wrap items-end gap-3"
    >
      <div>
        <label className="block text-xs text-neutral-400 mb-1">Nome</label>
        <input
          name="nome"
          required
          className="rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm w-48"
        />
      </div>
      <div>
        <label className="block text-xs text-neutral-400 mb-1">Preço (R$)</label>
        <input
          name="preco"
          required
          placeholder="40,00"
          className="rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm w-28"
        />
      </div>
      <div>
        <label className="block text-xs text-neutral-400 mb-1">Duração (min)</label>
        <input
          name="duracao"
          type="number"
          defaultValue={30}
          className="rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm w-24"
        />
      </div>
      <button
        type="submit"
        disabled={pendente}
        className="rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-neutral-950 font-semibold px-4 py-2 text-sm"
      >
        {pendente ? "Adicionando..." : "Adicionar serviço"}
      </button>
      {estado.erro && <p className="text-red-400 text-sm w-full">{estado.erro}</p>}
    </form>
  );
}
