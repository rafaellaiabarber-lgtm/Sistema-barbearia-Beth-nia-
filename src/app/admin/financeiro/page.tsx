import { prisma } from "@/lib/prisma";
import { formatarReais } from "@/lib/format";
import { type Periodo, calcularIntervalo } from "@/lib/periodo";
import { comissaoServicos } from "@/lib/comissao";
import { FiltroRelatorio } from "../filtro-relatorio";
import { BotaoExcluirAtendimento } from "../excluir-atendimento-button";

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{
    periodo?: string;
    dataInicio?: string;
    dataFim?: string;
    servicoId?: string;
    barbeiroId?: string;
  }>;
}) {
  const { periodo: periodoParam, dataInicio, dataFim, servicoId, barbeiroId } = await searchParams;
  const periodo: Periodo =
    periodoParam === "semana" || periodoParam === "mes" || periodoParam === "personalizado"
      ? periodoParam
      : "hoje";
  const { inicio, fim } = calcularIntervalo(periodo, new Date(), { dataInicio, dataFim });

  const [atendimentos, servicos, barbeiros] = await Promise.all([
    prisma.atendimento.findMany({
      where: {
        status: "CONCLUIDO",
        concluidoEm: { gte: inicio, lte: fim },
        ...(barbeiroId ? { barbeiroId } : {}),
        ...(servicoId ? { servicos: { some: { servicoId } } } : {}),
      },
      include: { barbeiro: true, cliente: true, servicos: true },
      orderBy: { concluidoEm: "desc" },
    }),
    prisma.servico.findMany({ orderBy: { nome: "asc" } }),
    prisma.barbeiro.findMany({ orderBy: { nome: "asc" } }),
  ]);

  const totalCentavos = atendimentos.reduce((s, a) => s + a.precoTotalCentavos, 0);

  const porBarbeiro = new Map<
    string,
    { nome: string; totalCentavos: number; comissaoCentavos: number; qtd: number }
  >();
  for (const a of atendimentos) {
    if (!a.barbeiro) continue;
    const atual = porBarbeiro.get(a.barbeiro.id) ?? {
      nome: a.barbeiro.nome,
      totalCentavos: 0,
      comissaoCentavos: 0,
      qtd: 0,
    };
    atual.totalCentavos += a.precoTotalCentavos;
    atual.comissaoCentavos += comissaoServicos(a.servicos, a.barbeiro.comissaoPercentual);
    atual.qtd += 1;
    porBarbeiro.set(a.barbeiro.id, atual);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Financeiro</h1>

      <FiltroRelatorio
        basePath="/admin/financeiro"
        periodo={periodo}
        dataInicio={dataInicio}
        dataFim={dataFim}
        servicoId={servicoId}
        barbeiroId={barbeiroId}
        servicos={servicos}
        barbeiros={barbeiros}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-slate-500 text-sm">Faturamento total</p>
          <p className="text-2xl font-bold text-blue-600">{formatarReais(totalCentavos)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-slate-500 text-sm">Atendimentos concluídos</p>
          <p className="text-2xl font-bold text-blue-600">{atendimentos.length}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3">Por barbeiro</h2>
      <div className="space-y-2 mb-8">
        {[...porBarbeiro.values()].map((b) => (
          <div
            key={b.nome}
            className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
          >
            <div>
              <p className="font-semibold">{b.nome}</p>
              <p className="text-slate-500 text-sm">{b.qtd} atendimento(s)</p>
            </div>
            <div className="text-right">
              <p className="text-blue-600 font-semibold">{formatarReais(b.totalCentavos)}</p>
              <p className="text-slate-500 text-sm">comissão: {formatarReais(b.comissaoCentavos)}</p>
            </div>
          </div>
        ))}
        {porBarbeiro.size === 0 && <p className="text-slate-400">Nenhum atendimento no período.</p>}
      </div>

      <h2 className="text-lg font-semibold mb-3">Atendimentos</h2>
      <div className="space-y-2">
        {atendimentos.map((a) => (
          <div key={a.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 text-sm shadow-sm">
            <div>
              <p className="text-slate-800">
                {a.cliente.nome} — {a.servicos.map((s) => s.nomeSnapshot).join(", ")}
              </p>
              <p className="text-slate-400">
                {a.barbeiro?.nome ?? "—"} · {a.concluidoEm?.toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-blue-600 font-semibold">{formatarReais(a.precoTotalCentavos)}</p>
              <BotaoExcluirAtendimento atendimentoId={a.id} />
            </div>
          </div>
        ))}
        {atendimentos.length === 0 && <p className="text-slate-400">Nenhum atendimento no período.</p>}
      </div>
    </div>
  );
}
