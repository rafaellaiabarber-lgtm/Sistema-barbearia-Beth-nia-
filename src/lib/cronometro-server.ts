import "server-only";
import { prisma } from "@/lib/prisma";

const SELECT_REGISTRO = {
  id: true,
  usuarioId: true,
  tecnicaId: true,
  tecnicaNomeSnapshot: true,
  segundosMaquina: true,
  segundosTransicao: true,
  segundosAcabamento: true,
  segundosFinalizacao: true,
  segundosTotal: true,
  concluidoEm: true,
} as const;

export async function buscarTecnicasAtivas() {
  return prisma.tecnicaCorte.findMany({
    where: { ativo: true },
    orderBy: { ordem: "asc" },
    include: { passos: { orderBy: { ordem: "asc" } } },
  });
}

/** Cortes de usuários ativos, em ordem cronológica. Filtra por usuário/técnica/data quando informado. */
export async function buscarRegistros(filtro: { usuarioId?: string; tecnicaId?: string; desde?: Date } = {}) {
  return prisma.registroCorte.findMany({
    where: {
      usuario: { ativo: true },
      ...(filtro.usuarioId ? { usuarioId: filtro.usuarioId } : {}),
      ...(filtro.tecnicaId ? { tecnicaId: filtro.tecnicaId } : {}),
      ...(filtro.desde ? { concluidoEm: { gte: filtro.desde } } : {}),
    },
    orderBy: { concluidoEm: "asc" },
    select: SELECT_REGISTRO,
  });
}

/** Todo mundo que entra em ranking/comparações: alunos ativos e o instrutor (se cronometrar). */
export async function buscarParticipantes() {
  return prisma.usuario.findMany({ where: { ativo: true }, select: { id: true, nome: true }, orderBy: { nome: "asc" } });
}

// Só os campos que as telas usam (nunca o segredoSessao).
export async function buscarConfiguracao() {
  return (
    (await prisma.configuracao.findUnique({
      where: { id: "unica" },
      select: { nomeCurso: true, codigoConvite: true },
    })) ?? { nomeCurso: "Cronômetro de Corte", codigoConvite: null }
  );
}

export function diasAtras(dias: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - dias);
  return d;
}
