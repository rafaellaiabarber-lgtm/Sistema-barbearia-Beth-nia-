import Link from "next/link";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { chamarProximo, chamarCliente, cancelarAtendimento } from "@/lib/actions/fila";
import { logout } from "@/lib/actions/auth";
import { formatarReais } from "@/lib/format";
import { calcularIntervalo } from "@/lib/periodo";
import { comissaoServicos } from "@/lib/comissao";
import { AutoRefresh } from "./auto-refresh";
import { AtendendoAgora } from "./atendendo-agora";

function tempoEspera(desde: Date) {
  const minutos = Math.max(0, Math.floor((Date.now() - desde.getTime()) / 60000));
  if (minutos === 0) return "agora mesmo";
  if (minutos === 1) return "há 1 min";
  return `há ${minutos} min`;
}

export default async function FilaPage() {
  const session = await requireSession(["ADMIN", "BARBEIRO"]);

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

  let comissaoHoje: { comissaoCentavos: number; totalCentavos: number; qtd: number } | null = null;
  if (session.barbeiroId) {
    const { inicio, fim } = calcularIntervalo("hoje");
    const [barbeiro, atendimentosHoje] = await Promise.all([
      prisma.barbeiro.findUnique({ where: { id: session.barbeiroId } }),
      prisma.atendimento.findMany({
        where: { barbeiroId: session.barbeiroId, status: "CONCLUIDO", concluidoEm: { gte: inicio, lte: fim } },
        include: { servicos: true },
      }),
    ]);
    const totalCentavos = atendimentosHoje.reduce((s, a) => s + a.precoTotalCentavos, 0);
    const comissaoCentavos = atendimentosHoje.reduce(
      (soma, a) => soma + comissaoServicos(a.servicos, barbeiro?.comissaoPercentual ?? 0),
      0
    );
    comissaoHoje = { totalCentavos, qtd: atendimentosHoje.length, comissaoCentavos };
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <AutoRefresh />
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Fila de atendimento</h1>
          <p className="text-slate-500 text-sm">Olá, {session.nome}</p>
        </div>
        <div className="flex items-center gap-4">
          {session.role === "ADMIN" && (
            <Link href="/admin" className="text-blue-600 hover:underline text-sm">
              Painel admin
            </Link>
          )}
          <form action={logout}>
            <button className="text-slate-500 hover:text-slate-900 text-sm">Sair</button>
          </form>
        </div>
      </header>

      {session.barbeiroId && meuAtendimento ? (
        <AtendendoAgora
          atendimentoId={meuAtendimento.id}
          clienteNome={meuAtendimento.cliente.nome}
          chamadoEm={meuAtendimento.chamadoEm ?? meuAtendimento.criadoEm}
          servicos={servicosAtivos}
        />
      ) : (
        <>
          {session.barbeiroId && comissaoHoje && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Sua comissão hoje</p>
                <p className="text-slate-400 text-xs">
                  {comissaoHoje.qtd} atendimento(s) · faturamento {formatarReais(comissaoHoje.totalCentavos)}
                </p>
              </div>
              <p className="text-2xl font-bold text-blue-600">{formatarReais(comissaoHoje.comissaoCentavos)}</p>
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
                <p className="text-slate-400">Ninguém sendo atendido no momento.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {emAtendimento.map((a) => (
                    <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                      <p className="font-semibold">
                        {a.cliente.nome} <span className="text-slate-500 text-sm">com {a.barbeiro?.nome}</span>
                      </p>
                      <p className="text-blue-600 text-sm">{formatarReais(a.precoTotalCentavos)}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <p className="text-slate-500 text-sm mb-2">Chamar próximo em nome de:</p>
                <div className="flex flex-wrap gap-2">
                  {barbeirosAtivos.map((b) => (
                    <form key={b.id} action={chamarProximo.bind(null, b.id)}>
                      <button
                        disabled={aguardando.length === 0}
                        className="rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-300 px-4 py-2 text-sm"
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
              <p className="text-slate-400">Fila vazia.</p>
            ) : (
              <ol className="space-y-2">
                {aguardando.map((a, i) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-black text-blue-600 w-10 text-center">{i + 1}º</span>
                      <div>
                        <p className="font-semibold">{a.cliente.nome}</p>
                        <p className="text-slate-500 text-sm">
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
                        <button className="text-slate-400 hover:text-red-600 text-sm">Cancelar</button>
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
