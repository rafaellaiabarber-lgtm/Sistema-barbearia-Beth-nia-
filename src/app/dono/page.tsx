import { prisma } from "@/lib/prisma";
import { requireDonoPlataforma } from "@/lib/tenant";
import { alternarAtivaBarbearia } from "@/lib/actions/dono";

export const dynamic = "force-dynamic";

export default async function DonoPage() {
  const session = await requireDonoPlataforma();

  const barbearias = await prisma.barbearia.findMany({
    orderBy: { criadoEm: "desc" },
    include: {
      _count: { select: { usuarios: true, clientes: true, barbeiros: true } },
    },
  });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">Barbearias cadastradas</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6">
          Painel do dono da plataforma — ative ou desative o acesso de qualquer barbearia cadastrada pelo cadastro público.
        </p>

        <div className="space-y-3">
          {barbearias.map((b) => {
            const ehMinhaPropria = b.id === session.barbeariaId;
            return (
              <div
                key={b.id}
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
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
                </div>

                {!ehMinhaPropria && (
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
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
