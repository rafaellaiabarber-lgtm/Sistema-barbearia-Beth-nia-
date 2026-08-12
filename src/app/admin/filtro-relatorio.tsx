import type { Barbeiro, Servico } from "@prisma/client";
import type { Periodo } from "@/lib/periodo";

export function FiltroRelatorio({
  basePath,
  periodo,
  dataInicio,
  dataFim,
  servicoId,
  barbeiroId,
  servicos,
  barbeiros,
  mostrarServico = true,
}: {
  basePath: string;
  periodo: Periodo;
  dataInicio?: string;
  dataFim?: string;
  servicoId?: string;
  barbeiroId?: string;
  servicos: Servico[];
  barbeiros: Barbeiro[];
  mostrarServico?: boolean;
}) {
  return (
    <form
      method="get"
      action={basePath}
      className="flex flex-wrap items-end gap-3 mb-6 bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
    >
      <div>
        <label className="block text-xs text-slate-500 mb-1">Período</label>
        <select
          name="periodo"
          defaultValue={periodo}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
        >
          <option value="hoje">Hoje</option>
          <option value="semana">Esta semana</option>
          <option value="mes">Este mês</option>
          <option value="personalizado">Personalizado</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">De</label>
        <input
          type="date"
          name="dataInicio"
          defaultValue={dataInicio}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Até</label>
        <input
          type="date"
          name="dataFim"
          defaultValue={dataFim}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      {mostrarServico && (
        <div>
          <label className="block text-xs text-slate-500 mb-1">Serviço</label>
          <select
            name="servicoId"
            defaultValue={servicoId ?? ""}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            <option value="">Todos</option>
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="block text-xs text-slate-500 mb-1">Barbeiro</label>
        <select
          name="barbeiroId"
          defaultValue={barbeiroId ?? ""}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
        >
          <option value="">Todos</option>
          {barbeiros.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nome}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 text-sm"
      >
        Buscar
      </button>
      {(servicoId || barbeiroId || periodo === "personalizado") && (
        <a href={basePath} className="text-slate-400 hover:text-slate-700 text-sm">
          Limpar filtros
        </a>
      )}
    </form>
  );
}
