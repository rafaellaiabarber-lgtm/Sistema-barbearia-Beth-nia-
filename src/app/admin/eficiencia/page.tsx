import { prisma } from "@/lib/prisma";
import { type Periodo, calcularIntervalo } from "@/lib/periodo";
import { FiltroRelatorio } from "../filtro-relatorio";

const LIMIAR_LENTO = 0.15; // 15% acima da média da equipe já vira alerta

function media(valores: number[]) {
  if (valores.length === 0) return 0;
  return valores.reduce((s, v) => s + v, 0) / valores.length;
}

export default async function EficienciaPage({
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

  const [atendimentos, barbeiros] = await Promise.all([
    prisma.atendimento.findMany({
      where: {
        status: "CONCLUIDO",
        concluidoEm: { gte: inicio, lte: fim },
        chamadoEm: { not: null },
        ...(barbeiroId ? { barbeiroId } : {}),
      },
      include: { barbeiro: true },
    }),
    prisma.barbeiro.findMany({ orderBy: { nome: "asc" } }),
  ]);

  type Linha = { id: string; nome: string; qtd: number; tempoAtendimento: number[]; tempoEspera: number[] };
  const porBarbeiro = new Map<string, Linha>();

  for (const a of atendimentos) {
    if (!a.barbeiro || !a.chamadoEm || !a.concluidoEm) continue;
    const tempoAtendimentoMin = (a.concluidoEm.getTime() - a.chamadoEm.getTime()) / 60000;
    const tempoEsperaMin = (a.chamadoEm.getTime() - a.criadoEm.getTime()) / 60000;

    const atual = porBarbeiro.get(a.barbeiro.id) ?? {
      id: a.barbeiro.id,
      nome: a.barbeiro.nome,
      qtd: 0,
      tempoAtendimento: [],
      tempoEspera: [],
    };
    atual.qtd += 1;
    atual.tempoAtendimento.push(tempoAtendimentoMin);
    atual.tempoEspera.push(tempoEsperaMin);
    porBarbeiro.set(a.barbeiro.id, atual);
  }

  const linhas = [...porBarbeiro.values()]
    .map((l) => ({
      ...l,
      mediaAtendimento: media(l.tempoAtendimento),
      mediaEspera: media(l.tempoEspera),
    }))
    .sort((a, b) => a.mediaAtendimento - b.mediaAtendimento);

  const todosTemposAtendimento = atendimentos
    .filter((a) => a.barbeiro && a.chamadoEm && a.concluidoEm)
    .map((a) => (a.concluidoEm!.getTime() - a.chamadoEm!.getTime()) / 60000);
  const todosTemposEspera = atendimentos
    .filter((a) => a.barbeiro && a.chamadoEm)
    .map((a) => (a.chamadoEm!.getTime() - a.criadoEm.getTime()) / 60000);

  const mediaEquipeAtendimento = media(todosTemposAtendimento);
  const mediaEquipeEspera = media(todosTemposEspera);

  const maisRapido = linhas[0];
  const maisLento = linhas[linhas.length - 1];
  const maisLentoAlerta =
    linhas.length > 1 &&
    maisLento &&
    mediaEquipeAtendimento > 0 &&
    maisLento.mediaAtendimento > mediaEquipeAtendimento * (1 + LIMIAR_LENTO);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Eficiência dos barbeiros</h1>

      <FiltroRelatorio
        basePath="/admin/eficiencia"
        periodo={periodo}
        dataInicio={dataInicio}
        dataFim={dataFim}
        barbeiroId={barbeiroId}
        servicos={[]}
        barbeiros={barbeiros}
        mostrarServico={false}
      />

      <p className="text-slate-400 dark:text-slate-500 text-xs mb-6">
        Tempo de atendimento = do início ao fim do corte. Tempo de espera = da chegada na fila até
        ser chamado. Considera só atendimentos concluídos que passaram pela fila.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Média da equipe — atendimento</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{mediaEquipeAtendimento.toFixed(1)} min</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Média da equipe — espera</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{mediaEquipeEspera.toFixed(1)} min</p>
        </div>
      </div>

      {maisRapido && (
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 text-green-800 rounded-xl p-4 mb-3 text-sm">
          {maisRapido.nome} é o mais rápido da equipe, com média de {maisRapido.mediaAtendimento.toFixed(1)} min.
        </div>
      )}

      {maisLentoAlerta && (
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 text-amber-800 rounded-xl p-4 mb-6 text-sm">
          {maisLento.nome} está com tempo médio{" "}
          {(((maisLento.mediaAtendimento - mediaEquipeAtendimento) / mediaEquipeAtendimento) * 100).toFixed(1)}%
          acima da equipe — vale conversar sobre carga de trabalho ou complexidade dos atendimentos dele(a).
        </div>
      )}

      <div className="overflow-x-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-slate-500 dark:text-slate-400">
              <th className="p-3 font-medium">Barbeiro</th>
              <th className="p-3 font-medium">Atendimentos</th>
              <th className="p-3 font-medium">Tempo médio de atendimento</th>
              <th className="p-3 font-medium">Tempo médio de espera</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                <td className="p-3 font-semibold">{l.nome}</td>
                <td className="p-3">{l.qtd}</td>
                <td className="p-3">{l.mediaAtendimento.toFixed(1)} min</td>
                <td className="p-3">{l.mediaEspera.toFixed(1)} min</td>
              </tr>
            ))}
            {linhas.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-slate-400 dark:text-slate-500">
                  Nenhum atendimento concluído no período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
