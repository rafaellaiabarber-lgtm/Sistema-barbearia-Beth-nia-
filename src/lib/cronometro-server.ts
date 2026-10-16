import "server-only";
import { prisma } from "@/lib/prisma";

const SELECT_REGISTRO = {
  id: true,
  barbeiroId: true,
  tecnicaId: true,
  tecnicaNomeSnapshot: true,
  segundosMaquina: true,
  segundosTransicao: true,
  segundosAcabamento: true,
  segundosFinalizacao: true,
  segundosTotal: true,
  concluidoEm: true,
} as const;

export async function buscarTecnicasAtivas(barbeariaId: string) {
  return prisma.tecnicaCorte.findMany({
    where: { barbeariaId, ativo: true },
    orderBy: { ordem: "asc" },
    include: { passos: { orderBy: { ordem: "asc" } } },
  });
}

/** Cortes registrados na barbearia, em ordem cronológica. Filtra por barbeiro/técnica/data quando informado. */
export async function buscarRegistros(
  barbeariaId: string,
  filtro: { barbeiroId?: string; tecnicaId?: string; desde?: Date } = {}
) {
  return prisma.registroCorte.findMany({
    where: {
      barbeariaId,
      ...(filtro.barbeiroId ? { barbeiroId: filtro.barbeiroId } : {}),
      ...(filtro.tecnicaId ? { tecnicaId: filtro.tecnicaId } : {}),
      ...(filtro.desde ? { concluidoEm: { gte: filtro.desde } } : {}),
    },
    orderBy: { concluidoEm: "asc" },
    select: SELECT_REGISTRO,
  });
}

export function diasAtras(dias: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - dias);
  return d;
}
