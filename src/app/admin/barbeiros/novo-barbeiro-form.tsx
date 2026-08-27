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
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 mb-6 flex flex-wrap items-end gap-3 shadow-sm"
    >
      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Nome</label>
        <input name="nome" required className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-40" />
      </div>
      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Telefone</label>
        <input name="telefone" className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-36" />
      </div>
      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Comissão (%)</label>
        <input
          name="comissao"
          type="number"
          defaultValue={50}
          className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-20"
        />
      </div>
      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Usuário (login)</label>
        <input name="login" required className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-32" />
      </div>
      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Senha</label>
        <input
          name="senha"
          type="password"
          required
          className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-32"
        />
      </div>
      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Foto (opcional)</label>
        <input
          name="foto"
          type="file"
          accept="image/*"
          className="text-xs text-neutral-600 dark:text-neutral-300 file:mr-2 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-2 file:py-1.5 file:text-neutral-700 w-40"
        />
      </div>
      <button
        type="submit"
        disabled={pendente}
        className="rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-semibold px-4 py-2 text-sm"
      >
        {pendente ? "Adicionando..." : "Adicionar barbeiro"}
      </button>
      {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
      {estado.aviso && <p className="text-amber-600 dark:text-amber-400 text-sm w-full">{estado.aviso}</p>}
    </form>
  );
}
