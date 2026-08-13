"use client";

import { useActionState, useState } from "react";
import { salvarJornada, type JornadaState } from "@/lib/actions/jornada";
import { NOMES_DIAS_SEMANA } from "@/lib/assinaturas";
import { formatarJornada, type JornadaDia } from "@/lib/jornada";

const estadoInicial: JornadaState = {};

export function JornadaForm({ barbeiroId, jornadas }: { barbeiroId: string; jornadas: JornadaDia[] }) {
  const acaoComId = salvarJornada.bind(null, barbeiroId);
  const [estado, formAction, pendente] = useActionState(acaoComId, estadoInicial);
  const porDia = new Map(jornadas.map((j) => [j.diaSemana, j]));
  const [ativos, setAtivos] = useState<Record<number, boolean>>(
    Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((d) => [d, porDia.has(d)]))
  );

  return (
    <details className="mt-4">
      <summary className="cursor-pointer text-sm text-blue-600 dark:text-blue-400 hover:underline select-none">
        Horário de trabalho — {formatarJornada(jornadas)}
      </summary>
      <form action={formAction} className="mt-3 space-y-2">
        {[1, 2, 3, 4, 5, 6, 0].map((dia) => {
          const jornada = porDia.get(dia);
          return (
            <div key={dia} className="flex items-center gap-3 text-sm">
              <label className="flex items-center gap-2 w-24 shrink-0">
                <input
                  type="checkbox"
                  name={`ativo-${dia}`}
                  defaultChecked={ativos[dia]}
                  onChange={(e) => setAtivos((atual) => ({ ...atual, [dia]: e.target.checked }))}
                  className="accent-blue-600"
                />
                {NOMES_DIAS_SEMANA[dia]}
              </label>
              <input
                type="time"
                name={`inicio-${dia}`}
                defaultValue={jornada?.horaInicio ?? "09:00"}
                disabled={!ativos[dia]}
                className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-2 py-1 text-sm disabled:opacity-40"
              />
              <span className="text-slate-400">até</span>
              <input
                type="time"
                name={`fim-${dia}`}
                defaultValue={jornada?.horaFim ?? "18:00"}
                disabled={!ativos[dia]}
                className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-2 py-1 text-sm disabled:opacity-40"
              />
            </div>
          );
        })}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={pendente}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-3 py-1.5"
          >
            {pendente ? "Salvando..." : "Salvar horário"}
          </button>
          {estado.erro && <p className="text-red-600 text-xs">{estado.erro}</p>}
          {estado.sucesso && <p className="text-green-600 text-xs">Horário salvo!</p>}
        </div>
      </form>
    </details>
  );
}
