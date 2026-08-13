import Link from "next/link";
import { Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatarReais } from "@/lib/format";
import { calcularIntervalo, type Periodo } from "@/lib/periodo";
import { NovoBarbeiroForm } from "./novo-barbeiro-form";
import { BarbeiroRow } from "./barbeiro-row";
import { MetaBonificacaoForm } from "./meta-bonificacao-form";

const LABEL_PERIODO: Record<string, string> = { hoje: "hoje", semana: "esta semana", mes: "este mês" };

export default async function BarbeirosPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo: periodoParam } = await searchParams;
  const periodo: Periodo = periodoParam === "hoje" || periodoParam === "semana" ? periodoParam : "mes";
  const agora = new Date();
  const intervaloSelecionado = calcularIntervalo(periodo, agora);
  const mes = calcularIntervalo("mes", agora);

  const [barbeiros, atendimentosPeriodo, atendimentosMesSeparado] = await Promise.all([
    prisma.barbeiro.findMany({
      orderBy: [{ ativo: "desc" }, { nome: "asc" }],
      include: { usuario: true },
    }),
    prisma.atendimento.findMany({
      where: {
        status: "CONCLUIDO",
        concluidoEm: { gte: intervaloSelecionado.inicio, lte: intervaloSelecionado.fim },
        barbeiroId: { not: null },
      },
      include: { servicos: true },
    }),
    periodo === "mes"
      ? Promise.resolve(null)
      : prisma.atendimento.findMany({
          where: { status: "CONCLUIDO", concluidoEm: { gte: mes.inicio, lte: mes.fim }, barbeiroId: { not: null } },
          select: { barbeiroId: true, precoTotalCentavos: true },
        }),
  ]);

  const producaoPorBarbeiro = new Map<
    string,
    { faturamentoCentavos: number; qtd: number; servicos: Map<string, number> }
  >();
  for (const a of atendimentosPeriodo) {
    if (!a.barbeiroId) continue;
    const atual = producaoPorBarbeiro.get(a.barbeiroId) ?? {
      faturamentoCentavos: 0,
      qtd: 0,
      servicos: new Map<string, number>(),
    };
    atual.faturamentoCentavos += a.precoTotalCentavos;
    atual.qtd += 1;
    for (const s of a.servicos) {
      atual.servicos.set(s.nomeSnapshot, (atual.servicos.get(s.nomeSnapshot) ?? 0) + 1);
    }
    producaoPorBarbeiro.set(a.barbeiroId, atual);
  }

  const faturamentoMesPorBarbeiro = new Map<string, number>();
  if (atendimentosMesSeparado) {
    for (const a of atendimentosMesSeparado) {
      if (!a.barbeiroId) continue;
      faturamentoMesPorBarbeiro.set(a.barbeiroId, (faturamentoMesPorBarbeiro.get(a.barbeiroId) ?? 0) + a.precoTotalCentavos);
    }
  } else {
    for (const [barbeiroId, dados] of producaoPorBarbeiro) {
      faturamentoMesPorBarbeiro.set(barbeiroId, dados.faturamentoCentavos);
    }
  }

  const barbeirosComMetricas = barbeiros.map((b) => {
    const producao = producaoPorBarbeiro.get(b.id) ?? {
      faturamentoCentavos: 0,
      qtd: 0,
      servicos: new Map<string, number>(),
    };
    const faturamentoMesCentavos = faturamentoMesPorBarbeiro.get(b.id) ?? 0;
    const ticketMedioCentavos = producao.qtd > 0 ? Math.round(producao.faturamentoCentavos / producao.qtd) : 0;
    const percentualMeta =
      b.metaFaturamentoCentavos && b.metaFaturamentoCentavos > 0
        ? Math.min((faturamentoMesCentavos / b.metaFaturamentoCentavos) * 100, 999)
        : null;
    const bateuMeta = percentualMeta !== null && percentualMeta >= 100;
    const servicosRealizados = [...producao.servicos.entries()]
      .map(([nome, qtd]) => ({ nome, qtd }))
      .sort((x, y) => y.qtd - x.qtd);

    return {
      barbeiro: b,
      faturamentoCentavos: producao.faturamentoCentavos,
      faturamentoMesCentavos,
      qtdAtendimentos: producao.qtd,
      ticketMedioCentavos,
      percentualMeta,
      bateuMeta,
      servicosRealizados,
    };
  });

  const ativos = barbeirosComMetricas.filter((m) => m.barbeiro.ativo);
  const inativos = barbeirosComMetricas.filter((m) => !m.barbeiro.ativo);

  const ranking = [...ativos].sort((a, b) => b.faturamentoCentavos - a.faturamentoCentavos);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Barbeiros</h1>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(["hoje", "semana", "mes"] as const).map((p) => (
          <Link
            key={p}
            href={`/admin/barbeiros?periodo=${p}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium border ${
              periodo === p
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400"
            }`}
          >
            {p === "hoje" ? "Hoje" : p === "semana" ? "Esta semana" : "Este mês"}
          </Link>
        ))}
      </div>

      {ranking.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm mb-6">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            Ranking de desempenho ({LABEL_PERIODO[periodo]}) — por faturamento
          </h2>
          <div className="space-y-2">
            {ranking.map((m, i) => (
              <div key={m.barbeiro.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span
                    className={`font-bold w-6 text-center ${i === 0 ? "text-amber-500" : "text-blue-600 dark:text-blue-400"}`}
                  >
                    {i + 1}º
                  </span>
                  <span className="font-medium">{m.barbeiro.nome}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{formatarReais(m.faturamentoCentavos)}</span>
                  <span className="text-slate-400 dark:text-slate-500 text-xs ml-2">
                    {m.qtdAtendimentos} atend. · ticket médio {formatarReais(m.ticketMedioCentavos)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <NovoBarbeiroForm />

      <div className="space-y-2">
        {ativos.map((m) => (
          <div key={m.barbeiro.id} className="space-y-2">
            <BarbeiroRow barbeiro={m.barbeiro} />

            <div
              className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm ${
                !m.barbeiro.ativo ? "opacity-50" : ""
              }`}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-slate-400 dark:text-slate-500 text-xs">Faturamento ({LABEL_PERIODO[periodo]})</p>
                  <p className="font-semibold text-blue-600 dark:text-blue-400">{formatarReais(m.faturamentoCentavos)}</p>
                </div>
                <div>
                  <p className="text-slate-400 dark:text-slate-500 text-xs">Atendimentos ({LABEL_PERIODO[periodo]})</p>
                  <p className="font-semibold">{m.qtdAtendimentos}</p>
                </div>
                <div>
                  <p className="text-slate-400 dark:text-slate-500 text-xs">Ticket médio ({LABEL_PERIODO[periodo]})</p>
                  <p className="font-semibold">{formatarReais(m.ticketMedioCentavos)}</p>
                </div>
              </div>

              {m.percentualMeta !== null && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span>
                      Meta do mês: {formatarReais(m.faturamentoMesCentavos)} de{" "}
                      {formatarReais(m.barbeiro.metaFaturamentoCentavos!)}
                    </span>
                    <span className={bateuMetaClasse(m.bateuMeta)}>
                      {m.percentualMeta.toFixed(0)}% {m.bateuMeta ? "— meta batida!" : ""}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${m.bateuMeta ? "bg-green-500" : "bg-blue-500"}`}
                      style={{ width: `${Math.min(m.percentualMeta, 100)}%` }}
                    />
                  </div>
                  {m.bateuMeta && m.barbeiro.bonificacaoCentavos ? (
                    <p className="text-green-600 text-xs mt-1 font-medium">
                      🎉 Bônus liberado: {formatarReais(m.barbeiro.bonificacaoCentavos)}
                    </p>
                  ) : null}
                </div>
              )}

              <MetaBonificacaoForm
                barbeiroId={m.barbeiro.id}
                metaFaturamentoCentavos={m.barbeiro.metaFaturamentoCentavos}
                bonificacaoCentavos={m.barbeiro.bonificacaoCentavos}
              />

              {m.servicosRealizados.length > 0 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-blue-600 dark:text-blue-400 hover:underline select-none">
                    Serviços realizados ({LABEL_PERIODO[periodo]}) — {m.qtdAtendimentos}
                  </summary>
                  <div className="mt-2 space-y-1">
                    {m.servicosRealizados.map((s) => (
                      <div key={s.nome} className="flex items-center justify-between text-sm py-0.5">
                        <span>{s.nome}</span>
                        <span className="text-slate-500 dark:text-slate-400">{s.qtd}x</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        ))}
        {ativos.length === 0 && <p className="text-slate-400 dark:text-slate-500">Nenhum barbeiro ativo no momento.</p>}
      </div>

      {inativos.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 select-none">
            Barbeiros inativos ({inativos.length})
          </summary>
          <div className="space-y-2 mt-3">
            {inativos.map((m) => (
              <BarbeiroRow key={m.barbeiro.id} barbeiro={m.barbeiro} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function bateuMetaClasse(bateu: boolean) {
  return `font-semibold ${bateu ? "text-green-600" : "text-slate-500 dark:text-slate-400"}`;
}
