"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import type { Barbeiro, TemaFeedback } from "@prisma/client";
import { criarFeedback, type FeedbackState } from "@/lib/actions/feedback";

const estadoInicial: FeedbackState = {};

const NOTAS = Array.from({ length: 11 }, (_, i) => i);

function corNota(nota: number) {
  if (nota <= 4) return "border-red-600 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400";
  if (nota <= 7) return "border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400";
  return "border-green-600 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400";
}

export function NovoFeedbackForm({ barbeiros, temas }: { barbeiros: Barbeiro[]; temas: TemaFeedback[] }) {
  const [estado, formAction, pendente] = useActionState(criarFeedback, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);
  const [nota, setNota] = useState<number | null>(null);

  useEffect(() => {
    if (estado.sucesso) {
      formRef.current?.reset();
      setNota(null);
    }
  }, [estado]);

  if (temas.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 mb-6 shadow-sm">
        <p className="text-slate-400 dark:text-slate-500 text-sm">Cadastre ao menos um tema acima pra poder registrar um feedback.</p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 mb-6 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Registrar feedback</h2>
      <div className="flex flex-wrap items-end gap-3 mb-3">
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Barbeiro</label>
          <select
            name="barbeiroId"
            required
            defaultValue=""
            className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900 w-48"
          >
            <option value="" disabled>
              Escolha...
            </option>
            {barbeiros.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Tema</label>
          <select
            name="temaId"
            required
            defaultValue=""
            className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900 w-48"
          >
            <option value="" disabled>
              Escolha...
            </option>
            {temas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Periodicidade</label>
          <select
            name="periodicidade"
            required
            defaultValue="SEMANAL"
            className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900 w-40"
          >
            <option value="SEMANAL">Semanal</option>
            <option value="MENSAL">Mensal</option>
            <option value="AVULSO">Avulsa</option>
          </select>
        </div>
      </div>

      <p className="text-slate-700 dark:text-slate-200 text-sm font-semibold mb-2">Nota (0 a 10):</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {NOTAS.map((n) => (
          <button
            type="button"
            key={n}
            onClick={() => setNota(n)}
            className={`w-9 h-9 rounded-lg border-2 text-sm font-bold transition-colors ${
              nota === n ? corNota(n) : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <input type="hidden" name="nota" value={nota ?? ""} />

      <div className="mb-3">
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
          Observações da conversa (opcional)
        </label>
        <textarea
          name="observacoes"
          rows={3}
          placeholder="O que foi conversado, pontos de melhoria, combinados..."
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900"
        />
      </div>

      {estado.erro && <p className="text-red-600 text-sm mb-3">{estado.erro}</p>}

      <button
        type="submit"
        disabled={pendente}
        className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-4 py-2 text-sm"
      >
        {pendente ? "Salvando..." : "Salvar feedback"}
      </button>
    </form>
  );
}
