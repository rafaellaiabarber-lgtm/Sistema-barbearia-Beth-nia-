import Link from "next/link";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { calcularIntervalo } from "@/lib/periodo";
import { montarRanking, type ContagemBarbeiro, type PontosPorAcao } from "@/lib/ranking";
import { RankingLista } from "./ranking-lista";
import { RankingConfigForm } from "./ranking-config-form";
import { ThemeToggle } from "../theme-toggle";

async function buscarContagens(
  inicio: Date,
  fim: Date,
  barbeiros: { id: string; nome: string }[]
): Promise<ContagemBarbeiro[]> {
  const [atendimentos, vendas, assinaturas, indicacoes] = await Promise.all([
    prisma.atendimento.groupBy({
      by: ["barbeiroId"],
      where: { status: "CONCLUIDO", concluidoEm: { gte: inicio, lte: fim }, barbeiroId: { not: null } },
      _count: { _all: true },
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

  return barbeiros.map((b) => ({
    barbeiroId: b.id,
    nome: b.nome,
    qtdAtendimentos: contarPara(atendimentos, b.id),
    qtdVendasProduto: contarPara(vendas, b.id),
    qtdAssinaturas: contarPara(assinaturas, b.id),
    qtdIndicacoesConvertidas: contarPara(indicacoes, b.id),
  }));
}

export default async function RankingPage() {
  const session = await requireSession(["ADMIN", "BARBEIRO"]);
  const souAdmin = session.role === "ADMIN";

  const agora = new Date();
  const semana = calcularIntervalo("semana", agora);
  const mes = calcularIntervalo("mes", agora);

  const [barbeirosAtivos, configuracao] = await Promise.all([
    prisma.barbeiro.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.configuracaoRanking.findUnique({ where: { id: "singleton" } }),
  ]);

  const pontos: PontosPorAcao = {
    pontosPorAtendimento: configuracao?.pontosPorAtendimento ?? 1,
    pontosPorVendaProduto: configuracao?.pontosPorVendaProduto ?? 1,
    pontosPorAssinatura: configuracao?.pontosPorAssinatura ?? 1,
    pontosPorIndicacaoConvertida: configuracao?.pontosPorIndicacaoConvertida ?? 1,
  };

  const [contagensSemana, contagensMes] = await Promise.all([
    buscarContagens(semana.inicio, semana.fim, barbeirosAtivos),
    buscarContagens(mes.inicio, mes.fim, barbeirosAtivos),
  ]);

  const rankingSemanal = montarRanking(contagensSemana, pontos);
  const rankingMensal = montarRanking(contagensMes, pontos);

  const premiosSemanal = {
    premio1Centavos: configuracao?.premio1LugarSemanalCentavos ?? null,
    premio2Centavos: configuracao?.premio2LugarSemanalCentavos ?? null,
    premio3Centavos: configuracao?.premio3LugarSemanalCentavos ?? null,
  };
  const premiosMensal = {
    premio1Centavos: configuracao?.premio1LugarMensalCentavos ?? null,
    premio2Centavos: configuracao?.premio2LugarMensalCentavos ?? null,
    premio3Centavos: configuracao?.premio3LugarMensalCentavos ?? null,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Ranking dos barbeiros</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Pontos por atendimento, venda de produto, assinatura vendida e indicação convertida.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800" />
          <Link href="/indicacoes" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
            Indicações
          </Link>
          <Link href={session.role === "ADMIN" ? "/admin" : "/fila"} className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
            {session.role === "ADMIN" ? "Painel admin" : "Voltar pra fila"}
          </Link>
        </div>
      </header>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Ranking da semana</h2>
        <RankingLista ranking={rankingSemanal} premios={premiosSemanal} />
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Ranking do mês</h2>
        <RankingLista ranking={rankingMensal} premios={premiosMensal} />
      </section>

      {souAdmin && (
        <section>
          <RankingConfigForm
            pontosPorAtendimento={pontos.pontosPorAtendimento}
            pontosPorVendaProduto={pontos.pontosPorVendaProduto}
            pontosPorAssinatura={pontos.pontosPorAssinatura}
            pontosPorIndicacaoConvertida={pontos.pontosPorIndicacaoConvertida}
            premio1LugarSemanalCentavos={configuracao?.premio1LugarSemanalCentavos ?? null}
            premio2LugarSemanalCentavos={configuracao?.premio2LugarSemanalCentavos ?? null}
            premio3LugarSemanalCentavos={configuracao?.premio3LugarSemanalCentavos ?? null}
            premio1LugarMensalCentavos={configuracao?.premio1LugarMensalCentavos ?? null}
            premio2LugarMensalCentavos={configuracao?.premio2LugarMensalCentavos ?? null}
            premio3LugarMensalCentavos={configuracao?.premio3LugarMensalCentavos ?? null}
          />
        </section>
      )}
    </div>
  );
}
