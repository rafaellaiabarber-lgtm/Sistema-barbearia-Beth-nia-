import { prisma } from "@/lib/prisma";
import { formatarReais } from "@/lib/format";

export default async function ClientesPage() {
  const clientes = await prisma.cliente.findMany({
    orderBy: { criadoEm: "desc" },
    include: {
      atendimentos: {
        where: { status: "CONCLUIDO" },
        orderBy: { concluidoEm: "desc" },
        include: { servicos: true, barbeiro: true },
      },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Clientes</h1>

      <div className="space-y-4">
        {clientes.map((c) => {
          const totalGasto = c.atendimentos.reduce((s, a) => s + a.precoTotalCentavos, 0);
          return (
            <details key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <summary className="cursor-pointer flex items-center justify-between">
                <span>
                  <span className="font-semibold">{c.nome}</span>{" "}
                  <span className="text-slate-500 dark:text-slate-400 text-sm">{c.telefone ?? "sem telefone"}</span>
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-sm">
                  {c.atendimentos.length} atendimento(s) · {formatarReais(totalGasto)}
                </span>
              </summary>
              <div className="mt-3 space-y-2">
                {c.atendimentos.length === 0 && (
                  <p className="text-slate-400 dark:text-slate-500 text-sm">Sem atendimentos concluídos ainda.</p>
                )}
                {c.atendimentos.map((a) => (
                  <div key={a.id} className="text-sm border-t border-slate-200 dark:border-slate-800 pt-2">
                    <p className="text-slate-700 dark:text-slate-200">
                      {a.concluidoEm?.toLocaleDateString("pt-BR")} — {a.barbeiro?.nome ?? "—"} —{" "}
                      {formatarReais(a.precoTotalCentavos)}
                    </p>
                    <p className="text-slate-400 dark:text-slate-500">{a.servicos.map((s) => s.nomeSnapshot).join(", ")}</p>
                  </div>
                ))}
              </div>
            </details>
          );
        })}
        {clientes.length === 0 && <p className="text-slate-400 dark:text-slate-500">Nenhum cliente cadastrado ainda.</p>}
      </div>
    </div>
  );
}
