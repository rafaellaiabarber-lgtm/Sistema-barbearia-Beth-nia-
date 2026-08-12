import { Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatarReais } from "@/lib/format";
import { calcularIntervalo } from "@/lib/periodo";
import { NovoBarbeiroForm } from "./novo-barbeiro-form";
import { BarbeiroRow } from "./barbeiro-row";
import { MetaBonificacaoForm } from "./meta-bonificacao-form";

export default async function BarbeirosPage() {
  const mes = calcularIntervalo("mes", new Date());

  const [barbeiros, atendimentosMes] = await Promise.all([
    prisma.barbeiro.findMany({
      orderBy: [{ ativo: "desc" }, { nome: "asc" }],
      include: { usuario: true },
    }),
    prisma.atendimento.findMany({
      where: { status: "CONCLUIDO", concluidoEm: { gte: mes.inicio, lte: mes.fim }, barbeiroId: { not: null } },
      include: { servicos: true },
    }),
  ]);

  const producaoPorBarbeiro = new Map<
    string,
    { faturamentoCentavos: number; qtd: number; servicos: Map<string, number> }
  >();
  for (const a of atendimentosMes) {
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

  const barbeirosComMetricas = barbeiros.map((b) => {
    const producao = producaoPorBarbeiro.get(b.id) ?? {
      faturamentoCentavos: 0,
      qtd: 0,
      servicos: new Map<string, number>(),
    };
    const ticketMedioCentavos = producao.qtd > 0 ? Math.round(producao.faturamentoCentavos / producao.qtd) : 0;
    const percentualMeta =
      b.metaFaturamentoCentavos && b.metaFaturamentoCentavos > 0
        ? Math.min((producao.faturamentoCentavos / b.metaFaturamentoCentavos) * 100, 999)
        : null;
    const bateuMeta = percentualMeta !== null && percentualMeta >= 100;
    const servicosRealizados = [...producao.servicos.entries()]
      .map(([nome, qtd]) => ({ nome, qtd }))
      .sort((x, y) => y.qtd - x.qtd);

    return {
      barbeiro: b,
      faturamentoCentavos: producao.faturamentoCentavos,
      qtdAtendimentos: producao.qtd,
      ticketMedioCentavos,
      percentualMeta,
      bateuMeta,
      servicosRealizados,
    };
  });

  const ranking = barbeirosComMetricas
    .filter((m) => m.barbeiro.ativo)
    .sort((a, b) => b.faturamentoCentavos - a.faturamentoCentavos);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Barbeiros</h1>

      {ranking.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            Ranking de desempenho (mês) — por faturamento
          </h2>
          <div className="space-y-2">
            {ranking.map((m, i) => (
              <div key={m.barbeiro.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span
                    className={`font-bold w-6 text-center ${i === 0 ? "text-amber-500" : "text-blue-600"}`}
                  >
                    {i + 1}º
                  </span>
                  <span className="font-medium">{m.barbeiro.nome}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-blue-600">{formatarReais(m.faturamentoCentavos)}</span>
                  <span className="text-slate-400 text-xs ml-2">
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
        {barbeirosComMetricas.map((m) => (
          <div key={m.barbeiro.id} className="space-y-2">
            <BarbeiroRow barbeiro={m.barbeiro} />

            <div
              className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm ${
                !m.barbeiro.ativo ? "opacity-50" : ""
              }`}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-slate-400 text-xs">Faturamento (mês)</p>
                  <p className="font-semibold text-blue-600">{formatarReais(m.faturamentoCentavos)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Atendimentos (mês)</p>
                  <p className="font-semibold">{m.qtdAtendimentos}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Ticket médio (mês)</p>
                  <p className="font-semibold">{formatarReais(m.ticketMedioCentavos)}</p>
                </div>
              </div>

              {m.percentualMeta !== null && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>
                      Meta do mês: {formatarReais(m.faturamentoCentavos)} de{" "}
                      {formatarReais(m.barbeiro.metaFaturamentoCentavos!)}
                    </span>
                    <span className={bateuMetaClasse(m.bateuMeta)}>
                      {m.percentualMeta.toFixed(0)}% {m.bateuMeta ? "— meta batida!" : ""}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
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
                  <summary className="cursor-pointer text-sm text-blue-600 hover:underline select-none">
                    Serviços realizados no mês ({m.qtdAtendimentos})
                  </summary>
                  <div className="mt-2 space-y-1">
                    {m.servicosRealizados.map((s) => (
                      <div key={s.nome} className="flex items-center justify-between text-sm py-0.5">
                        <span>{s.nome}</span>
                        <span className="text-slate-500">{s.qtd}x</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        ))}
        {barbeirosComMetricas.length === 0 && <p className="text-slate-400">Nenhum barbeiro cadastrado ainda.</p>}
      </div>
    </div>
  );
}

function bateuMetaClasse(bateu: boolean) {
  return `font-semibold ${bateu ? "text-green-600" : "text-slate-500"}`;
}
