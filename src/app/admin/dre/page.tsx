import { prisma } from "@/lib/prisma";
import { formatarReais } from "@/lib/format";
import { type Periodo, calcularIntervalo } from "@/lib/periodo";
import { comissaoServicos, comissaoProdutos } from "@/lib/comissao";
import { FiltroRelatorio } from "../filtro-relatorio";

export default async function DrePage({
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

  const [atendimentos, movimentos, servicos, barbeiros, configuracaoFinanceira, vendasProduto] = await Promise.all([
    prisma.atendimento.findMany({
      where: {
        status: "CONCLUIDO",
        concluidoEm: { gte: inicio, lte: fim },
        ...(barbeiroId ? { barbeiroId } : {}),
      },
      include: { barbeiro: true, servicos: true },
    }),
    prisma.movimentoCaixa.findMany({ where: { criadoEm: { gte: inicio, lte: fim } } }),
    prisma.servico.findMany({ orderBy: { nome: "asc" } }),
    prisma.barbeiro.findMany({ orderBy: { nome: "asc" } }),
    prisma.configuracaoFinanceira.findUnique({ where: { id: "singleton" } }),
    prisma.vendaProduto.findMany({
      where: { criadoEm: { gte: inicio, lte: fim }, ...(barbeiroId ? { barbeiroId } : {}) },
    }),
  ]);

  const faturamentoAtendimentosCentavos = atendimentos.reduce((s, a) => s + a.precoTotalCentavos, 0);
  const entradasManuaisCentavos = movimentos
    .filter((m) => m.tipo === "ENTRADA")
    .reduce((s, m) => s + m.valorCentavos, 0);
  const receitaBrutaCentavos = faturamentoAtendimentosCentavos + entradasManuaisCentavos;

  const custoServicosCentavos = atendimentos.reduce(
    (s, a) => s + a.servicos.reduce((soma, serv) => soma + serv.custoCentavos, 0),
    0
  );
  const comissoesCentavos =
    atendimentos.reduce((s, a) => s + (a.barbeiro ? comissaoServicos(a.servicos, a.barbeiro.comissaoPercentual) : 0), 0) +
    comissaoProdutos(vendasProduto);

  const despesasPorCategoria = new Map<string, number>();
  for (const m of movimentos) {
    if (m.tipo !== "SAIDA") continue;
    const chave = m.categoria ?? "OUTRA";
    despesasPorCategoria.set(chave, (despesasPorCategoria.get(chave) ?? 0) + m.valorCentavos);
  }
  // Taxa de cartão: se houver um percentual configurado, deduz automaticamente uma estimativa
  // sobre o faturamento pago no cartão no período — não depende de lançar manualmente cada
  // taxa cobrada pela maquininha. Sem percentual configurado, usa as saídas manuais categorizadas
  // como "Taxa de cartão" (comportamento anterior).
  const cartaoTotalCentavos =
    atendimentos.filter((a) => a.formaPagamento === "CARTAO").reduce((s, a) => s + a.precoTotalCentavos, 0) +
    movimentos
      .filter((m) => m.tipo === "ENTRADA" && m.formaPagamento === "CARTAO")
      .reduce((s, m) => s + m.valorCentavos, 0);
  const taxaCartaoPercentualX100 = configuracaoFinanceira?.taxaCartaoPercentualX100 ?? null;

  const impostosCentavos = despesasPorCategoria.get("IMPOSTO") ?? 0;
  const taxaCartaoCentavos =
    taxaCartaoPercentualX100 !== null
      ? Math.round((cartaoTotalCentavos * taxaCartaoPercentualX100) / 10000)
      : (despesasPorCategoria.get("TAXA_CARTAO") ?? 0);
  const despesasFixasCentavos = despesasPorCategoria.get("FIXA") ?? 0;
  const despesasVariaveisCentavos = despesasPorCategoria.get("VARIAVEL") ?? 0;
  const proLaboreCentavos = despesasPorCategoria.get("PRO_LABORE") ?? 0;
  const outrasDespesasCentavos = despesasPorCategoria.get("OUTRA") ?? 0;

  const receitaLiquidaCentavos = receitaBrutaCentavos - impostosCentavos;
  const lucroLiquidoCentavos =
    receitaLiquidaCentavos -
    custoServicosCentavos -
    comissoesCentavos -
    taxaCartaoCentavos -
    despesasFixasCentavos -
    despesasVariaveisCentavos -
    proLaboreCentavos -
    outrasDespesasCentavos;

  const margemPercentual =
    receitaBrutaCentavos > 0 ? ((lucroLiquidoCentavos / receitaBrutaCentavos) * 100).toFixed(1) : "0,0";

  const linhas: { label: string; valorCentavos: number; destaque?: boolean; subtotal?: boolean }[] = [
    { label: "Receita bruta", valorCentavos: receitaBrutaCentavos },
    { label: "(-) Impostos", valorCentavos: -impostosCentavos },
    { label: "= Receita líquida", valorCentavos: receitaLiquidaCentavos, subtotal: true },
    { label: "(-) Custo dos serviços", valorCentavos: -custoServicosCentavos },
    { label: "(-) Comissões", valorCentavos: -comissoesCentavos },
    { label: "(-) Taxa de cartão", valorCentavos: -taxaCartaoCentavos },
    { label: "(-) Despesas fixas", valorCentavos: -despesasFixasCentavos },
    { label: "(-) Despesas variáveis", valorCentavos: -despesasVariaveisCentavos },
    { label: "(-) Pró-labore", valorCentavos: -proLaboreCentavos },
    { label: "(-) Outras despesas", valorCentavos: -outrasDespesasCentavos },
    { label: "= Lucro líquido", valorCentavos: lucroLiquidoCentavos, destaque: true },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">DRE simplificada</h1>

      <FiltroRelatorio
        basePath="/admin/dre"
        periodo={periodo}
        dataInicio={dataInicio}
        dataFim={dataFim}
        barbeiroId={barbeiroId}
        servicos={servicos}
        barbeiros={barbeiros}
        mostrarServico={false}
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden mb-6">
        {linhas.map((l) => (
          <div
            key={l.label}
            className={`flex items-center justify-between px-5 py-3 text-sm ${
              l.subtotal ? "bg-slate-50 dark:bg-black font-semibold border-t border-b border-slate-200 dark:border-slate-800" : ""
            } ${l.destaque ? "bg-lime-50 dark:bg-lime-950 font-bold text-base" : ""} ${
              !l.subtotal && !l.destaque ? "border-b border-slate-100 dark:border-slate-800 last:border-b-0" : ""
            }`}
          >
            <span className={l.destaque ? "text-lime-900 dark:text-lime-200" : "text-slate-700 dark:text-slate-200"}>{l.label}</span>
            <span
              className={
                l.destaque
                  ? l.valorCentavos < 0
                    ? "text-red-600"
                    : "text-lime-700"
                  : l.valorCentavos < 0
                    ? "text-red-500"
                    : "text-slate-800 dark:text-slate-100"
              }
            >
              {formatarReais(l.valorCentavos)}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <p className="text-slate-500 dark:text-slate-400 text-sm">Margem líquida no período</p>
        <p className={`text-2xl font-bold ${lucroLiquidoCentavos < 0 ? "text-red-600" : "text-lime-600 dark:text-lime-400"}`}>
          {margemPercentual}%
        </p>
      </div>

      <p className="text-slate-400 dark:text-slate-500 text-xs mt-6">
        Custo dos serviços e comissões são calculados sobre os atendimentos concluídos no período.
        {taxaCartaoPercentualX100 !== null
          ? ` Taxa de cartão é uma estimativa (${(taxaCartaoPercentualX100 / 100).toFixed(2).replace(".", ",")}% sobre o faturamento pago no cartão), configurável em Financeiro.`
          : " Configure o percentual da taxa de cartão em Financeiro pra ela ser descontada automaticamente aqui."}{" "}
        As demais categorias vêm dos lançamentos de saída registrados no Caixa (manuais ou de contas a pagar
        marcadas como pagas — uma conta pendente não entra nessa conta até ser paga).
      </p>
    </div>
  );
}
