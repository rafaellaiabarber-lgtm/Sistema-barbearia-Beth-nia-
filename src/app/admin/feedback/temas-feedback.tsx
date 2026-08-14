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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Temas do feedback</h2>
      <div className="flex flex-wrap gap-2 mb-3">
        {temas.map((t) => (
          <form key={t.id} action={alternarAtivoTema.bind(null, t.id, !t.ativo)}>
            <button
              type="submit"
              title={t.ativo ? "Clique pra desativar" : "Clique pra ativar"}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                t.ativo
                  ? "border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                  : "border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 line-through"
              }`}
            >
              {t.nome}
            </button>
          </form>
        ))}
        {temas.length === 0 && <p className="text-slate-400 dark:text-slate-500 text-sm">Nenhum tema cadastrado ainda.</p>}
      </div>
      <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Novo tema</label>
          <input
            name="nome"
            required
            placeholder="Atendimento, Pontualidade, Cortes..."
            className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-64"
          />
        </div>
        <button
          type="submit"
          disabled={pendente}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-3 py-2"
        >
          {pendente ? "Adicionando..." : "Adicionar tema"}
        </button>
        {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
      </form>
    </div>
  );
}
