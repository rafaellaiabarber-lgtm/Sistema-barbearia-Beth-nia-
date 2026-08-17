import { prisma } from "@/lib/prisma";
import { formatarReais } from "@/lib/format";
import { competenciaAtual, formatarCompetencia, estaInadimplente } from "@/lib/assinaturas";
import {
  cancelarAssinatura,
  reativarAssinatura,
  marcarPagamentoAssinatura,
  desmarcarPagamentoAssinatura,
  marcarPagamentoComData,
} from "@/lib/actions/assinaturas";
import { NovaAssinaturaForm } from "./nova-assinatura-form";
import { Valor } from "../../valor";

function paraCampoData(data: Date) {
  return data.toISOString().slice(0, 10);
}

export default async function AssinaturasPage({
  searchParams,
}: {
  searchParams: Promise<{ telefone?: string; nome?: string }>;
}) {
  const sp = await searchParams;
  const competencia = competenciaAtual();
  const hoje = paraCampoData(new Date());

  const [assinaturas, planosAtivos, barbeirosAtivos] = await Promise.all([
    prisma.assinatura.findMany({
      include: {
        cliente: true,
        plano: true,
        barbeiro: true,
        pagamentos: { orderBy: { competencia: "desc" } },
      },
      orderBy: [{ status: "asc" }, { criadoEm: "desc" }],
    }),
    prisma.plano.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.barbeiro.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  const ativas = assinaturas.filter((a) => a.status === "ATIVA");
  const inadimplentes = ativas.filter((a) =>
    estaInadimplente(a.diaVencimento, a.pagamentos.some((p) => p.competencia === competencia))
  );

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

      <NovaAssinaturaForm
        planos={planosAtivos}
        barbeiros={barbeirosAtivos}
        telefoneInicial={sp.telefone}
        nomeInicial={sp.nome}
      />

      <div className="space-y-2">
        {assinaturas.map((a) => {
          const pagamentoAtual = a.pagamentos.find((p) => p.competencia === competencia);
          const pago = !!pagamentoAtual;
          const outrosPagamentos = a.pagamentos.filter((p) => p.competencia !== competencia);
          const inadimplente = a.status === "ATIVA" && estaInadimplente(a.diaVencimento, pago);
          return (
            <div
              key={a.id}
              className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm ${
                a.status === "CANCELADA" ? "opacity-50" : ""
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{a.cliente.nome}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {a.plano.nome} — <Valor>{formatarReais(a.plano.precoCentavos)}</Valor>/mês · vence dia {a.diaVencimento}
                    {a.barbeiro ? ` · vendido por ${a.barbeiro.nome}` : ""} ·{" "}
                    {a.status === "CANCELADA" ? (
                      <span className="text-slate-400 dark:text-slate-500">cancelada</span>
                    ) : pago ? (
                      <span className="text-green-600 font-medium">
                        pago em {pagamentoAtual!.pagoEm.toLocaleDateString("pt-BR")} ({formatarCompetencia(competencia)})
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
                        <form action={desmarcarPagamentoAssinatura.bind(null, a.id, competencia)}>
                          <button className="rounded-lg bg-green-50 dark:bg-green-950 text-green-700 border border-green-200 px-3 py-1.5 text-sm font-medium">
                            ✓ Pago — desmarcar
                          </button>
                        </form>
                      ) : (
                        <form action={marcarPagamentoAssinatura.bind(null, a.id, a.plano.precoCentavos, competencia)}>
                          <button className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm font-medium">
                            Marcar como pago hoje
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

              {a.status === "ATIVA" && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-end gap-2">
                  <form action={marcarPagamentoComData} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="assinaturaId" value={a.id} />
                    <input type="hidden" name="valorCentavos" value={a.plano.precoCentavos} />
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                        Registrar pagamento em outra data (passada ou futura)
                      </label>
                      <input
                        type="date"
                        name="data"
                        defaultValue={hoje}
                        className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm"
                      />
                    </div>
                    <button className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium hover:border-blue-400">
                      Registrar
                    </button>
                  </form>
                </div>
              )}

              {outrosPagamentos.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
                  {outrosPagamentos.map((p) => (
                    <form key={p.id} action={desmarcarPagamentoAssinatura.bind(null, a.id, p.competencia)}>
                      <button className="rounded-lg bg-green-50 dark:bg-green-950 text-green-700 border border-green-200 px-2.5 py-1 text-xs font-medium">
                        ✓ {p.pagoEm.toLocaleDateString("pt-BR")} ({formatarCompetencia(p.competencia)}) — desmarcar
                      </button>
                    </form>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {assinaturas.length === 0 && <p className="text-slate-400 dark:text-slate-500">Nenhuma assinatura cadastrada ainda.</p>}
      </div>
    </div>
  );
}
