import { prisma } from "@/lib/prisma";

export const MINUTOS_MINIMO_AVALIACAO = 5;
export const HORAS_MAXIMO_AVALIACAO = 12;

export function buscarAtendimentosParaAvaliacao(barbeariaId: string, barbeiroId?: string) {
  const agora = new Date();
  const limiteMinimo = new Date(agora.getTime() - MINUTOS_MINIMO_AVALIACAO * 60 * 1000);
  const limiteMaximo = new Date(agora.getTime() - HORAS_MAXIMO_AVALIACAO * 60 * 60 * 1000);

  return prisma.atendimento.findMany({
    where: {
      barbeariaId,
      status: "CONCLUIDO",
      concluidoEm: { lte: limiteMinimo, gte: limiteMaximo },
      barbeiroId: barbeiroId ?? { not: null },
      cliente: { telefone: { not: null } },
    },
    include: { cliente: true, barbeiro: true, servicos: true },
    orderBy: { concluidoEm: "desc" },
  });
}
