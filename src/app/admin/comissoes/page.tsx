import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatarReais } from "@/lib/format";
import { type Periodo, calcularIntervalo, chavePeriodo } from "@/lib/periodo";
import { marcarComissaoPaga, desmarcarComissaoPaga } from "@/lib/actions/comissoes";

export default async function ComissoesPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo: periodoParam } = await searchParams;
  const periodo: Periodo =
    periodoParam === "semana" || periodoParam === "mes" ? periodoParam : "hoje";
  const { inicio, fim } = calcularIntervalo(periodo);
  const chave = chavePeriodo(periodo);

  const atendimentos = await prisma.atendimento.findMany({
    where: { status: "CONCLUIDO", concluidoEm: { gte: inicio, lte: fim } },
    include: { barbeiro: true, servicos: true },
    orderBy: { concluidoEm: "desc" },
  });

  const porBarbeiro = new Map<
    string,
    { nome: string; comissaoPercentual: number; totalCentavos: number; qtd: number }
  >();
  for (const a of atendimentos) {
    if (!a.barbeiro) continue;
    const atual = porBarbeiro.get(a.barbeiro.id) ?? {
      nome: a.barbeiro.nome,
      comissaoPercentual: a.barbeiro.comissaoPercentual,
      totalCentavos: 0,
      qtd: 0,
    };
    atual.totalCentavos += a.precoTotalCentavos;
    atual.qtd += 1;
    porBarbeiro.set(a.barbeiro.id, atual);
  }

  const pagamentos = await prisma.pagamentoComissao.findMany({
    where: {
      periodo: periodo.toUpperCase() as "HOJE" | "SEMANA" | "MES",
      chave,
      barbeiroId: { in: [...porBarbeiro.keys()] },
    },
  });
  const pagosPorBarbeiro = new Map(pagamentos.map((p) => [p.barbeiroId, p]));

  const rankingServicos = new Map<string, { nome: string; qtd: number; totalCentavos: number }>();
  for (const a of atendimentos) {
    for (const s of a.servicos) {
      const atual = rankingServicos.get(s.nomeSnapshot) ?? {
        nome: s.nomeSnapshot,
        qtd: 0,
        totalCentavos: 0,
      };
      atual.qtd += 1;
      atual.totalCentavos += s.precoCentavos;
      rankingServicos.set(s.nomeSnapshot, atual);
    }
  }
  const ranking = [...rankingServicos.values()].sort((a, b) => b.qtd - a.qtd);

  const abas: { valor: Periodo; label: string }[] = [
    { valor: "hoje", label: "Hoje" },
    { valor: "semana", label: "Esta semana" },
    { valor: "mes", label: "Este mês" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Comissões</h1>

      <div className="flex gap-2 mb-6">
        {abas.map((a) => (
          <Link
            key={a.valor}
            href={`/admin/comissoes?periodo=${a.valor}`}
            className={`rounded-lg px-4 py-2 text-sm border ${
              periodo === a.valor
                ? "bg-blue-600 text-white border-blue-600 font-semibold"
                : "border-slate-300 text-slate-700 hover:bg-slate-100"
            }`}
          >
            {a.label}
          </Link>
        ))}
      </div>

      <div className="space-y-2 mb-8">
        {[...porBarbeiro.entries()].map(([barbeiroId, b]) => {
          const comissao = Math.round((b.totalCentavos * b.comissaoPercentual) / 100);
          const pago = pagosPorBarbeiro.get(barbeiroId);
          return (
            <div
              key={barbeiroId}
              className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
            >
              <div>
                <p className="font-semibold">{b.nome}</p>
                <p className="text-slate-500 text-sm">
                  {b.qtd} atendimento(s) · faturamento {formatarReais(b.totalCentavos)} · comissão{" "}
                  {b.comissaoPercentual}%
                </p>
              </div>
              <div className="text-right flex items-center gap-3">
                <p className="text-blue-600 font-bold text-lg">{formatarReais(comissao)}</p>
                {pago ? (
                  <form action={desmarcarComissaoPaga.bind(null, barbeiroId, periodo, chave)}>
                    <button className="rounded-lg bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 text-sm font-medium">
                      ✓ Pago — desmarcar
                    </button>
                  </form>
                ) : (
                  <form action={marcarComissaoPaga.bind(null, barbeiroId, periodo, chave, comissao)}>
                    <button className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm font-medium">
                      Marcar como pago
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
        {porBarbeiro.size === 0 && <p className="text-slate-400">Nenhum atendimento no período.</p>}
      </div>

      <h2 className="text-lg font-semibold mb-3">Serviços mais vendidos no período</h2>
      <div className="space-y-2">
        {ranking.map((r, i) => (
          <div
            key={r.nome}
            className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 text-sm shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-blue-600 font-bold w-6 text-center">{i + 1}º</span>
              <span className="font-medium">{r.nome}</span>
            </div>
            <div className="text-right">
              <p className="font-semibold">{r.qtd}x</p>
              <p className="text-slate-400 text-xs">{formatarReais(r.totalCentavos)}</p>
            </div>
          </div>
        ))}
        {ranking.length === 0 && <p className="text-slate-400">Nenhum serviço vendido no período.</p>}
      </div>
    </div>
  );
}
