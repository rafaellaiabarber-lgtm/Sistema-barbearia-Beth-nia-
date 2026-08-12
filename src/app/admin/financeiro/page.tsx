import { prisma } from "@/lib/prisma";
import { formatarReais, LABEL_FORMA_PAGAMENTO, LABEL_CATEGORIA_DESPESA } from "@/lib/format";
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

  const [atendimentos, servicos, barbeiros, movimentos] = await Promise.all([
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
    prisma.movimentoCaixa.findMany({ where: { criadoEm: { gte: inicio, lte: fim } } }),
  ]);

  const totalCentavos = atendimentos.reduce((s, a) => s + a.precoTotalCentavos, 0);

  const porFormaPagamento = new Map<string, number>();
  for (const a of atendimentos) {
    if (!a.formaPagamento) continue;
    porFormaPagamento.set(a.formaPagamento, (porFormaPagamento.get(a.formaPagamento) ?? 0) + a.precoTotalCentavos);
  }
  for (const m of movimentos) {
    if (m.tipo !== "ENTRADA" || !m.formaPagamento) continue;
    porFormaPagamento.set(m.formaPagamento, (porFormaPagamento.get(m.formaPagamento) ?? 0) + m.valorCentavos);
  }

  const despesas = movimentos.filter((m) => m.tipo === "SAIDA");
  const totalDespesasCentavos = despesas.reduce((s, m) => s + m.valorCentavos, 0);
  const despesasPorCategoria = new Map<string, number>();
  for (const m of despesas) {
    const chave = m.categoria ?? "OUTRA";
    despesasPorCategoria.set(chave, (despesasPorCategoria.get(chave) ?? 0) + m.valorCentavos);
  }

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
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-slate-500 text-sm">Despesas no período</p>
          <p className="text-2xl font-bold text-red-600">{formatarReais(totalDespesasCentavos)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Faturamento por forma de pagamento</h2>
          {porFormaPagamento.size === 0 ? (
            <p className="text-slate-400 text-sm">Sem lançamentos com forma de pagamento no período.</p>
          ) : (
            <div className="space-y-2">
              {[...porFormaPagamento.entries()].map(([forma, valor]) => (
                <div key={forma} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{LABEL_FORMA_PAGAMENTO[forma] ?? forma}</span>
                  <span className="font-semibold text-blue-600">{formatarReais(valor)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Despesas por categoria</h2>
          {despesasPorCategoria.size === 0 ? (
            <p className="text-slate-400 text-sm">Nenhuma despesa lançada no período.</p>
          ) : (
            <div className="space-y-2">
              {[...despesasPorCategoria.entries()].map(([categoria, valor]) => (
                <div key={categoria} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{LABEL_CATEGORIA_DESPESA[categoria] ?? categoria}</span>
                  <span className="font-semibold text-red-600">{formatarReais(valor)}</span>
                </div>
              ))}
            </div>
          )}
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
