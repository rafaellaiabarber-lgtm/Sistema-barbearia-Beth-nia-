import Link from "next/link";
import { Wallet, Target, Quote } from "lucide-react";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { chamarProximo, chamarCliente, cancelarAtendimento } from "@/lib/actions/fila";
import { logout } from "@/lib/actions/auth";
import { formatarReais } from "@/lib/format";
import { calcularIntervalo } from "@/lib/periodo";
import { comissaoServicos, comissaoProdutos } from "@/lib/comissao";
import { buscarCampanhasAtivasComProgresso } from "@/lib/campanhas-server";
import { itemCompleto, quantidadeFaltando, valorPotencialCentavos } from "@/lib/campanhas";
import { diaCobertoHoje } from "@/lib/assinaturas";
import { LABEL_TIPO_META, formatarValorMeta, calcularNiveisAtingidos, nivelAtual, proximoNivel } from "@/lib/metas";
import { calcularProgressoMeta } from "@/lib/metas-server";
import { fraseDoDia } from "@/lib/frases";
import { AutoRefresh } from "./auto-refresh";
import { AtendendoAgora } from "./atendendo-agora";
import { ThemeToggle } from "../theme-toggle";

function tempoEspera(desde: Date) {
  const minutos = Math.max(0, Math.floor((Date.now() - desde.getTime()) / 60000));
  if (minutos === 0) return "agora mesmo";
  if (minutos === 1) return "há 1 min";
  return `há ${minutos} min`;
}

