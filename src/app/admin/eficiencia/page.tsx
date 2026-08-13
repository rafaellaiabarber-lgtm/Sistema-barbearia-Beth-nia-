import { prisma } from "@/lib/prisma";
import { type Periodo, calcularIntervalo } from "@/lib/periodo";
import { FiltroRelatorio } from "../filtro-relatorio";
import { GraficoBarras } from "../grafico-barras";
import { minutosDisponiveis, formatarJornada } from "@/lib/jornada";

const LIMIAR_LENTO = 0.15; // 15% acima da média da equipe já vira alerta
const LIMIAR_OCUPACAO_ALTA = 85; // acima disso, vale considerar contratar
const LIMIAR_OCUPACAO_BAIXA = 40; // abaixo disso, tempo ocioso sobrando

function media(valores: number[]) {
  if (valores.length === 0) return 0;
  return valores.reduce((s, v) => s + v, 0) / valores.length;
}

function classeOcupacao(percentual: number) {
  if (percentual >= LIMIAR_OCUPACAO_ALTA) return "text-red-600 dark:text-red-400";
  if (percentual <= LIMIAR_OCUPACAO_BAIXA) return "text-amber-600 dark:text-amber-400";
  return "text-green-600 dark:text-green-400";
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

  const [atendimentos, barbeiros, atendimentosPeriodoTodos] = await Promise.all([
    prisma.atendimento.findMany({
      where: {
        status: "CONCLUIDO",
        concluidoEm: { gte: inicio, lte: fim },
        chamadoEm: { not: null },
        ...(barbeiroId ? { barbeiroId } : {}),
      },
      include: { barbeiro: true },
    }),
    prisma.barbeiro.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, include: { jornadas: true } }),
    prisma.atendimento.findMany({
      where: { criadoEm: { gte: inicio, lte: fim } },
      select: { criadoEm: true },
    }),
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

  const ocupacaoPorBarbeiro = barbeiros.map((b) => {
    const linha = porBarbeiro.get(b.id);
    const minAtendendo = linha ? linha.tempoAtendimento.reduce((s, v) => s + v, 0) : 0;
    const minDisponiveis = minutosDisponiveis(b.jornadas, inicio, fim);
    return {
      id: b.id,
      nome: b.nome,
      jornadaTexto: formatarJornada(b.jornadas),
      horasDisponiveis: minDisponiveis / 60,
      horasAtendendo: minAtendendo / 60,
      percentual: minDisponiveis > 0 ? (minAtendendo / minDisponiveis) * 100 : null,
    };
  });
  const ocupadosDemais = ocupacaoPorBarbeiro.filter((o) => o.percentual !== null && o.percentual >= LIMIAR_OCUPACAO_ALTA);

  const contagemPorHora = new Array(24).fill(0) as number[];
  for (const a of atendimentosPeriodoTodos) contagemPorHora[a.criadoEm.getHours()]++;
  const horasComMovimento = contagemPorHora.map((c, h) => ({ c, h })).filter((x) => x.c > 0);
  let horaMin = 8;
  let horaMax = 20;
  if (horasComMovimento.length > 0) {
    horaMin = Math.max(0, Math.min(...horasComMovimento.map((x) => x.h)) - 1);
    horaMax = Math.min(23, Math.max(...horasComMovimento.map((x) => x.h)) + 1);
  }
  const dadosHistograma = [];
  for (let h = horaMin; h <= horaMax; h++) {
    dadosHistograma.push({ label: `${String(h).padStart(2, "0")}h`, valor: contagemPorHora[h] });
  }
  const picoQtd = Math.max(...contagemPorHora);
  const picoHora = contagemPorHora.indexOf(picoQtd);

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

      <h2 className="text-lg font-semibold mt-8 mb-3">Taxa de ocupação</h2>
      <p className="text-slate-400 dark:text-slate-500 text-xs mb-4">
        Ocupação = tempo total atendendo dividido pelo tempo disponível, conforme o horário de trabalho cadastrado
        em Barbeiros. Cadastre o horário de cada um pra essa conta ficar precisa.
      </p>

      {ocupadosDemais.map((o) => (
        <div
          key={o.id}
          className="bg-red-50 dark:bg-red-950 border border-red-200 text-red-800 dark:text-red-300 rounded-xl p-4 mb-3 text-sm"
        >
          {o.nome} está com {o.percentual!.toFixed(0)}% de ocupação no período — perto do limite. Vale considerar
          contratar reforço ou ajustar a agenda.
        </div>
      ))}

      <div className="overflow-x-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-slate-500 dark:text-slate-400">
              <th className="p-3 font-medium">Barbeiro</th>
              <th className="p-3 font-medium">Horas disponíveis</th>
              <th className="p-3 font-medium">Horas atendendo</th>
              <th className="p-3 font-medium">Ocupação</th>
            </tr>
          </thead>
          <tbody>
            {ocupacaoPorBarbeiro.map((o) => (
              <tr key={o.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                <td className="p-3">
                  <p className="font-semibold">{o.nome}</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs">{o.jornadaTexto}</p>
                </td>
                <td className="p-3">{o.horasDisponiveis.toFixed(1)}h</td>
                <td className="p-3">{o.horasAtendendo.toFixed(1)}h</td>
                <td className="p-3">
                  {o.percentual !== null ? (
                    <span className={`font-semibold ${classeOcupacao(o.percentual)}`}>{o.percentual.toFixed(0)}%</span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">sem horário cadastrado</span>
                  )}
                </td>
              </tr>
            ))}
            {ocupacaoPorBarbeiro.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-slate-400 dark:text-slate-500">
                  Nenhum barbeiro ativo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-semibold mb-3">Horários de mais fluxo</h2>
      <p className="text-slate-400 dark:text-slate-500 text-xs mb-4">
        Quantidade de clientes que entraram na fila (pelo totem ou lançamento manual) em cada horário, considerando
        todos os barbeiros no período.
      </p>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        {picoQtd > 0 ? (
          <>
            <GraficoBarras dados={dadosHistograma} formatarValor={(v) => `${v} cliente(s)`} />
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-3">
              Horário de pico: <span className="font-semibold text-slate-700 dark:text-slate-200">{String(picoHora).padStart(2, "0")}h</span>{" "}
              — {picoQtd} cliente(s) entrando na fila nesse horário.
            </p>
          </>
        ) : (
          <p className="text-slate-400 dark:text-slate-500 text-sm">Nenhum cliente entrou na fila no período.</p>
        )}
      </div>
    </div>
  );
}
