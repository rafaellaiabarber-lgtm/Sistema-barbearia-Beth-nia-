import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatarReais } from "@/lib/format";
import { calcularIntervalo, intervaloAnterior } from "@/lib/periodo";
import { lucroServicos } from "@/lib/comissao";
import { competenciaAtual, estaInadimplente } from "@/lib/assinaturas";
import { Variacao } from "./variacao";

export default async function AdminHomePage() {
  const agora = new Date();
  const hoje = calcularIntervalo("hoje", agora);
  const semana = calcularIntervalo("semana", agora);
  const mes = calcularIntervalo("mes", agora);

  const diaAnterior = intervaloAnterior("hoje", hoje.inicio, hoje.fim);
  const semanaAnterior = intervaloAnterior("semana", semana.inicio, semana.fim);
  const mesAnteriorIntervalo = intervaloAnterior("mes", mes.inicio, mes.fim);

  const [
    atendimentosMes,
    atendimentosMesAnterior,
    aguardando,
    emAtendimento,
    diaAnteriorAgg,
    semanaAnteriorAgg,
    assinaturasAtivas,
    assinaturasParaInadimplencia,
  ] = await Promise.all([
    prisma.atendimento.findMany({
      where: { status: "CONCLUIDO", concluidoEm: { gte: mes.inicio, lte: mes.fim } },
      include: { barbeiro: true, cliente: true, servicos: true },
    }),
    prisma.atendimento.findMany({
      where: {
        status: "CONCLUIDO",
        concluidoEm: { gte: mesAnteriorIntervalo.inicio, lte: mesAnteriorIntervalo.fim },
      },
      include: { barbeiro: true, servicos: true },
    }),
    prisma.atendimento.count({ where: { status: "AGUARDANDO" } }),
    prisma.atendimento.count({ where: { status: "EM_ATENDIMENTO" } }),
    prisma.atendimento.aggregate({
      where: { status: "CONCLUIDO", concluidoEm: { gte: diaAnterior.inicio, lte: diaAnterior.fim } },
      _sum: { precoTotalCentavos: true },
    }),
    prisma.atendimento.aggregate({
      where: { status: "CONCLUIDO", concluidoEm: { gte: semanaAnterior.inicio, lte: semanaAnterior.fim } },
      _sum: { precoTotalCentavos: true },
    }),
    prisma.assinatura.count({ where: { status: "ATIVA" } }),
    prisma.assinatura.findMany({
      where: { status: "ATIVA" },
      include: { pagamentos: { where: { competencia: competenciaAtual(agora) } } },
    }),
  ]);

  const atendimentosHoje = atendimentosMes.filter((a) => a.concluidoEm! >= hoje.inicio);
  const atendimentosSemana = atendimentosMes.filter((a) => a.concluidoEm! >= semana.inicio);

  const faturamentoHoje = atendimentosHoje.reduce((s, a) => s + a.precoTotalCentavos, 0);
  const faturamentoSemana = atendimentosSemana.reduce((s, a) => s + a.precoTotalCentavos, 0);
  const faturamentoMes = atendimentosMes.reduce((s, a) => s + a.precoTotalCentavos, 0);

  const faturamentoDiaAnterior = diaAnteriorAgg._sum.precoTotalCentavos ?? 0;
  const faturamentoSemanaAnterior = semanaAnteriorAgg._sum.precoTotalCentavos ?? 0;
  const faturamentoMesAnterior = atendimentosMesAnterior.reduce((s, a) => s + a.precoTotalCentavos, 0);

  const lucroMes = atendimentosMes.reduce((soma, a) => {
    if (!a.barbeiro) return soma;
    return soma + lucroServicos(a.servicos, a.barbeiro.comissaoPercentual);
  }, 0);
  const lucroMesAnterior = atendimentosMesAnterior.reduce((soma, a) => {
    if (!a.barbeiro) return soma;
    return soma + lucroServicos(a.servicos, a.barbeiro.comissaoPercentual);
  }, 0);

  const qtdAtendimentosMes = atendimentosMes.length;
  const qtdAtendimentosMesAnterior = atendimentosMesAnterior.length;
  const ticketMedioMes = qtdAtendimentosMes > 0 ? Math.round(faturamentoMes / qtdAtendimentosMes) : 0;
  const ticketMedioMesAnterior =
    qtdAtendimentosMesAnterior > 0 ? Math.round(faturamentoMesAnterior / qtdAtendimentosMesAnterior) : 0;

  const porBarbeiro = new Map<string, { nome: string; totalCentavos: number; qtd: number }>();
  for (const a of atendimentosMes) {
    if (!a.barbeiro) continue;
    const atual = porBarbeiro.get(a.barbeiro.id) ?? { nome: a.barbeiro.nome, totalCentavos: 0, qtd: 0 };
    atual.totalCentavos += a.precoTotalCentavos;
    atual.qtd += 1;
    porBarbeiro.set(a.barbeiro.id, atual);
  }
  const rankingBarbeiros = [...porBarbeiro.values()].sort((a, b) => b.totalCentavos - a.totalCentavos);

  const rankingServicosMap = new Map<string, { nome: string; qtd: number; totalCentavos: number }>();
  for (const a of atendimentosMes) {
    for (const s of a.servicos) {
      const atual = rankingServicosMap.get(s.nomeSnapshot) ?? { nome: s.nomeSnapshot, qtd: 0, totalCentavos: 0 };
      atual.qtd += 1;
      atual.totalCentavos += s.precoCentavos;
      rankingServicosMap.set(s.nomeSnapshot, atual);
    }
  }
  const rankingServicos = [...rankingServicosMap.values()].sort((a, b) => b.qtd - a.qtd).slice(0, 5);

  const clientesUnicos = new Map<string, Date>();
  for (const a of atendimentosMes) {
    if (!clientesUnicos.has(a.cliente.id)) clientesUnicos.set(a.cliente.id, a.cliente.criadoEm);
  }
  let clientesNovos = 0;
  let clientesRecorrentes = 0;
  for (const criadoEm of clientesUnicos.values()) {
    if (criadoEm >= mes.inicio) clientesNovos += 1;
    else clientesRecorrentes += 1;
  }

  const inadimplentes = assinaturasParaInadimplencia.filter((a) =>
    estaInadimplente(a.diaVencimento, a.pagamentos.length > 0, agora)
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Visão geral</h1>

      <h2 className="text-lg font-semibold mb-3">Faturamento</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-slate-500 text-sm">Hoje</p>
          <p className="text-2xl font-bold text-blue-600 mb-1">{formatarReais(faturamentoHoje)}</p>
          <Variacao atual={faturamentoHoje} anterior={faturamentoDiaAnterior} />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-slate-500 text-sm">Esta semana</p>
          <p className="text-2xl font-bold text-blue-600 mb-1">{formatarReais(faturamentoSemana)}</p>
          <Variacao atual={faturamentoSemana} anterior={faturamentoSemanaAnterior} />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-slate-500 text-sm">Este mês</p>
          <p className="text-2xl font-bold text-blue-600 mb-1">{formatarReais(faturamentoMes)}</p>
          <Variacao atual={faturamentoMes} anterior={faturamentoMesAnterior} />
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3">Este mês</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-slate-500 text-sm">Lucro estimado</p>
          <p className={`text-2xl font-bold mb-1 ${lucroMes < 0 ? "text-red-600" : "text-green-600"}`}>
            {formatarReais(lucroMes)}
          </p>
          <Variacao atual={lucroMes} anterior={lucroMesAnterior} />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-slate-500 text-sm">Atendimentos</p>
          <p className="text-2xl font-bold text-blue-600 mb-1">{qtdAtendimentosMes}</p>
          <Variacao atual={qtdAtendimentosMes} anterior={qtdAtendimentosMesAnterior} />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-slate-500 text-sm">Ticket médio</p>
          <p className="text-2xl font-bold text-blue-600 mb-1">{formatarReais(ticketMedioMes)}</p>
          <Variacao atual={ticketMedioMes} anterior={ticketMedioMesAnterior} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-slate-500 text-sm">Na fila agora</p>
          <p className="text-2xl font-bold text-blue-600">{aguardando}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-slate-500 text-sm">Em atendimento</p>
          <p className="text-2xl font-bold text-blue-600">{emAtendimento}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-slate-500 text-sm">Clientes novos (mês)</p>
          <p className="text-2xl font-bold text-blue-600">{clientesNovos}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-slate-500 text-sm">Clientes recorrentes (mês)</p>
          <p className="text-2xl font-bold text-blue-600">{clientesRecorrentes}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link
          href="/admin/assinaturas"
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-blue-300"
        >
          <p className="text-slate-500 text-sm">Assinaturas ativas</p>
          <p className="text-2xl font-bold text-blue-600">{assinaturasAtivas}</p>
        </Link>
        <Link
          href="/admin/assinaturas"
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-blue-300"
        >
          <p className="text-slate-500 text-sm">Inadimplências</p>
          <p className={`text-2xl font-bold ${inadimplentes.length > 0 ? "text-red-600" : "text-green-600"}`}>
            {inadimplentes.length}
          </p>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-lg font-semibold mb-3">Faturamento por barbeiro (mês)</h2>
          <div className="space-y-2">
            {rankingBarbeiros.map((b) => (
              <div
                key={b.nome}
                className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 text-sm shadow-sm"
              >
                <span className="font-medium">{b.nome}</span>
                <div className="text-right">
                  <p className="font-semibold text-blue-600">{formatarReais(b.totalCentavos)}</p>
                  <p className="text-slate-400 text-xs">{b.qtd} atendimento(s)</p>
                </div>
              </div>
            ))}
            {rankingBarbeiros.length === 0 && (
              <p className="text-slate-400 text-sm">Nenhum atendimento no mês.</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Serviços mais vendidos (mês)</h2>
          <div className="space-y-2">
            {rankingServicos.map((r, i) => (
              <div
                key={r.nome}
                className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 text-sm shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-blue-600 font-bold w-5 text-center">{i + 1}º</span>
                  <span className="font-medium">{r.nome}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{r.qtd}x</p>
                  <p className="text-slate-400 text-xs">{formatarReais(r.totalCentavos)}</p>
                </div>
              </div>
            ))}
            {rankingServicos.length === 0 && (
              <p className="text-slate-400 text-sm">Nenhum serviço vendido no mês.</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/financeiro" className="text-blue-600 hover:underline text-sm">
          Ver relatório financeiro completo →
        </Link>
        <Link href="/admin/eficiencia" className="text-blue-600 hover:underline text-sm">
          Ver eficiência dos barbeiros →
        </Link>
        <Link href="/fila" className="text-blue-600 hover:underline text-sm">
          Abrir painel da fila →
        </Link>
      </div>
    </div>
  );
}
