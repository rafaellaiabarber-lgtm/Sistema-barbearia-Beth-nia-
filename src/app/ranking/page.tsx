import Link from "next/link";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { calcularIntervalo } from "@/lib/periodo";
import { montarRanking, type ContagemBarbeiro, type PontosPorAcao } from "@/lib/ranking";
import { buscarTodasCampanhasAtivasComProgresso } from "@/lib/campanhas-server";
import { RankingLista } from "./ranking-lista";
import { RankingConfigForm } from "./ranking-config-form";
import { CampanhasVenda } from "./campanhas-venda";
import { ThemeToggle } from "../theme-toggle";

async function buscarContagens(
  inicio: Date,
  fim: Date,
  barbeiros: { id: string; nome: string }[]
): Promise<ContagemBarbeiro[]> {
  const [servicosExtras, vendas, assinaturas, indicacoes] = await Promise.all([
    prisma.atendimentoServico.findMany({
      where: {
        servico: { pontuaRanking: true },
        atendimento: { status: "CONCLUIDO", concluidoEm: { gte: inicio, lte: fim }, barbeiroId: { not: null } },
      },
      select: { atendimento: { select: { barbeiroId: true } } },
    }),
    prisma.vendaProduto.groupBy({
      by: ["barbeiroId"],
      where: { criadoEm: { gte: inicio, lte: fim }, barbeiroId: { not: null } },
      _count: { _all: true },
    }),
    prisma.assinatura.groupBy({
      by: ["barbeiroId"],
      where: { criadoEm: { gte: inicio, lte: fim }, barbeiroId: { not: null } },
      _count: { _all: true },
    }),
    prisma.indicacao.groupBy({
      by: ["barbeiroId"],
      where: { convertida: true, convertidaEm: { gte: inicio, lte: fim } },
      _count: { _all: true },
    }),
  ]);

  function contarPara(lista: { barbeiroId: string | null; _count: { _all: number } }[], barbeiroId: string) {
    return lista.find((l) => l.barbeiroId === barbeiroId)?._count._all ?? 0;
  }

  function contarServicosExtras(barbeiroId: string) {
    return servicosExtras.filter((s) => s.atendimento.barbeiroId === barbeiroId).length;
  }

  return barbeiros.map((b) => ({
    barbeiroId: b.id,
    nome: b.nome,
    qtdAtendimentos: contarServicosExtras(b.id),
    qtdVendasProduto: contarPara(vendas, b.id),
    qtdAssinaturas: contarPara(assinaturas, b.id),
    qtdIndicacoesConvertidas: contarPara(indicacoes, b.id),
  }));
}

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ dataInicio?: string; dataFim?: string }>;
}) {
  const session = await requireSession(["ADMIN", "BARBEIRO"]);
  const souAdmin = session.role === "ADMIN";
  const { dataInicio, dataFim } = await searchParams;

  const agora = new Date();
  const semana = calcularIntervalo("semana", agora);
  const mes = calcularIntervalo("mes", agora);
  const personalizado = dataInicio ? calcularIntervalo("personalizado", agora, { dataInicio, dataFim }) : null;

  const [barbeirosAtivos, configuracao, campanhasAtivas] = await Promise.all([
    prisma.barbeiro.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.configuracaoRanking.findUnique({ where: { id: "singleton" } }),
    buscarTodasCampanhasAtivasComProgresso(),
  ]);

  const pontos: PontosPorAcao = {
    pontosPorAtendimento: configuracao?.pontosPorAtendimento ?? 1,
    pontosPorVendaProduto: configuracao?.pontosPorVendaProduto ?? 1,
    pontosPorAssinatura: configuracao?.pontosPorAssinatura ?? 1,
    pontosPorIndicacaoConvertida: configuracao?.pontosPorIndicacaoConvertida ?? 1,
  };

  const [contagensSemana, contagensMes, contagensPersonalizado] = await Promise.all([
    buscarContagens(semana.inicio, semana.fim, barbeirosAtivos),
    buscarContagens(mes.inicio, mes.fim, barbeirosAtivos),
    personalizado ? buscarContagens(personalizado.inicio, personalizado.fim, barbeirosAtivos) : null,
  ]);

  const rankingSemanal = montarRanking(contagensSemana, pontos);
  const rankingMensal = montarRanking(contagensMes, pontos);
  const rankingPersonalizado = contagensPersonalizado ? montarRanking(contagensPersonalizado, pontos) : null;
  const pontuacaoMinimaPremio = configuracao?.pontuacaoMinimaPremio ?? null;

  const premiosSemanal = {
    premio1: configuracao?.premio1LugarSemanal ?? null,
    premio2: configuracao?.premio2LugarSemanal ?? null,
    premio3: configuracao?.premio3LugarSemanal ?? null,
  };
  const premiosMensal = {
    premio1: configuracao?.premio1LugarMensal ?? null,
    premio2: configuracao?.premio2LugarMensal ?? null,
    premio3: configuracao?.premio3LugarMensal ?? null,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Ranking dos barbeiros</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Pontos por serviço extra (configurável em Serviços), venda de produto, assinatura vendida e indicação convertida.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800" />
          <Link href="/indicacoes" className="text-lime-600 dark:text-lime-400 hover:underline text-sm">
            Indicações
          </Link>
          <Link href={session.role === "ADMIN" ? "/admin" : "/fila"} className="text-lime-600 dark:text-lime-400 hover:underline text-sm">
            {session.role === "ADMIN" ? "Painel admin" : "Voltar pra fila"}
          </Link>
        </div>
      </header>

      <CampanhasVenda campanhas={campanhasAtivas} />

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Ranking de um período escolhido</h2>
        <form method="get" className="flex flex-wrap items-end gap-3 mb-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">De</label>
            <input
              type="date"
              name="dataInicio"
              defaultValue={dataInicio}
              required
              className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Até</label>
            <input
              type="date"
              name="dataFim"
              defaultValue={dataFim}
              className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900"
            />
          </div>
          <button type="submit" className="rounded-lg bg-lime-400 hover:bg-lime-300 text-slate-950 font-semibold px-4 py-2 text-sm">
            Ver ranking
          </button>
          {personalizado && (
            <Link href="/ranking" className="text-slate-400 dark:text-slate-500 hover:text-slate-700 text-sm">
              Limpar
            </Link>
          )}
        </form>
        {rankingPersonalizado ? (
          <RankingLista ranking={rankingPersonalizado} premios={premiosSemanal} pontuacaoMinima={pontuacaoMinimaPremio} />
        ) : (
          <p className="text-slate-400 dark:text-slate-500 text-sm">
            Escolhe uma data de início pra ver o ranking só daquele período — de sexta a domingo, de uma semana específica, etc.
          </p>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Ranking da semana</h2>
        <RankingLista ranking={rankingSemanal} premios={premiosSemanal} pontuacaoMinima={pontuacaoMinimaPremio} />
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Ranking do mês</h2>
        <RankingLista ranking={rankingMensal} premios={premiosMensal} pontuacaoMinima={pontuacaoMinimaPremio} />
      </section>

      {souAdmin && (
        <section>
          <RankingConfigForm
            pontosPorAtendimento={pontos.pontosPorAtendimento}
            pontosPorVendaProduto={pontos.pontosPorVendaProduto}
            pontosPorAssinatura={pontos.pontosPorAssinatura}
            pontosPorIndicacaoConvertida={pontos.pontosPorIndicacaoConvertida}
            premio1LugarSemanal={configuracao?.premio1LugarSemanal ?? null}
            premio2LugarSemanal={configuracao?.premio2LugarSemanal ?? null}
            premio3LugarSemanal={configuracao?.premio3LugarSemanal ?? null}
            premio1LugarMensal={configuracao?.premio1LugarMensal ?? null}
            premio2LugarMensal={configuracao?.premio2LugarMensal ?? null}
            premio3LugarMensal={configuracao?.premio3LugarMensal ?? null}
            pontuacaoMinimaPremio={pontuacaoMinimaPremio}
          />
        </section>
      )}
    </div>
  );
}
