"use client";

import { useActionState, useState } from "react";
import { editarHorarioAtendimento, type EditarHorarioState } from "@/lib/actions/atendimentos";

const estadoInicial: EditarHorarioState = {};

export function EditarHorarioAtendimento({
  atendimentoId,
  chamadoEmValor,
  concluidoEmValor,
}: {
  atendimentoId: string;
  chamadoEmValor: string | null;
  concluidoEmValor: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [estado, formAction, pendente] = useActionState(editarHorarioAtendimento, estadoInicial);

  if (!chamadoEmValor) return null;

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
      >
        Editar horário
      </button>
    );
  }

  if (estado.sucesso) {
    return <span className="text-green-600 dark:text-green-400 text-sm">Horário atualizado ✓</span>;
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
      <input type="hidden" name="atendimentoId" value={atendimentoId} />
      <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Início</label>
        <input
          name="chamadoEm"
          type="datetime-local"
          required
          defaultValue={chamadoEmValor}
          className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-2 py-1 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Fim</label>
        <input
          name="concluidoEm"
          type="datetime-local"
          required
          defaultValue={concluidoEmValor}
          className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-2 py-1 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pendente}
        className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-3 py-1.5 text-sm"
      >
        {pendente ? "Salvando..." : "Salvar"}
      </button>
      <button type="button" onClick={() => setAberto(false)} className="text-slate-400 dark:text-slate-500 text-sm px-1">
        Cancelar
      </button>
      {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
    </form>
  );
}
