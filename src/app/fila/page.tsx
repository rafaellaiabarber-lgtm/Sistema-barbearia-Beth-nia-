import Link from "next/link";
import { Wallet, Target } from "lucide-react";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { chamarProximo, chamarCliente, cancelarAtendimento } from "@/lib/actions/fila";
import { logout } from "@/lib/actions/auth";
import { formatarReais } from "@/lib/format";
import { calcularIntervalo } from "@/lib/periodo";
import { comissaoServicos } from "@/lib/comissao";
import { buscarCampanhasAtivasComProgresso } from "@/lib/campanhas-server";
import { AutoRefresh } from "./auto-refresh";
import { AtendendoAgora } from "./atendendo-agora";
import { ThemeToggle } from "../theme-toggle";

function tempoEspera(desde: Date) {
  const minutos = Math.max(0, Math.floor((Date.now() - desde.getTime()) / 60000));
  if (minutos === 0) return "agora mesmo";
  if (minutos === 1) return "há 1 min";
  return `há ${minutos} min`;
}

type PeriodoFila = "hoje" | "ontem" | "semana" | "mes";
const LABEL_PERIODO_FILA: Record<PeriodoFila, string> = {
  hoje: "hoje",
  ontem: "ontem",
  semana: "esta semana",
  mes: "este mês",
};

function intervaloOntem(agora: Date) {
  const hoje = calcularIntervalo("hoje", agora);
  const fim = new Date(hoje.inicio.getTime() - 1);
  const inicio = new Date(fim);
  inicio.setHours(0, 0, 0, 0);
  return { inicio, fim };
}

