import { prisma } from "@/lib/prisma";
import { formatarReais, LABEL_FORMA_PAGAMENTO, LABEL_CATEGORIA_DESPESA, paraCampoDataHora } from "@/lib/format";
import { type Periodo, calcularIntervalo, validarPeriodo } from "@/lib/periodo";
import { comissaoServicos, comissaoProdutos } from "@/lib/comissao";
import { requireSession } from "@/lib/session";
import { FiltroRelatorio, normalizarServicoIds } from "../filtro-relatorio";
import { BotaoExcluirAtendimento } from "../excluir-atendimento-button";
import { EditarHorarioAtendimento } from "../editar-horario-atendimento";
import { EditarComissaoServico } from "../editar-comissao-servico";
import { TaxaCartaoForm } from "./taxa-cartao-form";
import { Valor } from "../../valor";

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{
    periodo?: string;
    dataInicio?: string;
    dataFim?: string;
    servicoId?: string | string[];
    barbeiroId?: string;
  }>;
}) {
  const session = await requireSession(["ADMIN"]);
  const { periodo: periodoParam, dataInicio, dataFim, servicoId, barbeiroId } = await searchParams;
  const servicoIds = normalizarServicoIds(servicoId);
  const periodo: Periodo = validarPeriodo(periodoParam, "hoje");
  const { inicio, fim } = calcularIntervalo(periodo, new Date(), { dataInicio, dataFim });

  const [atendimentos, servicos, barbeiros, movimentos, configuracaoFinanceira, vendasProduto] = await Promise.all([
    prisma.atendimento.findMany({
      where: {
        status: "CONCLUIDO",
        concluidoEm: { gte: inicio, lte: fim },
        ...(barbeiroId ? { barbeiroId } : {}),
        ...(servicoIds.length > 0 ? { servicos: { some: { servicoId: { in: servicoIds } } } } : {}),
      },
      include: { barbeiro: true, cliente: true, servicos: true },
      orderBy: { concluidoEm: "desc" },
    }),
    prisma.servico.findMany({ orderBy: { nome: "asc" } }),
    prisma.barbeiro.findMany({ orderBy: { nome: "asc" } }),
    prisma.movimentoCaixa.findMany({ where: { criadoEm: { gte: inicio, lte: fim } } }),
    prisma.configuracaoFinanceira.findUnique({ where: { barbeariaId: session.barbeariaId } }),
    prisma.vendaProduto.findMany({
      where: { criadoEm: { gte: inicio, lte: fim }, ...(barbeiroId ? { barbeiroId } : {}) },
    }),
  ]);

  const totalServicosCentavos = atendimentos.reduce((s, a) => s + a.precoTotalCentavos, 0);
  const totalProdutosCentavos = vendasProduto.reduce((s, v) => s + v.totalCentavos, 0);
  const totalCentavos = totalServicosCentavos + totalProdutosCentavos;

  const porFormaPagamento = new Map<string, number>();
  for (const a of atendimentos) {
    if (!a.formaPagamento) continue;
    porFormaPagamento.set(a.formaPagamento, (porFormaPagamento.get(a.formaPagamento) ?? 0) + a.precoTotalCentavos);
  }
  for (const m of movimentos) {
    if (m.tipo !== "ENTRADA" || !m.formaPagamento) continue;
    porFormaPagamento.set(m.formaPagamento, (porFormaPagamento.get(m.formaPagamento) ?? 0) + m.valorCentavos);
  }

  const taxaCartaoPercentualX100 = configuracaoFinanceira?.taxaCartaoPercentualX100 ?? null;
  const cartaoTotalCentavos = porFormaPagamento.get("CARTAO") ?? 0;
  const taxaCartaoEstimadaCentavos =
    taxaCartaoPercentualX100 !== null ? Math.round((cartaoTotalCentavos * taxaCartaoPercentualX100) / 10000) : null;

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
  const barbeirosPorId = new Map(barbeiros.map((b) => [b.id, b]));
  const vendasPorBarbeiro = new Map<string, typeof vendasProduto>();
  for (const v of vendasProduto) {
    if (!v.barbeiroId) continue;
    vendasPorBarbeiro.set(v.barbeiroId, [...(vendasPorBarbeiro.get(v.barbeiroId) ?? []), v]);
  }
  for (const [barbeiroId, vendas] of vendasPorBarbeiro) {
    const barbeiro = barbeirosPorId.get(barbeiroId);
    if (!barbeiro) continue;
    const atual = porBarbeiro.get(barbeiroId) ?? { nome: barbeiro.nome, totalCentavos: 0, comissaoCentavos: 0, qtd: 0 };
    atual.totalCentavos += vendas.reduce((s, v) => s + v.totalCentavos, 0);
    atual.comissaoCentavos += comissaoProdutos(vendas);
    porBarbeiro.set(barbeiroId, atual);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Financeiro</h1>

      <FiltroRelatorio
        basePath="/admin/financeiro"
        periodo={periodo}
        dataInicio={dataInicio}
        dataFim={dataFim}
        servicoIds={servicoIds}
        barbeiroId={barbeiroId}
        servicos={servicos}
        barbeiros={barbeiros}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">Faturamento total</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400"><Valor>{formatarReais(totalCentavos)}</Valor></p>
          <p className="text-neutral-400 dark:text-neutral-500 text-xs mt-1">
            serviços <Valor>{formatarReais(totalServicosCentavos)}</Valor> · produtos <Valor>{formatarReais(totalProdutosCentavos)}</Valor>
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">Atendimentos concluídos</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{atendimentos.length}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">Despesas no período</p>
          <p className="text-2xl font-bold text-red-600"><Valor>{formatarReais(totalDespesasCentavos)}</Valor></p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-3">Faturamento por forma de pagamento</h2>
          {porFormaPagamento.size === 0 ? (
            <p className="text-neutral-400 dark:text-neutral-500 text-sm">Sem lançamentos com forma de pagamento no período.</p>
          ) : (
            <div className="space-y-2 mb-3">
              {[...porFormaPagamento.entries()].map(([forma, valor]) => (
                <div key={forma}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-300">{LABEL_FORMA_PAGAMENTO[forma] ?? forma}</span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400"><Valor>{formatarReais(valor)}</Valor></span>
                  </div>
                  {forma === "CARTAO" && taxaCartaoEstimadaCentavos !== null && (
                    <div className="flex items-center justify-between text-xs text-neutral-400 dark:text-neutral-500 pl-2">
                      <span>Taxa estimada da maquininha</span>
                      <span>-<Valor>{formatarReais(taxaCartaoEstimadaCentavos)}</Valor></span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <TaxaCartaoForm taxaCartaoPercentualX100={taxaCartaoPercentualX100} />
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-3">Despesas por categoria</h2>
          {despesasPorCategoria.size === 0 ? (
            <p className="text-neutral-400 dark:text-neutral-500 text-sm">Nenhuma despesa lançada no período.</p>
          ) : (
            <div className="space-y-2">
              {[...despesasPorCategoria.entries()].map(([categoria, valor]) => (
                <div key={categoria} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-300">{LABEL_CATEGORIA_DESPESA[categoria] ?? categoria}</span>
                  <span className="font-semibold text-red-600"><Valor>{formatarReais(valor)}</Valor></span>
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
            className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm"
          >
            <div>
              <p className="font-semibold">{b.nome}</p>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">{b.qtd} atendimento(s)</p>
            </div>
            <div className="text-right">
              <p className="text-orange-600 dark:text-orange-400 font-semibold"><Valor>{formatarReais(b.totalCentavos)}</Valor></p>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">comissão: <Valor>{formatarReais(b.comissaoCentavos)}</Valor></p>
            </div>
          </div>
        ))}
        {porBarbeiro.size === 0 && <p className="text-neutral-400 dark:text-neutral-500">Nenhum atendimento no período.</p>}
      </div>

      <h2 className="text-lg font-semibold mb-3">Atendimentos</h2>
      <div className="space-y-2">
        {atendimentos.map((a) => (
          <div key={a.id} className="flex flex-col gap-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 text-sm shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-neutral-800 dark:text-neutral-100">
                  {a.cliente.nome} — {a.servicos.map((s) => s.nomeSnapshot).join(", ")}
                </p>
                <p className="text-neutral-400 dark:text-neutral-500">
                  {a.barbeiro?.nome ?? "—"} · {a.concluidoEm?.toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <p className="text-orange-600 dark:text-orange-400 font-semibold"><Valor>{formatarReais(a.precoTotalCentavos)}</Valor></p>
                <BotaoExcluirAtendimento atendimentoId={a.id} />
              </div>
            </div>
            <EditarHorarioAtendimento
              atendimentoId={a.id}
              chamadoEmValor={a.chamadoEm ? paraCampoDataHora(a.chamadoEm) : null}
              concluidoEmValor={a.concluidoEm ? paraCampoDataHora(a.concluidoEm) : ""}
            />
            {a.barbeiro && (
              <div className="space-y-1 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                {a.servicos.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-neutral-400 dark:text-neutral-500 text-xs">
                      {s.nomeSnapshot} · comissão{" "}
                      <Valor>{formatarReais(comissaoServicos([s], a.barbeiro!.comissaoPercentual))}</Valor>
                    </span>
                    <EditarComissaoServico
                      atendimentoServicoId={s.id}
                      valorAtualCentavos={s.precoComissaoCentavos ?? s.precoCentavos}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {atendimentos.length === 0 && <p className="text-neutral-400 dark:text-neutral-500">Nenhum atendimento no período.</p>}
      </div>
    </div>
  );
}
