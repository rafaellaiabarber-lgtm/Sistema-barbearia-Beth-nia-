import { prisma } from "@/lib/prisma";
import { formatarReais } from "@/lib/format";
import { competenciaAtual, formatarCompetencia, estaInadimplente } from "@/lib/assinaturas";
import {
  cancelarAssinatura,
  reativarAssinatura,
  marcarPagamentoAssinatura,
  desmarcarPagamentoAssinatura,
} from "@/lib/actions/assinaturas";
import { NovaAssinaturaForm } from "./nova-assinatura-form";

export default async function AssinaturasPage() {
  const competencia = competenciaAtual();

  const [assinaturas, planosAtivos, barbeirosAtivos] = await Promise.all([
    prisma.assinatura.findMany({
      include: {
        cliente: true,
        plano: true,
        barbeiro: true,
        pagamentos: { where: { competencia } },
      },
      orderBy: [{ status: "asc" }, { criadoEm: "desc" }],
    }),
    prisma.plano.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.barbeiro.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  const ativas = assinaturas.filter((a) => a.status === "ATIVA");
  const inadimplentes = ativas.filter((a) => estaInadimplente(a.diaVencimento, a.pagamentos.length > 0));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Assinaturas</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-sm">Assinaturas ativas</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{ativas.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-sm">Inadimplentes ({formatarCompetencia(competencia)})</p>
          <p className={`text-2xl font-bold ${inadimplentes.length > 0 ? "text-red-600" : "text-green-600"}`}>
            {inadimplentes.length}
          </p>
        </div>
      </div>

      <NovaAssinaturaForm planos={planosAtivos} barbeiros={barbeirosAtivos} />

      <div className="space-y-2">
        {assinaturas.map((a) => {
          const pago = a.pagamentos.length > 0;
          const inadimplente = a.status === "ATIVA" && estaInadimplente(a.diaVencimento, pago);
          return (
            <div
              key={a.id}
              className={`flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm ${
                a.status === "CANCELADA" ? "opacity-50" : ""
              }`}
            >
              <div>
                <p className="font-semibold">{a.cliente.nome}</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {a.plano.nome} — {formatarReais(a.plano.precoCentavos)}/mês · vence dia {a.diaVencimento}
                  {a.barbeiro ? ` · vendido por ${a.barbeiro.nome}` : ""} ·{" "}
                  {a.status === "CANCELADA" ? (
                    <span className="text-slate-400 dark:text-slate-500">cancelada</span>
                  ) : pago ? (
                    <span className="text-green-600 font-medium">
                      pago em {formatarCompetencia(competencia)}
                    </span>
                  ) : inadimplente ? (
                    <span className="text-red-600 font-medium">
                      inadimplente ({formatarCompetencia(competencia)})
                    </span>
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400">aguardando pagamento de {formatarCompetencia(competencia)}</span>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                {a.status === "ATIVA" && (
                  <>
                    {pago ? (
                      <form action={desmarcarPagamentoAssinatura.bind(null, a.id)}>
                        <button className="rounded-lg bg-green-50 dark:bg-green-950 text-green-700 border border-green-200 px-3 py-1.5 text-sm font-medium">
                          ✓ Pago — desmarcar
                        </button>
                      </form>
                    ) : (
                      <form action={marcarPagamentoAssinatura.bind(null, a.id, a.plano.precoCentavos)}>
                        <button className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm font-medium">
                          Marcar como pago
                        </button>
                      </form>
                    )}
                    <form action={cancelarAssinatura.bind(null, a.id)}>
                      <button className="text-sm text-slate-400 dark:text-slate-500 hover:text-red-600">Cancelar</button>
                    </form>
                  </>
                )}
                {a.status === "CANCELADA" && (
                  <form action={reativarAssinatura.bind(null, a.id)}>
                    <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Reativar</button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
        {assinaturas.length === 0 && <p className="text-slate-400 dark:text-slate-500">Nenhuma assinatura cadastrada ainda.</p>}
      </div>
    </div>
  );
}
