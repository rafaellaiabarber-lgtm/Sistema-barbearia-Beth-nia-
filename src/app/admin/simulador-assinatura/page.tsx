import { prisma } from "@/lib/prisma";
import { Simulador } from "./simulador";

export const dynamic = "force-dynamic";

export default async function SimuladorAssinaturaPage() {
  const noventaDiasAtras = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [avulsos, servicos, barbeiros] = await Promise.all([
    prisma.atendimento.aggregate({
      where: {
        status: "CONCLUIDO",
        cobertoPorAssinatura: false,
        precoTotalCentavos: { gt: 0 },
        concluidoEm: { gte: noventaDiasAtras },
      },
      _avg: { precoTotalCentavos: true },
    }),
    prisma.servico.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, custoCentavos: true, comissaoPercentual: true },
    }),
    prisma.barbeiro.findMany({ where: { ativo: true }, select: { comissaoPercentual: true } }),
  ]);

  const ticketAvulsoDefault = avulsos._avg.precoTotalCentavos
    ? (Math.round(avulsos._avg.precoTotalCentavos) / 100).toFixed(2).replace(".", ",")
    : "";

  const comissaoPadrao =
    barbeiros.length > 0
      ? Math.round(barbeiros.reduce((s, b) => s + b.comissaoPercentual, 0) / barbeiros.length)
      : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Simulador de Assinatura</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        Calibre o desconto de um novo plano de assinatura e veja o preço final, o ticket por corte e o impacto no seu
        ticket médio geral, considerando quantos clientes avulsos devem migrar pra assinatura em cada nível de
        desconto.
      </p>

      <Simulador ticketAvulsoDefault={ticketAvulsoDefault} servicos={servicos} comissaoPadrao={comissaoPadrao} />
    </div>
  );
}
