"use client";

import type { Feedback } from "@prisma/client";
import { excluirFeedback } from "@/lib/actions/feedback";
import { LABEL_PERIODICIDADE_FEEDBACK } from "@/lib/format";

function corNota(nota: number) {
  if (nota <= 4) return "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400";
  if (nota <= 7) return "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400";
  return "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400";
}

export function FeedbackRow({ feedback, mostrarBarbeiro }: { feedback: Feedback & { barbeiro: { nome: string } }; mostrarBarbeiro: boolean }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">
            {mostrarBarbeiro ? `${feedback.barbeiro.nome} — ` : ""}
            {feedback.temaNomeSnapshot}
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-xs">
            {LABEL_PERIODICIDADE_FEEDBACK[feedback.periodicidade] ?? feedback.periodicidade} ·{" "}
            {feedback.criadoEm.toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`rounded-full w-9 h-9 flex items-center justify-center font-bold text-sm ${corNota(feedback.nota)}`}>
            {feedback.nota}
          </span>
          <form action={excluirFeedback.bind(null, feedback.id)}>
            <button className="text-slate-400 dark:text-slate-500 hover:text-red-600 text-xs">Excluir</button>
          </form>
        </div>
      </div>
      {feedback.observacoes && (
        <p className="text-slate-600 dark:text-slate-300 text-sm mt-2 whitespace-pre-wrap">{feedback.observacoes}</p>
      )}
    </div>
  );
}
