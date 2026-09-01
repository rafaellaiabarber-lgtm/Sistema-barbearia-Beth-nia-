import type { Barbeiro, Servico } from "@prisma/client";
import type { Periodo } from "@/lib/periodo";

export function normalizarServicoIds(servicoId?: string | string[]): string[] {
  if (!servicoId) return [];
  return Array.isArray(servicoId) ? servicoId : [servicoId];
}

export function FiltroRelatorio({
  basePath,
  periodo,
  dataInicio,
  dataFim,
  servicoIds = [],
  barbeiroId,
  servicos,
  barbeiros,
  mostrarServico = true,
}: {
  basePath: string;
  periodo: Periodo;
  dataInicio?: string;
  dataFim?: string;
  servicoIds?: string[];
  barbeiroId?: string;
  servicos: Servico[];
  barbeiros: Barbeiro[];
  mostrarServico?: boolean;
}) {
  return (
    <form
      method="get"
      action={basePath}
      className="flex flex-wrap items-end gap-3 mb-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm"
    >
      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Período</label>
        <select
          name="periodo"
          defaultValue={periodo}
          className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-900"
        >
          <option value="hoje">Hoje</option>
          <option value="dia">Um dia específico</option>
          <option value="semana">Esta semana</option>
          <option value="mes">Este mês</option>
          <option value="personalizado">Personalizado</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">{periodo === "dia" ? "Dia" : "De"}</label>
        <input
          type="date"
          name="dataInicio"
          defaultValue={dataInicio}
          className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm"
        />
      </div>
      {periodo !== "dia" && (
        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Até</label>
          <input
            type="date"
            name="dataFim"
            defaultValue={dataFim}
            className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm"
          />
        </div>
      )}
      {mostrarServico && (
        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            Serviços {servicoIds.length === 0 && "(todos)"}
          </label>
          <div className="flex flex-wrap gap-1.5 max-w-sm">
            {servicos.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 px-2 py-1.5 text-sm cursor-pointer has-[:checked]:bg-orange-50 has-[:checked]:border-orange-400 dark:has-[:checked]:bg-orange-950"
              >
                <input
                  type="checkbox"
                  name="servicoId"
                  value={s.id}
                  defaultChecked={servicoIds.includes(s.id)}
                  className="accent-orange-600"
                />
                {s.nome}
              </label>
            ))}
          </div>
        </div>
      )}
      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Barbeiro</label>
        <select
          name="barbeiroId"
          defaultValue={barbeiroId ?? ""}
          className="rounded-lg border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-900"
        >
          <option value="">Todos</option>
          {barbeiros.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nome}
              {!b.ativo && " (inativo)"}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 text-sm"
      >
        Buscar
      </button>
      {(servicoIds.length > 0 || barbeiroId || periodo === "personalizado" || periodo === "dia") && (
        <a href={basePath} className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 text-sm">
          Limpar filtros
        </a>
      )}
    </form>
  );
}
