import { prisma } from "@/lib/prisma";
import { formatarReais } from "@/lib/format";
import { type Periodo, calcularIntervalo, chavePeriodo, validarPeriodo } from "@/lib/periodo";
import { marcarComissaoPaga, desmarcarComissaoPaga } from "@/lib/actions/comissoes";
import { comissaoServicos, comissaoProdutos } from "@/lib/comissao";
import { FiltroRelatorio } from "../filtro-relatorio";
import { CorrigirComissaoCobertaButton } from "./corrigir-comissao-coberta-button";
import { CalculadoraComissaoCombinada } from "./calculadora-comissao-combinada";
import { Valor } from "../../valor";

export default async function ComissoesPage({
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
  const periodo: Periodo = validarPeriodo(periodoParam, "hoje");
  const { inicio, fim } = calcularIntervalo(periodo, new Date(), { dataInicio, dataFim });
  const podeMarcarPago = periodo !== "personalizado" && periodo !== "dia";
  const chave = podeMarcarPago ? chavePeriodo(periodo) : "";

  const [atendimentos, servicos, barbeiros, vendasProduto] = await Promise.all([
    prisma.atendimento.findMany({
      where: {
        status: "CONCLUIDO",
        concluidoEm: { gte: inicio, lte: fim },
        ...(barbeiroId ? { barbeiroId } : {}),
        ...(servicoId ? { servicos: { some: { servicoId } } } : {}),
      },
      include: { barbeiro: true, servicos: true },
      orderBy: { concluidoEm: "desc" },
    }),
    prisma.servico.findMany({ orderBy: { nome: "asc" } }),
    prisma.barbeiro.findMany({ orderBy: { nome: "asc" } }),
    prisma.vendaProduto.findMany({
      where: { criadoEm: { gte: inicio, lte: fim }, ...(barbeiroId ? { barbeiroId } : {}) },
    }),
  ]);

  const barbeirosPorId = new Map(barbeiros.map((b) => [b.id, b]));

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
  const vendasPorBarbeiro = new Map<string, typeof vendasProduto>();
  for (const v of vendasProduto) {
    if (!v.barbeiroId) continue;
    vendasPorBarbeiro.set(v.barbeiroId, [...(vendasPorBarbeiro.get(v.barbeiroId) ?? []), v]);
  }
  for (const [barbeiroId, vendas] of vendasPorBarbeiro) {
    const barbeiro = barbeirosPorId.get(barbeiroId);
    if (!barbeiro) continue;
    const atual = porBarbeiro.get(barbeiroId) ?? { nome: barbeiro.nome, totalCentavos: 0, comissaoCentavos: 0, qtd: 0 };
    atual.comissaoCentavos += comissaoProdutos(vendas);
    porBarbeiro.set(barbeiroId, atual);
  }

  const pagamentos = podeMarcarPago
    ? await prisma.pagamentoComissao.findMany({
        where: {
          periodo: periodo.toUpperCase() as "HOJE" | "SEMANA" | "MES",
          chave,
          barbeiroId: { in: [...porBarbeiro.keys()] },
        },
      })
    : [];
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

  const barbeiroSelecionado = barbeiroId ? barbeirosPorId.get(barbeiroId) : null;
  const servicoSelecionado = servicoId ? servicos.find((s) => s.id === servicoId) : null;
  const itensDoServico = servicoId ? atendimentos.flatMap((a) => a.servicos.filter((s) => s.servicoId === servicoId)) : [];
  const periodoLabel = `${inicio.toLocaleDateString("pt-BR")} até ${fim.toLocaleDateString("pt-BR")}`;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Comissões</h1>

      <CorrigirComissaoCobertaButton />

      <FiltroRelatorio
        basePath="/admin/comissoes"
        periodo={periodo}
        dataInicio={dataInicio}
        dataFim={dataFim}
        servicoId={servicoId}
        barbeiroId={barbeiroId}
        servicos={servicos}
        barbeiros={barbeiros.filter((b) => b.ativo)}
      />

      {barbeiroSelecionado && servicoSelecionado && itensDoServico.length > 0 && (
        <CalculadoraComissaoCombinada
          barbeiroNome={barbeiroSelecionado.nome}
          servicoNome={servicoSelecionado.nome}
          periodoLabel={periodoLabel}
          quantidade={itensDoServico.length}
          comissaoAtualCentavos={comissaoServicos(itensDoServico, barbeiroSelecionado.comissaoPercentual)}
        />
      )}

      {!podeMarcarPago && (
        <p className="text-neutral-400 dark:text-neutral-500 text-xs mb-4">
          Período personalizado: marcar comissão como paga fica disponível só em Hoje/Semana/Mês.
        </p>
      )}

      <div className="space-y-2 mb-8">
        {[...porBarbeiro.entries()].map(([id, b]) => {
          const pago = pagosPorBarbeiro.get(id);
          return (
            <div
              key={id}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{b.nome}</p>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                    {b.qtd} atendimento(s) · faturamento <Valor>{formatarReais(b.totalCentavos)}</Valor>
                  </p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <p className="text-orange-600 dark:text-orange-400 font-bold text-lg"><Valor>{formatarReais(b.comissaoCentavos)}</Valor></p>
                  {podeMarcarPago &&
                    (pago ? (
                      <form action={desmarcarComissaoPaga.bind(null, id, periodo as "hoje" | "semana" | "mes", chave)}>
                        <button className="rounded-lg bg-green-50 dark:bg-green-950 text-green-700 border border-green-200 px-3 py-1.5 text-sm font-medium">
                          ✓ Pago — desmarcar
                        </button>
                      </form>
                    ) : (
                      <form
                        action={marcarComissaoPaga.bind(
                          null,
                          id,
                          periodo as "hoje" | "semana" | "mes",
                          chave,
                          b.comissaoCentavos
                        )}
                      >
                      <button className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 text-sm font-medium">
                        Marcar como pago
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        {porBarbeiro.size === 0 && <p className="text-neutral-400 dark:text-neutral-500">Nenhum atendimento no período.</p>}
      </div>

      <h2 className="text-lg font-semibold mb-3">Serviços mais vendidos no período</h2>
      <div className="space-y-2">
        {ranking.map((r, i) => (
          <div
            key={r.nome}
            className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 text-sm shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-orange-600 dark:text-orange-400 font-bold w-6 text-center">{i + 1}º</span>
              <span className="font-medium">{r.nome}</span>
            </div>
            <div className="text-right">
              <p className="font-semibold">{r.qtd}x</p>
              <p className="text-neutral-400 dark:text-neutral-500 text-xs"><Valor>{formatarReais(r.totalCentavos)}</Valor></p>
            </div>
          </div>
        ))}
        {ranking.length === 0 && <p className="text-neutral-400 dark:text-neutral-500">Nenhum serviço vendido no período.</p>}
      </div>
    </div>
  );
}
