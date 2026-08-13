import { prisma } from "@/lib/prisma";
import { formatarReais } from "@/lib/format";
import { calcularIntervalo, intervaloAnterior } from "@/lib/periodo";
import { comissaoServicos, comissaoProdutos } from "@/lib/comissao";
import { calcularMargem, calcularTicketMedio, gerarAlertas, calcularPrevisao, type ComparativoMes } from "@/lib/gerente-virtual";
import { MetaMensalForm } from "./meta-mensal-form";
import { ClienteInativoRow } from "./cliente-inativo-row";

async function buscarComparativo(inicio: Date, fim: Date): Promise<ComparativoMes> {
  const [atendimentos, movimentos, clientesNovos, vendasProduto] = await Promise.all([
    prisma.atendimento.findMany({
      where: { status: "CONCLUIDO", concluidoEm: { gte: inicio, lte: fim } },
      include: { barbeiro: true, servicos: true },
    }),
    prisma.movimentoCaixa.findMany({ where: { tipo: "SAIDA", criadoEm: { gte: inicio, lte: fim } } }),
    prisma.cliente.count({ where: { criadoEm: { gte: inicio, lte: fim } } }),
    prisma.vendaProduto.findMany({ where: { criadoEm: { gte: inicio, lte: fim } } }),
  ]);

  const faturamentoCentavos = atendimentos.reduce((s, a) => s + a.precoTotalCentavos, 0);
  const comissoesCentavos =
    atendimentos.reduce((s, a) => s + (a.barbeiro ? comissaoServicos(a.servicos, a.barbeiro.comissaoPercentual) : 0), 0) +
    comissaoProdutos(vendasProduto);
  const despesasCentavos = movimentos.reduce((s, m) => s + m.valorCentavos, 0);

  return {
    faturamentoCentavos,
    despesasCentavos,
    comissoesCentavos,
    clientesNovos,
    qtdAtendimentos: atendimentos.length,
  };
}

