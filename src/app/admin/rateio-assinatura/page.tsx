import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { competenciaAtual, formatarCompetencia } from "@/lib/assinaturas";
import { calcularPote } from "@/lib/pote";
import { formatarReais } from "@/lib/format";
import { excluirDistribuicaoPote } from "@/lib/actions/pote";
import { DistribuirButton } from "./distribuir-button";
import { EditarPagamento } from "../editar-pagamento";
import { Valor } from "../../valor";

export const dynamic = "force-dynamic";

function competenciaAdjacente(competencia: string, delta: number): string {
  const [ano, mes] = competencia.split("-").map(Number);
  const d = new Date(ano, mes - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function RateioAssinaturaPage({
  searchParams,
}: {
  searchParams: Promise<{ competencia?: string }>;
}) {
  const { competencia: competenciaParam } = await searchParams;
  const competencia =
    competenciaParam && /^\d{4}-\d{2}$/.test(competenciaParam) ? competenciaParam : competenciaAtual();

  const [distribuicaoExistente, historico] = await Promise.all([
    prisma.distribuicaoPote.findUnique({
      where: { competencia },
      include: { itens: { include: { barbeiro: true }, orderBy: { valorCentavos: "desc" } } },
    }),
    prisma.distribuicaoPote.findMany({
      where: { competencia: { not: competencia } },
      include: { itens: { include: { barbeiro: true }, orderBy: { valorCentavos: "desc" } } },
      orderBy: { competencia: "desc" },
      take: 6,
    }),
  ]);

  const preview = distribuicaoExistente ? null : await calcularPote(competencia);
  const pagamentos = distribuicaoExistente
    ? []
    : await prisma.pagamentoAssinatura.findMany({
        where: { competencia },
        include: { assinatura: { include: { cliente: true, plano: true } } },
        orderBy: { pagoEm: "asc" },
      });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Distribuição de Assinatura</h1>
      <p className="text-neutral-400 dark:text-neutral-500 text-sm mb-6">
        Todo mês, o valor recebido das assinaturas entra num pote único e é dividido entre os barbeiros conforme
        as fichas dos serviços que cada um realizou no mês. Configure quantas fichas vale cada serviço em
        Serviços — todo atendimento lançado com esse serviço já conta automaticamente, sem precisar marcar nada.
      </p>

      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/admin/rateio-assinatura?competencia=${competenciaAdjacente(competencia, -1)}`}
          className="text-orange-600 dark:text-orange-400 text-sm hover:underline"
        >
          ← mês anterior
        </Link>
        <h2 className="text-lg font-semibold capitalize">{formatarCompetencia(competencia)}</h2>
        <Link
          href={`/admin/rateio-assinatura?competencia=${competenciaAdjacente(competencia, 1)}`}
          className="text-orange-600 dark:text-orange-400 text-sm hover:underline"
        >
          próximo mês →
        </Link>
      </div>

      {distribuicaoExistente ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">Pote distribuído</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                <Valor>{formatarReais(distribuicaoExistente.totalPoteCentavos)}</Valor>
              </p>
              <p className="text-neutral-400 dark:text-neutral-500 text-xs">
                {distribuicaoExistente.totalFichas} ficha(s) no total · distribuído em{" "}
                {distribuicaoExistente.criadoEm.toLocaleDateString("pt-BR")}
              </p>
            </div>
            <form action={excluirDistribuicaoPote.bind(null, distribuicaoExistente.id)}>
              <button className="text-sm text-neutral-400 dark:text-neutral-500 hover:text-red-600">
                Excluir e recalcular
              </button>
            </form>
          </div>
          <div className="space-y-2">
            {distribuicaoExistente.itens.map((i) => (
              <div
                key={i.id}
                className="flex items-center justify-between text-sm border-t border-neutral-100 dark:border-neutral-800 pt-2"
              >
                <span className="font-medium">{i.barbeiro.nome}</span>
                <span className="text-neutral-500 dark:text-neutral-400">{i.fichas} ficha(s)</span>
                <span className="font-semibold text-green-600">
                  <Valor>{formatarReais(i.valorCentavos)}</Valor>
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm mb-8">
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">Pote do mês (prévia)</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            <Valor>{formatarReais(preview!.totalPoteCentavos)}</Valor>
          </p>
          <p className="text-neutral-400 dark:text-neutral-500 text-xs mb-4">
            {preview!.totalFichas} ficha(s) até agora nessa competência
          </p>

          {preview!.itens.length > 0 ? (
            <div className="space-y-2 mb-4">
              {preview!.itens.map((i) => (
                <div
                  key={i.barbeiroId}
                  className="flex items-center justify-between text-sm border-t border-neutral-100 dark:border-neutral-800 pt-2"
                >
                  <span className="font-medium">{i.nome}</span>
                  <span className="text-neutral-500 dark:text-neutral-400">{i.fichas} ficha(s)</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    <Valor>{formatarReais(i.valorCentavos)}</Valor>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-400 dark:text-neutral-500 text-sm mb-4">
              Nenhum atendimento com serviço de ficha registrado ainda nessa competência.
            </p>
          )}

          <DistribuirButton competencia={competencia} />
        </div>
      )}

      {!distribuicaoExistente && pagamentos.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm mb-8">
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-1">Pagamentos que entram nesse pote</p>
          <p className="text-neutral-400 dark:text-neutral-500 text-xs mb-4">
            Se algum pagamento foi registrado com a data errada e caiu no mês errado, corrija a data aqui.
          </p>
          <div className="space-y-2">
            {pagamentos.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm border-t border-neutral-100 dark:border-neutral-800 pt-2"
              >
                <div>
                  <p className="font-medium">{p.assinatura.cliente.nome}</p>
                  <p className="text-neutral-400 dark:text-neutral-500 text-xs">
                    {p.assinatura.plano.nome} · pago em {p.pagoEm.toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    <Valor>{formatarReais(p.valorCentavos)}</Valor>
                  </span>
                  <EditarPagamento pagamentoId={p.id} dataAtual={p.pagoEm.toISOString().slice(0, 10)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {historico.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mb-3">Histórico</h2>
          <div className="space-y-2">
            {historico.map((d) => (
              <details
                key={d.id}
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm"
              >
                <summary className="cursor-pointer flex items-center justify-between text-sm">
                  <span className="font-semibold capitalize">{formatarCompetencia(d.competencia)}</span>
                  <span className="text-orange-600 dark:text-orange-400 font-semibold">
                    <Valor>{formatarReais(d.totalPoteCentavos)}</Valor>
                  </span>
                </summary>
                <div className="mt-3 space-y-2">
                  {d.itens.map((i) => (
                    <div key={i.id} className="flex items-center justify-between text-sm">
                      <span>{i.barbeiro.nome}</span>
                      <span className="text-neutral-500 dark:text-neutral-400">{i.fichas} ficha(s)</span>
                      <span className="font-semibold text-green-600">
                        <Valor>{formatarReais(i.valorCentavos)}</Valor>
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
