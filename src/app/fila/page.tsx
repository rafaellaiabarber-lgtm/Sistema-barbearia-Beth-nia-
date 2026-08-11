import Link from "next/link";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { chamarProximo, concluirAtendimento, cancelarAtendimento } from "@/lib/actions/fila";
import { logout } from "@/lib/actions/auth";
import { formatarReais } from "@/lib/format";
import { AutoRefresh } from "./auto-refresh";

export default async function FilaPage() {
  const session = await requireSession(["ADMIN", "BARBEIRO"]);

  const [aguardando, emAtendimento, barbeirosAtivos] = await Promise.all([
    prisma.atendimento.findMany({
      where: { status: "AGUARDANDO" },
      orderBy: { criadoEm: "asc" },
      include: { cliente: true, servicos: true },
    }),
    prisma.atendimento.findMany({
      where: { status: "EM_ATENDIMENTO" },
      orderBy: { chamadoEm: "asc" },
      include: { cliente: true, servicos: true, barbeiro: true },
    }),
    prisma.barbeiro.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  const meuAtendimento =
    session.role === "BARBEIRO" ? emAtendimento.find((a) => a.barbeiroId === session.barbeiroId) : null;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <AutoRefresh />
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Fila de atendimento</h1>
          <p className="text-neutral-400 text-sm">Olá, {session.nome}</p>
        </div>
        <div className="flex items-center gap-4">
          {session.role === "ADMIN" && (
            <Link href="/admin" className="text-amber-400 hover:underline text-sm">
              Painel admin
            </Link>
          )}
          <form action={logout}>
            <button className="text-neutral-400 hover:text-white text-sm">Sair</button>
          </form>
        </div>
      </header>

      {session.role === "BARBEIRO" && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Meu atendimento</h2>
          {meuAtendimento ? (
            <div className="bg-neutral-900 border border-amber-600/40 rounded-2xl p-5">
              <p className="text-xl font-bold">{meuAtendimento.cliente.nome}</p>
              <p className="text-neutral-400 text-sm mb-2">{meuAtendimento.cliente.telefone}</p>
              <ul className="text-neutral-300 text-sm mb-3 list-disc list-inside">
                {meuAtendimento.servicos.map((s) => (
                  <li key={s.id}>
                    {s.nomeSnapshot} — {formatarReais(s.precoCentavos)}
                  </li>
                ))}
              </ul>
              <p className="text-amber-400 font-semibold mb-4">
                Total: {formatarReais(meuAtendimento.precoTotalCentavos)}
              </p>
              <div className="flex gap-3">
                <form action={concluirAtendimento.bind(null, meuAtendimento.id)}>
                  <button className="rounded-lg bg-green-600 hover:bg-green-500 px-4 py-2 font-semibold">
                    Concluir atendimento
                  </button>
                </form>
                <form action={cancelarAtendimento.bind(null, meuAtendimento.id)}>
                  <button className="rounded-lg bg-red-900 hover:bg-red-800 px-4 py-2 font-semibold">
                    Cancelar
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <form action={chamarProximo.bind(null, undefined)}>
              <button
                disabled={aguardando.length === 0}
                className="rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-950 font-bold px-6 py-4 text-lg"
              >
                Chamar próximo cliente
              </button>
            </form>
          )}
        </section>
      )}

      {session.role === "ADMIN" && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Em atendimento</h2>
          {emAtendimento.length === 0 ? (
            <p className="text-neutral-500">Ninguém sendo atendido no momento.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {emAtendimento.map((a) => (
                <div key={a.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                  <p className="font-semibold">
                    {a.cliente.nome} <span className="text-neutral-400 text-sm">com {a.barbeiro?.nome}</span>
                  </p>
                  <p className="text-amber-400 text-sm">{formatarReais(a.precoTotalCentavos)}</p>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <p className="text-neutral-400 text-sm mb-2">Chamar próximo em nome de:</p>
            <div className="flex flex-wrap gap-2">
              {barbeirosAtivos.map((b) => (
                <form key={b.id} action={chamarProximo.bind(null, b.id)}>
                  <button
                    disabled={aguardando.length === 0}
                    className="rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 border border-neutral-700 px-4 py-2 text-sm"
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
          <p className="text-neutral-500">Fila vazia.</p>
        ) : (
          <ol className="space-y-2">
            {aguardando.map((a, i) => (
              <li
                key={a.id}
                className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-xl p-4"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-black text-amber-500 w-10 text-center">{i + 1}º</span>
                  <div>
                    <p className="font-semibold">{a.cliente.nome}</p>
                    <p className="text-neutral-400 text-sm">
                      {a.servicos.map((s) => s.nomeSnapshot).join(", ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-amber-400 font-semibold">{formatarReais(a.precoTotalCentavos)}</span>
                  <form action={cancelarAtendimento.bind(null, a.id)}>
                    <button className="text-neutral-500 hover:text-red-400 text-sm">Cancelar</button>
                  </form>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
