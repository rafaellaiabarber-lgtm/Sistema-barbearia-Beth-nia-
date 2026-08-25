"use client";

import { useActionState, useRef, useEffect } from "react";
import type { TemaFeedback } from "@prisma/client";
import { criarTemaFeedback, alternarAtivoTema, type TemaState } from "@/lib/actions/feedback";

const estadoInicial: TemaState = {};

export function TemasFeedback({ temas }: { temas: TemaFeedback[] }) {
  const [estado, formAction, pendente] = useActionState(criarTemaFeedback, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!estado.erro && !pendente) formRef.current?.reset();
  }, [estado, pendente]);

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 mb-6 shadow-sm">
      <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-3">Temas do feedback</h2>
      <div className="flex flex-wrap gap-2 mb-3">
        {temas.map((t) => (
          <form key={t.id} action={alternarAtivoTema.bind(null, t.id, !t.ativo)}>
            <button
              type="submit"
              title={t.ativo ? "Clique pra desativar" : "Clique pra ativar"}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                t.ativo
                  ? "border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300"
                  : "border-neutral-200 dark:border-neutral-700 text-neutral-400 dark:text-neutral-500 line-through"
              }`}
            >
              {t.nome}
            </button>
          </form>
        ))}
        {temas.length === 0 && <p className="text-neutral-400 dark:text-neutral-500 text-sm">Nenhum tema cadastrado ainda.</p>}
      </div>
      <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Novo tema</label>
          <input
            name="nome"
            required
            placeholder="Atendimento, Pontualidade, Cortes..."
            className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-64"
          />
        </div>
        <button
          type="submit"
          disabled={pendente}
          className="rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-semibold px-3 py-2"
        >
          {pendente ? "Adicionando..." : "Adicionar tema"}
        </button>
        {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
      </form>
    </div>
  );
}
