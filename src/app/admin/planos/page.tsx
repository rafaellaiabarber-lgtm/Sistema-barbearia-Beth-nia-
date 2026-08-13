import { prisma } from "@/lib/prisma";
import { formatarReais } from "@/lib/format";
import { calcularIntervalo } from "@/lib/periodo";
import { competenciaAtual, estaInadimplente } from "@/lib/assinaturas";
import { NovoPlanoForm } from "./novo-plano-form";
import { PlanoRow } from "./plano-row";

function formatarPercentual(valor: number | null) {
  if (valor === null) return "—";
  return `${valor.toFixed(0)}%`;
}

export default async function PlanosPage() {
  const agora = new Date();
  const mes = calcularIntervalo("mes", agora);
  const competencia = competenciaAtual(agora);

  const planos = await prisma.plano.findMany({
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    include: {
      assinaturas: {
        include: {
          cliente: true,
          pagamentos: { where: { competencia } },
        },
      },
    },
  });

  const clienteIdsAtivos = planos.flatMap((p) =>
    p.assinaturas.filter((a) => a.status === "ATIVA").map((a) => a.clienteId)
  );

  const atendimentosAssinantesMes = clienteIdsAtivos.length
    ? await prisma.atendimento.findMany({
        where: {
          status: "CONCLUIDO",
          concluidoEm: { gte: mes.inicio, lte: mes.fim },
          clienteId: { in: clienteIdsAtivos },
        },
        include: { servicos: true, barbeiro: true },
      })
    : [];

  const usoPorCliente = new Map<string, { qtd: number; custoCentavos: number; comissaoCentavos: number }>();
  for (const a of atendimentosAssinantesMes) {
    if (!a.barbeiro) continue;
    const atual = usoPorCliente.get(a.clienteId) ?? { qtd: 0, custoCentavos: 0, comissaoCentavos: 0 };
    atual.qtd += 1;
    for (const s of a.servicos) {
      atual.custoCentavos += s.custoCentavos;
      atual.comissaoCentavos += Math.round(
        (s.precoCentavos * (s.comissaoPercentual ?? a.barbeiro.comissaoPercentual)) / 100
      );
    }
    usoPorCliente.set(a.clienteId, atual);
  }

  const planosComMetricas = planos.map((p) => {
    const ativas = p.assinaturas.filter((a) => a.status === "ATIVA");
    const canceladasTotal = p.assinaturas.filter((a) => a.status === "CANCELADA").length;
    const novasNoMes = p.assinaturas.filter((a) => a.criadoEm >= mes.inicio).length;
    const canceladasNoMes = p.assinaturas.filter(
      (a) => a.canceladaEm && a.canceladaEm >= mes.inicio && a.canceladaEm <= mes.fim
    ).length;
    const ativosInicioMes = p.assinaturas.filter(
      (a) => a.criadoEm < mes.inicio && (a.status === "ATIVA" || (a.canceladaEm && a.canceladaEm >= mes.inicio))
    ).length;
    const churn = ativosInicioMes > 0 ? (canceladasNoMes / ativosInicioMes) * 100 : null;

    const mrrCentavos = ativas.length * p.precoCentavos;
    const inadimplentesQtd = ativas.filter((a) => estaInadimplente(a.diaVencimento, a.pagamentos.length > 0, agora))
      .length;

    let custoTotalCentavos = 0;
    let comissaoTotalCentavos = 0;
    let atendimentosTotal = 0;
    const assinantesDetalhe = ativas
      .map((a) => {
        const uso = usoPorCliente.get(a.clienteId) ?? { qtd: 0, custoCentavos: 0, comissaoCentavos: 0 };
        custoTotalCentavos += uso.custoCentavos;
        comissaoTotalCentavos += uso.comissaoCentavos;
        atendimentosTotal += uso.qtd;
        return { nome: a.cliente.nome, qtd: uso.qtd };
      })
      .sort((a, b) => b.qtd - a.qtd);

    const custoMedioPorAssinante = ativas.length > 0 ? Math.round(custoTotalCentavos / ativas.length) : 0;
    const rentabilidadeCentavos = mrrCentavos - custoTotalCentavos - comissaoTotalCentavos;
    const utilizacaoPercentual =
      ativas.length > 0 && p.servicosIncluidosPorMes > 0
        ? (atendimentosTotal / (ativas.length * p.servicosIncluidosPorMes)) * 100
        : null;

    return {
      plano: p,
      ativosQtd: ativas.length,
      canceladasTotal,
      novasNoMes,
      churn,
      mrrCentavos,
      inadimplentesQtd,
      custoMedioPorAssinante,
      rentabilidadeCentavos,
      utilizacaoPercentual,
      assinantesDetalhe,
    };
  });

  const mrrTotalCentavos = planosComMetricas.reduce((s, p) => s + p.mrrCentavos, 0);
  const ativosTotal = planosComMetricas.reduce((s, p) => s + p.ativosQtd, 0);
  const inadimplentesTotal = planosComMetricas.reduce((s, p) => s + p.inadimplentesQtd, 0);
  const canceladasNoMesTotal = planos.reduce(
    (s, p) =>
      s + p.assinaturas.filter((a) => a.canceladaEm && a.canceladaEm >= mes.inicio && a.canceladaEm <= mes.fim).length,
    0
  );
  const ativosInicioMesTotal = planos.reduce(
    (s, p) =>
      s +
      p.assinaturas.filter(
        (a) => a.criadoEm < mes.inicio && (a.status === "ATIVA" || (a.canceladaEm && a.canceladaEm >= mes.inicio))
      ).length,
    0
  );
  const churnGeral = ativosInicioMesTotal > 0 ? (canceladasNoMesTotal / ativosInicioMesTotal) * 100 : null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Planos de assinatura</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-sm">Receita recorrente (MRR)</p>
          <p className="text-2xl font-bold text-lime-600 dark:text-lime-400">{formatarReais(mrrTotalCentavos)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-sm">Assinantes ativos</p>
          <p className="text-2xl font-bold text-lime-600 dark:text-lime-400">{ativosTotal}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-sm">Inadimplentes</p>
          <p className={`text-2xl font-bold ${inadimplentesTotal > 0 ? "text-red-600" : "text-green-600"}`}>
            {inadimplentesTotal}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-sm">Churn (mês)</p>
          <p className="text-2xl font-bold text-lime-600 dark:text-lime-400">{formatarPercentual(churnGeral)}</p>
        </div>
      </div>

      <NovoPlanoForm />

      <div className="space-y-4">
        {planosComMetricas.map((m) => (
          <div key={m.plano.id} className="space-y-2">
            <PlanoRow plano={m.plano} />

            <div
              className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm ${
                !m.plano.ativo ? "opacity-50" : ""
              }`}
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
                <div>
                  <p className="text-slate-400 dark:text-slate-500 text-xs">Clientes ativos</p>
                  <p className="font-semibold">{m.ativosQtd}</p>
                </div>
                <div>
                  <p className="text-slate-400 dark:text-slate-500 text-xs">Clientes cancelados</p>
                  <p className="font-semibold">{m.canceladasTotal}</p>
                </div>
                <div>
                  <p className="text-slate-400 dark:text-slate-500 text-xs">Novas assinaturas (mês)</p>
                  <p className="font-semibold">{m.novasNoMes}</p>
                </div>
                <div>
                  <p className="text-slate-400 dark:text-slate-500 text-xs">Churn (mês)</p>
                  <p className="font-semibold">{formatarPercentual(m.churn)}</p>
                </div>
                <div>
                  <p className="text-slate-400 dark:text-slate-500 text-xs">Receita recorrente (MRR)</p>
                  <p className="font-semibold text-lime-600 dark:text-lime-400">{formatarReais(m.mrrCentavos)}</p>
                </div>
                <div>
                  <p className="text-slate-400 dark:text-slate-500 text-xs">Inadimplência</p>
                  <p className={`font-semibold ${m.inadimplentesQtd > 0 ? "text-red-600" : "text-green-600"}`}>
                    {m.inadimplentesQtd}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 dark:text-slate-500 text-xs">Custo médio/assinante (mês)</p>
                  <p className="font-semibold">{formatarReais(m.custoMedioPorAssinante)}</p>
                </div>
                <div>
                  <p className="text-slate-400 dark:text-slate-500 text-xs">Rentabilidade (mês)</p>
                  <p className={`font-semibold ${m.rentabilidadeCentavos < 0 ? "text-red-600" : "text-green-600"}`}>
                    {formatarReais(m.rentabilidadeCentavos)}
                  </p>
                </div>
              </div>

              <details>
                <summary className="cursor-pointer text-sm text-lime-600 dark:text-lime-400 hover:underline select-none">
                  Utilização do plano — {formatarPercentual(m.utilizacaoPercentual)}
                  {m.utilizacaoPercentual !== null ? "" : " (sem assinantes ativos)"}
                </summary>
                <div className="mt-3 space-y-1">
                  {m.assinantesDetalhe.map((s, i) => (
                    <div key={`${s.nome}-${i}`} className="flex items-center justify-between text-sm py-1">
                      <span>{s.nome}</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {s.qtd} de {m.plano.servicosIncluidosPorMes} serviço(s) usados
                      </span>
                    </div>
                  ))}
                  {m.assinantesDetalhe.length === 0 && (
                    <p className="text-slate-400 dark:text-slate-500 text-sm">Nenhum assinante ativo neste plano.</p>
                  )}
                </div>
              </details>
            </div>
          </div>
        ))}
        {planosComMetricas.length === 0 && <p className="text-slate-400 dark:text-slate-500">Nenhum plano cadastrado ainda.</p>}
      </div>
    </div>
  );
}
