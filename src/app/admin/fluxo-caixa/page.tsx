import { prisma } from "@/lib/prisma";
import { formatarReais } from "@/lib/format";
import { type Periodo, calcularIntervalo } from "@/lib/periodo";
import { FiltroRelatorio } from "../filtro-relatorio";
import { GraficoBarras } from "../grafico-barras";

function chaveDia(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatarChaveDia(chave: string) {
  const [, mes, dia] = chave.split("-");
  return `${dia}/${mes}`;
}

export default async function FluxoCaixaPage({
  searchParams,
}: {
  searchParams: Promise<{
    periodo?: string;
    dataInicio?: string;
    dataFim?: string;
    barbeiroId?: string;
  }>;
}) {
  const { periodo: periodoParam, dataInicio, dataFim, barbeiroId } = await searchParams;
  const periodo: Periodo =
    periodoParam === "semana" || periodoParam === "mes" || periodoParam === "personalizado"
      ? periodoParam
      : "mes";
  const { inicio, fim } = calcularIntervalo(periodo, new Date(), { dataInicio, dataFim });

  const [atendimentos, movimentos, servicos, barbeiros] = await Promise.all([
    prisma.atendimento.findMany({
      where: {
        status: "CONCLUIDO",
        concluidoEm: { gte: inicio, lte: fim },
        ...(barbeiroId ? { barbeiroId } : {}),
      },
    }),
    prisma.movimentoCaixa.findMany({ where: { criadoEm: { gte: inicio, lte: fim } } }),
    prisma.servico.findMany({ orderBy: { nome: "asc" } }),
    prisma.barbeiro.findMany({ orderBy: { nome: "asc" } }),
  ]);

  const porDia = new Map<string, { entradas: number; saidas: number }>();

  for (const a of atendimentos) {
    const chave = chaveDia(a.concluidoEm!);
    const atual = porDia.get(chave) ?? { entradas: 0, saidas: 0 };
    atual.entradas += a.precoTotalCentavos;
    porDia.set(chave, atual);
  }
  for (const m of movimentos) {
    const chave = chaveDia(m.criadoEm);
    const atual = porDia.get(chave) ?? { entradas: 0, saidas: 0 };
    if (m.tipo === "ENTRADA") atual.entradas += m.valorCentavos;
    else atual.saidas += m.valorCentavos;
    porDia.set(chave, atual);
  }

  const dias = [...porDia.entries()].sort(([a], [b]) => (a < b ? -1 : 1));

  let saldoAcumulado = 0;
  const linhas = dias.map(([chave, { entradas, saidas }]) => {
    saldoAcumulado += entradas - saidas;
    return { chave, entradas, saidas, saldoDia: entradas - saidas, saldoAcumulado };
  });

  const totalEntradasCentavos = linhas.reduce((s, l) => s + l.entradas, 0);
  const totalSaidasCentavos = linhas.reduce((s, l) => s + l.saidas, 0);
  const saldoPeriodoCentavos = totalEntradasCentavos - totalSaidasCentavos;

  const dadosGrafico = linhas.map((l) => ({ label: formatarChaveDia(l.chave), valor: l.entradas - l.saidas }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Fluxo de caixa</h1>

      <FiltroRelatorio
        basePath="/admin/fluxo-caixa"
        periodo={periodo}
        dataInicio={dataInicio}
        dataFim={dataFim}
        barbeiroId={barbeiroId}
        servicos={servicos}
        barbeiros={barbeiros}
        mostrarServico={false}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl p-5 shadow-sm bg-green-600 text-white">
          <p className="text-2xl font-bold mb-1">{formatarReais(totalEntradasCentavos)}</p>
          <p className="text-green-100 text-sm">Total de entradas</p>
        </div>
        <div className="rounded-xl p-5 shadow-sm bg-red-600 text-white">
          <p className="text-2xl font-bold mb-1">{formatarReais(totalSaidasCentavos)}</p>
          <p className="text-red-100 text-sm">Total de saídas</p>
        </div>
        <div className={`rounded-xl p-5 shadow-sm text-white ${saldoPeriodoCentavos < 0 ? "bg-red-700" : "bg-blue-600"}`}>
          <p className="text-2xl font-bold mb-1">{formatarReais(saldoPeriodoCentavos)}</p>
          <p className="text-blue-100 text-sm">Saldo do período</p>
        </div>
      </div>

      {linhas.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm mb-8">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Saldo diário (entradas − saídas)</h2>
          <GraficoBarras dados={dadosGrafico} />
        </div>
      )}

      <h2 className="text-lg font-semibold mb-3">Detalhamento por dia</h2>
      {linhas.length === 0 ? (
        <p className="text-slate-400 dark:text-slate-500">Nenhum lançamento no período.</p>
      ) : (
        <div className="space-y-2">
          {linhas.map((l) => (
            <div
              key={l.chave}
              className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm"
            >
              <p className="font-medium">{formatarChaveDia(l.chave)}</p>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-green-600 font-semibold">+{formatarReais(l.entradas)}</span>
                <span className="text-red-600 font-semibold">-{formatarReais(l.saidas)}</span>
                <span className="text-slate-500 dark:text-slate-400">
                  saldo acumulado:{" "}
                  <span className={`font-semibold ${l.saldoAcumulado < 0 ? "text-red-600" : "text-slate-700 dark:text-slate-200"}`}>
                    {formatarReais(l.saldoAcumulado)}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
