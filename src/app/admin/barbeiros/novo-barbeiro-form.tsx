"use client";

import { useActionState, useRef, useEffect } from "react";
import { criarBarbeiro, type BarbeiroState } from "@/lib/actions/barbeiros";

const estadoInicial: BarbeiroState = {};

export function NovoBarbeiroForm() {
  const [estado, formAction, pendente] = useActionState(criarBarbeiro, estadoInicial);
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
        <input name="nome" required className="rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm w-40" />
      </div>
      <div>
        <label className="block text-xs text-neutral-400 mb-1">Telefone</label>
        <input name="telefone" className="rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm w-36" />
      </div>
      <div>
        <label className="block text-xs text-neutral-400 mb-1">Comissão (%)</label>
        <input
          name="comissao"
          type="number"
          defaultValue={50}
          className="rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm w-20"
        />
      </div>
      <div>
        <label className="block text-xs text-neutral-400 mb-1">Usuário (login)</label>
        <input name="login" required className="rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm w-32" />
      </div>
      <div>
        <label className="block text-xs text-neutral-400 mb-1">Senha</label>
        <input
          name="senha"
          type="password"
          required
          className="rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm w-32"
        />
      </div>
      <button
        type="submit"
        disabled={pendente}
        className="rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-neutral-950 font-semibold px-4 py-2 text-sm"
      >
        {pendente ? "Adicionando..." : "Adicionar barbeiro"}
      </button>
      {estado.erro && <p className="text-red-400 text-sm w-full">{estado.erro}</p>}
    </form>
  );
}