export default async function GerenteVirtualPage({
  searchParams,
}: {
  searchParams: Promise<{ diasSumidos?: string }>;
}) {
  const { diasSumidos: diasSumidosParam } = await searchParams;
  const diasSumidos = Number.parseInt(diasSumidosParam ?? "45", 10) || 45;

  const agora = new Date();
  const mesAtual = calcularIntervalo("mes", agora);
  const mesAnterior = intervaloAnterior("mes", mesAtual.inicio, mesAtual.fim);

  const [comparativoAtual, comparativoAnterior, configuracao, clientesComAtendimento] = await Promise.all([
    buscarComparativo(mesAtual.inicio, mesAtual.fim),
    buscarComparativo(mesAnterior.inicio, mesAnterior.fim),
    prisma.configuracaoFinanceira.findUnique({ where: { id: "singleton" } }),
    prisma.cliente.findMany({
      where: { atendimentos: { some: { status: "CONCLUIDO" } } },
      include: { atendimentos: { where: { status: "CONCLUIDO" }, select: { concluidoEm: true } } },
    }),
  ]);

  const alertas = gerarAlertas(comparativoAtual, comparativoAnterior);
  const margemAtual = calcularMargem(comparativoAtual);
  const ticketMedioAtual = calcularTicketMedio(comparativoAtual);

  const diaDoMes = agora.getDate();
  const diasNoMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).getDate();
  const metaCentavos = configuracao?.metaFaturamentoMensalCentavos ?? null;
  const previsao = calcularPrevisao(comparativoAtual.faturamentoCentavos, diaDoMes, diasNoMes, metaCentavos);

  const limiteSumido = new Date(agora);
  limiteSumido.setDate(limiteSumido.getDate() - diasSumidos);

  const clientesSumidos = clientesComAtendimento
    .map((c) => {
      const ultimaVisita = c.atendimentos.reduce<Date | null>((max, a) => {
        if (!a.concluidoEm) return max;
        return !max || a.concluidoEm > max ? a.concluidoEm : max;
      }, null);
      return { id: c.id, nome: c.nome, telefone: c.telefone, ultimaVisita, qtdVisitas: c.atendimentos.length };
    })
    .filter((c) => c.telefone && c.ultimaVisita && c.ultimaVisita < limiteSumido)
    .sort((a, b) => (a.ultimaVisita && b.ultimaVisita ? a.ultimaVisita.getTime() - b.ultimaVisita.getTime() : 0));

  function diasDesde(data: Date) {
    return Math.floor((agora.getTime() - data.getTime()) / (1000 * 60 * 60 * 24));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Gerente Virtual</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        Diagnóstico, previsão e oportunidades — calculados automaticamente com os dados da sua barbearia.
      </p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Diagnóstico do mês</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400 text-xs">Faturamento</p>
            <p className="text-xl font-bold text-lime-600">{formatarReais(comparativoAtual.faturamentoCentavos)}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400 text-xs">Margem</p>
            <p className={`text-xl font-bold ${margemAtual < 0 ? "text-red-600" : "text-lime-600"}`}>
              {margemAtual.toFixed(0)}%
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400 text-xs">Ticket médio</p>
            <p className="text-xl font-bold text-lime-600">{formatarReais(ticketMedioAtual)}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400 text-xs">Clientes novos</p>
            <p className="text-xl font-bold text-lime-600">{comparativoAtual.clientesNovos}</p>
          </div>
        </div>

        {alertas.length === 0 ? (
          <p className="text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            Nada fora do padrão em relação ao mês passado ainda — sem alertas por aqui.
          </p>
        ) : (
          <div className="space-y-2">
            {alertas.map((a, i) => (
              <div
                key={i}
                className={`rounded-xl p-4 shadow-sm border ${
                  a.tipo === "atencao" ? "bg-amber-50 dark:bg-amber-950 border-amber-200 text-amber-800" : "bg-green-50 dark:bg-green-950 border-green-200 text-green-800"
                }`}
              >
                {a.tipo === "atencao" ? "⚠️ " : "✅ "}
                {a.texto}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Previsão de faturamento</h2>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm mb-3">
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">
            No ritmo atual ({formatarReais(previsao.ritmoDiarioCentavos)}/dia), você deve fechar o mês em:
          </p>
          <p className="text-2xl font-bold text-lime-600 mb-3">{formatarReais(previsao.previsaoFechamentoCentavos)}</p>

          {metaCentavos !== null ? (
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Meta do mês: {formatarReais(metaCentavos)}.{" "}
              {previsao.faltamPorDiaCentavos !== null && previsao.faltamPorDiaCentavos > 0 ? (
                <>
                  Faltam {formatarReais(metaCentavos - comparativoAtual.faturamentoCentavos)} — precisa fazer{" "}
                  <span className="font-semibold">{formatarReais(previsao.faltamPorDiaCentavos)}/dia</span> nos
                  próximos {previsao.diasRestantes} dia(s) pra bater.
                </>
              ) : (
                <span className="text-green-600 font-medium">Meta já batida ou no caminho certo! 🎉</span>
              )}
            </p>
          ) : (
            <p className="text-slate-400 dark:text-slate-500 text-sm">Defina uma meta mensal abaixo pra ver quanto falta por dia.</p>
          )}
        </div>
        <MetaMensalForm metaAtual={metaCentavos} />
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold">Clientes sumidos ({clientesSumidos.length})</h2>
          <form method="get" className="flex items-center gap-2">
            <label className="text-slate-500 dark:text-slate-400 text-sm">Sem voltar há mais de</label>
            <input
              type="number"
              name="diasSumidos"
              defaultValue={diasSumidos}
              min={1}
              className="w-16 rounded-lg border border-slate-300 dark:border-slate-600 px-2 py-1 text-sm"
            />
            <span className="text-slate-500 dark:text-slate-400 text-sm">dias</span>
            <button type="submit" className="rounded-lg bg-lime-600 hover:bg-lime-700 text-slate-950 text-sm font-medium px-3 py-1.5">
              Filtrar
            </button>
          </form>
        </div>
        <div className="space-y-2">
          {clientesSumidos.map((c) => (
            <ClienteInativoRow
              key={c.id}
              nome={c.nome}
              telefone={c.telefone!}
              diasSemVoltar={diasDesde(c.ultimaVisita!)}
              qtdVisitas={c.qtdVisitas}
            />
          ))}
          {clientesSumidos.length === 0 && (
            <p className="text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              Nenhum cliente sumido há mais de {diasSumidos} dias — ótimo sinal!
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
