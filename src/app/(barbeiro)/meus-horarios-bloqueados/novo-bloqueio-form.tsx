"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { criarBloqueioAgenda, type BloqueioState } from "@/lib/actions/agenda";

const estadoInicial: BloqueioState = {};

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

export function NovoBloqueioForm() {
  const [estado, formAction, pendente] = useActionState(criarBloqueioAgenda, estadoInicial);
  const [diaTodo, setDiaTodo] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);
  const dataRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (estado.sucesso && !pendente) {
      formRef.current?.reset();
      if (dataRef.current) dataRef.current.value = hoje();
      setDiaTodo(true);
    }
  }, [estado, pendente]);

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 mb-6 shadow-sm">
      <p className="font-semibold text-neutral-800 dark:text-neutral-100 mb-3">Novo bloqueio</p>
      <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Data</label>
          <input
            ref={dataRef}
            name="data"
            type="date"
            required
            defaultValue={hoje()}
            className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm pb-2">
          <input
            type="checkbox"
            name="diaTodo"
            checked={diaTodo}
            onChange={(e) => setDiaTodo(e.target.checked)}
            className="accent-orange-600"
          />
          Dia todo
        </label>
        {!diaTodo && (
          <>
            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">De</label>
              <input
                name="horaInicio"
                type="time"
                required={!diaTodo}
                className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Até</label>
              <input
                name="horaFim"
                type="time"
                required={!diaTodo}
                className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm"
              />
            </div>
          </>
        )}
        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Motivo (opcional)</label>
          <input
            name="motivo"
            placeholder="Consulta, viagem..."
            className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm w-44"
          />
        </div>
        <button
          type="submit"
          disabled={pendente}
          className="rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-semibold px-4 py-2 text-sm"
        >
          {pendente ? "Salvando..." : "Bloquear"}
        </button>
        {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
      </form>
    </div>
  );
}
