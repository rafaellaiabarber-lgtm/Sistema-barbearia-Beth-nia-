import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireDonoPlataforma } from "@/lib/tenant";
import { barbeariaEstaAtiva } from "@/lib/barbearia-status";
import { alternarAtivaBarbearia, renovarBarbearia } from "@/lib/actions/dono";

export const dynamic = "force-dynamic";

export default async function DonoPage() {
  const session = await requireDonoPlataforma();

  const barbearias = await prisma.barbearia.findMany({
    orderBy: { criadoEm: "desc" },
    include: {
      _count: { select: { usuarios: true, clientes: true, barbeiros: true } },
    },
  });

  // Aplica o vencimento automático (desativa quem passou de validaAte) antes de exibir a lista.
  const statusAtualizado = await Promise.all(
    barbearias.map(async (b) => ({ ...b, ativa: b.ativa && (await barbeariaEstaAtiva(b)) }))
  );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-1">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Barbearias cadastradas</h1>
          <Link
            href="/dono/pagina-de-vendas"
            className="shrink-0 text-sm font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400"
          >
            Editar página de vendas →
          </Link>
        </div>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6">
          Painel do dono da plataforma — ative, desative ou renove o acesso de qualquer barbearia cadastrada pelo
          cadastro público. Sem renovar, o acesso vence sozinho 30 dias depois do cadastro (ou da última renovação).
        </p>

        <div className="space-y-3">
          {statusAtualizado.map((b) => {
            const ehMinhaPropria = b.id === session.barbeariaId;
            const vencida = Boolean(b.validaAte && b.validaAte <= new Date());
            return (
              <div
                key={b.id}
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-neutral-900 dark:text-white">{b.nome}</span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        b.ativa
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                      }`}
                    >
                      {b.ativa ? "Ativa" : "Desativada"}
                    </span>
                    {ehMinhaPropria && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                        Sua barbearia
                      </span>
                    )}
                  </div>
                  <p className="text-neutral-400 dark:text-neutral-500 text-sm">/{b.slug}</p>
                  <p className="text-neutral-400 dark:text-neutral-500 text-xs mt-1">
                    {b._count.usuarios} usuário(s) · {b._count.barbeiros} barbeiro(s) · {b._count.clientes} cliente(s) · cadastrada em{" "}
                    {b.criadoEm.toLocaleDateString("pt-BR")}
                  </p>
                  {b.validaAte && (
                    <p className={`text-xs mt-1 font-medium ${vencida ? "text-red-500" : "text-neutral-400 dark:text-neutral-500"}`}>
                      {vencida ? "Vencida em " : "Vence em "}
                      {b.validaAte.toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>

                {!ehMinhaPropria && (
                  <div className="flex items-center gap-2 shrink-0">
                    <form action={renovarBarbearia.bind(null, b.id)}>
                      <button className="text-sm font-semibold px-3 py-2 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-900/50 transition-colors">
                        Renovar +30 dias
                      </button>
                    </form>
                    <form action={alternarAtivaBarbearia.bind(null, b.id, !b.ativa)}>
                      <button
                        className={`text-sm font-semibold px-3 py-2 rounded-lg transition-colors ${
                          b.ativa
                            ? "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                            : "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
                        }`}
                      >
                        {b.ativa ? "Desativar" : "Ativar"}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