function BadgeAssinante({ info }: { info: { nome: string; cobertoHoje: boolean } | undefined }) {
  if (!info) return null;
  if (info.cobertoHoje) {
    return (
      <span className="ml-2 inline-block rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 text-xs font-medium px-2 py-0.5 align-middle">
        🎫 Assinante
      </span>
    );
  }
  return (
    <span className="ml-2 inline-block rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-xs font-medium px-2 py-0.5 align-middle">
      🎫 Assinante (hoje é avulso)
    </span>
  );
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

  const clienteIdsNaFila = [...new Set([...aguardando, ...emAtendimento].map((a) => a.clienteId))];
  const assinaturasAtivas = clienteIdsNaFila.length
    ? await prisma.assinatura.findMany({
        where: { clienteId: { in: clienteIdsNaFila }, status: "ATIVA" },
        include: { plano: true },
      })
    : [];
  const planoInfoPorCliente = new Map<string, { nome: string; cobertoHoje: boolean }>();
  for (const a of assinaturasAtivas) {
    if (!planoInfoPorCliente.has(a.clienteId)) {
      planoInfoPorCliente.set(a.clienteId, { nome: a.plano.nome, cobertoHoje: diaCobertoHoje(a.plano.diasSemana) });
    }
  }

  let comissaoPeriodo: {
    comissaoCentavos: number;
    qtd: number;
    clientes: { nome: string; servicos: string[] }[];
  } | null = null;
  type MinhaMeta = {
    id: string;
    tipo: string;
    valorAtual: number;
    escopoTexto: string | null;
    niveisComProgresso: { ordem: number; nome: string; valorAlvo: number; bonificacaoCentavos: number; atingido: boolean }[];
    atual: { nome: string } | null;
    proximo: { nome: string; valorAlvo: number } | null;
    percentualAteProximo: number;
  };
  let minhasMetas: MinhaMeta[] = [];
  const campanhasAtivas = session.barbeiroId ? await buscarCampanhasAtivasComProgresso(session.barbeiroId) : [];
  const itensFaltandoCampanha = campanhasAtivas.flatMap((c) => c.itens.filter((i) => !itemCompleto(i)));
  const potencialCampanhaCentavos = valorPotencialCentavos(itensFaltandoCampanha);

  if (session.barbeiroId) {
    const intervaloSelecionado =
      personalizado ?? (periodoFila === "ontem" ? intervaloOntem(agora) : calcularIntervalo(periodoFila, agora));
    const [barbeiro, atendimentosPeriodo, vendasProdutoPeriodo, metasBarbeiro] = await Promise.all([
      prisma.barbeiro.findUnique({ where: { id: session.barbeiroId } }),
      prisma.atendimento.findMany({
        where: {
          barbeiroId: session.barbeiroId,
          status: "CONCLUIDO",
          concluidoEm: { gte: intervaloSelecionado.inicio, lte: intervaloSelecionado.fim },
        },
        include: { servicos: true, cliente: true },
        orderBy: { concluidoEm: "desc" },
      }),
      prisma.vendaProduto.findMany({
        where: {
          barbeiroId: session.barbeiroId,
          criadoEm: { gte: intervaloSelecionado.inicio, lte: intervaloSelecionado.fim },
        },
      }),
      prisma.meta.findMany({
        where: { barbeiroId: session.barbeiroId, ativa: true },
        include: { niveis: true, servico: true, produto: true },
        orderBy: { criadoEm: "asc" },
      }),
    ]);
    const comissaoCentavos =
      atendimentosPeriodo.reduce((soma, a) => soma + comissaoServicos(a.servicos, barbeiro?.comissaoPercentual ?? 0), 0) +
      comissaoProdutos(vendasProdutoPeriodo);
    const clientes = atendimentosPeriodo.map((a) => ({
      nome: a.cliente.nome,
      servicos: a.servicos.map((s) => s.nomeSnapshot),
    }));
    comissaoPeriodo = { comissaoCentavos, qtd: atendimentosPeriodo.length, clientes };

    const comissaoPadrao = barbeiro?.comissaoPercentual ?? 0;
    const progressosMeta = await Promise.all(metasBarbeiro.map((m) => calcularProgressoMeta(m, comissaoPadrao)));
    minhasMetas = metasBarbeiro.map((m, i) => {
      const valorAtual = progressosMeta[i];
      const niveisComProgresso = calcularNiveisAtingidos(m.niveis, valorAtual);
      const atual = nivelAtual(niveisComProgresso);
      const proximo = proximoNivel(niveisComProgresso);
      const ultimoNivel = niveisComProgresso[niveisComProgresso.length - 1];
      const percentualAteProximo = proximo
        ? Math.min((valorAtual / proximo.valorAlvo) * 100, 100)
        : ultimoNivel
          ? 100
          : 0;
      return {
        id: m.id,
        tipo: m.tipo,
        valorAtual,
        escopoTexto: m.tipo === "VENDAS_PRODUTO" ? (m.produto?.nome ?? null) : (m.servico?.nome ?? null),
        niveisComProgresso,
        atual,
        proximo,
        percentualAteProximo,
      };
    });
  }

  const mostrarAvisoCampanha = !!session.barbeiroId && itensFaltandoCampanha.length > 0;

  return (
    <div
      className={`min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 p-6 ${
        mostrarAvisoCampanha ? "pb-28" : ""
      }`}
    >
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

      {session.barbeiroId && (
        <div className="mb-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-start gap-3">
          <Quote className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-600 dark:text-slate-300 italic">{fraseDoDia()}</p>
        </div>
      )}

      {session.barbeiroId && meuAtendimento ? (
        <AtendendoAgora
          atendimentoId={meuAtendimento.id}
          clienteNome={meuAtendimento.cliente.nome}
          chamadoEm={meuAtendimento.chamadoEm ?? meuAtendimento.criadoEm}
          servicos={servicosAtivos}
          campanhas={campanhasAtivas}
          comAvisoFixo={mostrarAvisoCampanha}
          planoInfo={planoInfoPorCliente.get(meuAtendimento.clienteId) ?? null}
        />
      ) : (
        <>
          {session.barbeiroId && (comissaoPeriodo || minhasMetas.length > 0) && (
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

              <details className="mb-4" open={!!personalizado}>
                <summary className="cursor-pointer text-sm text-blue-600 dark:text-blue-400 hover:underline select-none">
                  Personalizar por data
                </summary>
                <form
                  method="get"
                  className="flex flex-wrap items-end gap-3 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3"
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
              </details>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {comissaoPeriodo && (
                  <details className="rounded-xl p-5 shadow-sm bg-green-600 text-white">
                    <summary className="cursor-pointer flex items-start justify-between select-none">
                      <div>
                        <p className="text-3xl font-bold mb-1">{formatarReais(comissaoPeriodo.comissaoCentavos)}</p>
                        <p className="text-green-100 text-sm">Sua comissão líquida ({labelPeriodoFila})</p>
                        <p className="text-green-100 text-xs mt-1">{comissaoPeriodo.qtd} atendimento(s)</p>
                      </div>
                      <Wallet className="w-8 h-8 text-green-200 shrink-0" />
                    </summary>
                    <div className="mt-3 pt-3 border-t border-green-500/50 space-y-1.5">
                      {comissaoPeriodo.clientes.length === 0 ? (
                        <p className="text-green-100 text-sm">Nenhum atendimento nesse período.</p>
                      ) : (
                        comissaoPeriodo.clientes.map((c, i) => (
                          <div key={i} className="text-sm flex items-center justify-between gap-2">
                            <span>{c.nome}</span>
                            <span className="text-green-200 text-xs text-right">{c.servicos.join(", ")}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </details>
                )}

                {minhasMetas.map((m) => (
                  <div key={m.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {LABEL_TIPO_META[m.tipo]}
                        {m.escopoTexto ? ` — ${m.escopoTexto}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {m.niveisComProgresso.map((n) => (
                        <span
                          key={n.ordem}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            n.atingido
                              ? "bg-green-100 dark:bg-green-900 text-green-700"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {n.atingido ? "✓" : "○"} {n.nome} — {formatarValorMeta(m.tipo, n.valorAlvo)}
                          {n.bonificacaoCentavos > 0 && ` (bônus ${formatarReais(n.bonificacaoCentavos)})`}
                        </span>
                      ))}
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-1">
                      <div
                        className={`h-full rounded-full ${m.atual ? "bg-green-500" : "bg-blue-500"}`}
                        style={{ width: `${m.percentualAteProximo}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Atual: {formatarValorMeta(m.tipo, m.valorAtual)}
                      {m.proximo &&
                        ` · faltam ${formatarValorMeta(m.tipo, Math.max(m.proximo.valorAlvo - m.valorAtual, 0))} para ${m.proximo.nome}`}
                      {!m.proximo && m.atual && " · todos os níveis atingidos! 🎉"}
                    </p>
                  </div>
                ))}
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
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold">
                          {a.cliente.nome}
                          <BadgeAssinante info={planoInfoPorCliente.get(a.clienteId)} />{" "}
                          <span className="text-slate-500 dark:text-slate-400 text-sm">com {a.barbeiro?.nome}</span>
                        </p>
                        <form action={cancelarAtendimento.bind(null, a.id)}>
                          <button className="text-slate-400 dark:text-slate-500 hover:text-red-600 text-xs shrink-0">
                            Cancelar
                          </button>
                        </form>
                      </div>
                      <p className="text-blue-600 dark:text-blue-400 text-sm">{formatarReais(a.precoTotalCentavos)}</p>
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
                      <span className="text-2xl font-black text-blue-600 dark:text-blue-400 w-10 text-center">{i + 1}º</span>
                      <div>
                        <p className="font-semibold">
                          {a.cliente.nome}
                          <BadgeAssinante info={planoInfoPorCliente.get(a.clienteId)} />
                        </p>
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

      {mostrarAvisoCampanha && (
        <div className="fixed inset-x-0 bottom-0 z-50 bg-red-600 text-white px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.2)]">
          <p className="text-sm max-w-3xl mx-auto">
            🔴 Hoje, se vender {itensFaltandoCampanha.map((i) => `${quantidadeFaltando(i)}x ${i.nome}`).join(", ")}, você
            aumenta <span className="font-semibold">{formatarReais(potencialCampanhaCentavos)}</span> na sua comissão
            líquida. Não esqueça de oferecer!
          </p>
        </div>
      )}
    </div>
  );
}