function formatarDataBR(data: string) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default async function FilaPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; dataInicio?: string; dataFim?: string }>;
}) {
  const session = await requireSession(["ADMIN", "BARBEIRO"]);
  const { periodo: periodoParam, dataInicio, dataFim } = await searchParams;
  const periodoFila: PeriodoFila =
    periodoParam === "ontem" || periodoParam === "semana" || periodoParam === "mes" ? periodoParam : "hoje";
  const agora = new Date();
  const personalizado = dataInicio ? calcularIntervalo("personalizado", agora, { dataInicio, dataFim }) : null;
  const labelPeriodoFila = personalizado
    ? `${formatarDataBR(dataInicio!)}${dataFim ? ` até ${formatarDataBR(dataFim)}` : ""}`
    : LABEL_PERIODO_FILA[periodoFila];

  const [aguardando, emAtendimento, barbeirosAtivos, servicosAtivos] = await Promise.all([
    prisma.atendimento.findMany({
      where: { status: "AGUARDANDO" },
      orderBy: { criadoEm: "asc" },
      include: { cliente: true, barbeiroPreferido: true },
    }),
    prisma.atendimento.findMany({
      where: { status: "EM_ATENDIMENTO" },
      orderBy: { chamadoEm: "asc" },
      include: { cliente: true, servicos: true, barbeiro: true },
    }),
    prisma.barbeiro.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.servico.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  const meuAtendimento = session.barbeiroId
    ? emAtendimento.find((a) => a.barbeiroId === session.barbeiroId)
    : null;

  let comissaoPeriodo: { comissaoCentavos: number; totalCentavos: number; qtd: number } | null = null;
  let metaInfo: {
    faturamentoMesCentavos: number;
    metaFaturamentoCentavos: number;
    percentualMeta: number;
    bateuMeta: boolean;
    bonificacaoCentavos: number | null;
  } | null = null;
  const campanhasAtivas = session.barbeiroId ? await buscarCampanhasAtivasComProgresso(session.barbeiroId) : [];

  if (session.barbeiroId) {
    const intervaloSelecionado =
      personalizado ?? (periodoFila === "ontem" ? intervaloOntem(agora) : calcularIntervalo(periodoFila, agora));
    const mes = calcularIntervalo("mes", agora);
    const [barbeiro, atendimentosPeriodo, atendimentosMes] = await Promise.all([
      prisma.barbeiro.findUnique({ where: { id: session.barbeiroId } }),
      prisma.atendimento.findMany({
        where: {
          barbeiroId: session.barbeiroId,
          status: "CONCLUIDO",
          concluidoEm: { gte: intervaloSelecionado.inicio, lte: intervaloSelecionado.fim },
        },
        include: { servicos: true },
      }),
      !personalizado && periodoFila === "mes"
        ? Promise.resolve(null)
        : prisma.atendimento.findMany({
            where: { barbeiroId: session.barbeiroId, status: "CONCLUIDO", concluidoEm: { gte: mes.inicio, lte: mes.fim } },
          }),
    ]);
    const totalCentavos = atendimentosPeriodo.reduce((s, a) => s + a.precoTotalCentavos, 0);
    const comissaoCentavos = atendimentosPeriodo.reduce(
      (soma, a) => soma + comissaoServicos(a.servicos, barbeiro?.comissaoPercentual ?? 0),
      0
    );
    comissaoPeriodo = { totalCentavos, qtd: atendimentosPeriodo.length, comissaoCentavos };

    if (barbeiro?.metaFaturamentoCentavos && barbeiro.metaFaturamentoCentavos > 0) {
      const baseMes = atendimentosMes ?? atendimentosPeriodo;
      const faturamentoMesCentavos = baseMes.reduce((s, a) => s + a.precoTotalCentavos, 0);
      const percentualMeta = Math.min((faturamentoMesCentavos / barbeiro.metaFaturamentoCentavos) * 100, 999);
      metaInfo = {
        faturamentoMesCentavos,
        metaFaturamentoCentavos: barbeiro.metaFaturamentoCentavos,
        percentualMeta,
        bateuMeta: percentualMeta >= 100,
        bonificacaoCentavos: barbeiro.bonificacaoCentavos,
      };
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6">
      <AutoRefresh />
      <header className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Fila de atendimento</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Olá, {session.nome}</p>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800" />
          <Link href="/indicacoes" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
            Indicações
          </Link>
          <Link href="/ranking" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
            Ranking
          </Link>
          {session.role === "ADMIN" && (
            <Link href="/admin" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
              Painel admin
            </Link>
          )}
          <form action={logout}>
            <button className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm">Sair</button>
          </form>
        </div>
      </header>

      {session.barbeiroId && meuAtendimento ? (
        <AtendendoAgora
          atendimentoId={meuAtendimento.id}
          clienteNome={meuAtendimento.cliente.nome}
          chamadoEm={meuAtendimento.chamadoEm ?? meuAtendimento.criadoEm}
          servicos={servicosAtivos}
          campanhas={campanhasAtivas}
        />
      ) : (
        <>
          {session.barbeiroId && (comissaoPeriodo || metaInfo) && (
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {(["hoje", "ontem", "semana", "mes"] as const).map((p) => (
                  <Link
                    key={p}
                    href={`/fila?periodo=${p}`}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium border ${
                      !personalizado && periodoFila === p
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400"
                    }`}
                  >
                    {p === "hoje" ? "Hoje" : p === "ontem" ? "Ontem" : p === "semana" ? "Esta semana" : "Este mês"}
                  </Link>
                ))}
              </div>

              <form
                method="get"
                className="flex flex-wrap items-end gap-3 mb-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3"
              >
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">De</label>
                  <input
                    type="date"
                    name="dataInicio"
                    defaultValue={dataInicio}
                    required
                    className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Até</label>
                  <input
                    type="date"
                    name="dataFim"
                    defaultValue={dataFim}
                    className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900"
                  />
                </div>
                <button type="submit" className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 text-sm">
                  Ver por data
                </button>
                {personalizado && (
                  <Link href="/fila" className="text-slate-400 dark:text-slate-500 hover:text-slate-700 text-sm">
                    Limpar
                  </Link>
                )}
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {comissaoPeriodo && (
                  <div className="rounded-xl p-5 shadow-sm bg-green-600 text-white flex items-start justify-between">
                    <div>
                      <p className="text-3xl font-bold mb-1">{formatarReais(comissaoPeriodo.comissaoCentavos)}</p>
                      <p className="text-green-100 text-sm">Sua comissão ({labelPeriodoFila})</p>
                      <p className="text-green-100 text-xs mt-1">
                        {comissaoPeriodo.qtd} atendimento(s) · faturamento {formatarReais(comissaoPeriodo.totalCentavos)}
                      </p>
                    </div>
                    <Wallet className="w-8 h-8 text-green-200 shrink-0" />
                  </div>
                )}

                {metaInfo && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Minha meta do mês</p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <span>
                        {formatarReais(metaInfo.faturamentoMesCentavos)} de {formatarReais(metaInfo.metaFaturamentoCentavos)}
                      </span>
                      <span className={`font-semibold ${metaInfo.bateuMeta ? "text-green-600" : "text-slate-500 dark:text-slate-400"}`}>
                        {metaInfo.percentualMeta.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${metaInfo.bateuMeta ? "bg-green-500" : "bg-blue-500"}`}
                        style={{ width: `${Math.min(metaInfo.percentualMeta, 100)}%` }}
                      />
                    </div>
                    {metaInfo.bateuMeta ? (
                      <p className="text-green-600 text-xs mt-2 font-medium">
                        🎉 Meta batida!
                        {metaInfo.bonificacaoCentavos ? ` Bônus: ${formatarReais(metaInfo.bonificacaoCentavos)}` : ""}
                      </p>
                    ) : (
                      <p className="text-slate-500 dark:text-slate-400 text-xs mt-2">
                        Faltam {(100 - metaInfo.percentualMeta).toFixed(0)}% (
                        {formatarReais(Math.max(metaInfo.metaFaturamentoCentavos - metaInfo.faturamentoMesCentavos, 0))}) para
                        bater a meta
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {session.barbeiroId && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-3">Meu atendimento</h2>
              <form action={chamarProximo.bind(null, undefined)}>
                <button
                  disabled={aguardando.length === 0}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-6 py-4 text-lg"
                >
                  Chamar próximo cliente
                </button>
              </form>
            </section>
          )}

          {session.role === "ADMIN" && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-3">Em atendimento</h2>
              {emAtendimento.length === 0 ? (
                <p className="text-slate-400 dark:text-slate-500">Ninguém sendo atendido no momento.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {emAtendimento.map((a) => (
                    <div key={a.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                      <p className="font-semibold">
                        {a.cliente.nome} <span className="text-slate-500 dark:text-slate-400 text-sm">com {a.barbeiro?.nome}</span>
                      </p>
                      <p className="text-blue-600 text-sm">{formatarReais(a.precoTotalCentavos)}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">Chamar próximo em nome de:</p>
                <div className="flex flex-wrap gap-2">
                  {barbeirosAtivos.map((b) => (
                    <form key={b.id} action={chamarProximo.bind(null, b.id)}>
                      <button
                        disabled={aguardando.length === 0}
                        className="rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 disabled:opacity-40 border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm"
                      >
                        {b.nome}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold mb-3">Aguardando ({aguardando.length})</h2>
            {aguardando.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500">Fila vazia.</p>
            ) : (
              <ol className="space-y-2">
                {aguardando.map((a, i) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-black text-blue-600 w-10 text-center">{i + 1}º</span>
                      <div>
                        <p className="font-semibold">{a.cliente.nome}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                          {a.barbeiroPreferido ? `Pediu: ${a.barbeiroPreferido.nome}` : "Sem preferência de barbeiro"}
                          {" · "}
                          {tempoEspera(a.criadoEm)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {session.barbeiroId && !meuAtendimento && (
                        <form action={chamarCliente.bind(null, a.id)}>
                          <button className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-3 py-1.5">
                            Atender
                          </button>
                        </form>
                      )}
                      <form action={cancelarAtendimento.bind(null, a.id)}>
                        <button className="text-slate-400 dark:text-slate-500 hover:text-red-600 text-sm">Cancelar</button>
                      </form>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
    </div>
  );
}
