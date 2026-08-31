import { prisma } from "@/lib/prisma";

export const DIAS_VALIDADE_PADRAO = 30;

export function proximaDataDeVencimento(): Date {
  return new Date(Date.now() + DIAS_VALIDADE_PADRAO * 24 * 60 * 60 * 1000);
}

// Confere se a barbearia está ativa, desativando automaticamente (de fato,
// no banco) quem passou da data de vencimento (validaAte) sem renovar.
// Barbearias sem validaAte (ex.: a do dono da plataforma) nunca vencem.
export async function barbeariaEstaAtiva(barbearia: {
  id: string;
  ativa: boolean;
  validaAte: Date | null;
}): Promise<boolean> {
  if (!barbearia.ativa) return false;
  if (barbearia.validaAte && barbearia.validaAte <= new Date()) {
    await prisma.barbearia.update({ where: { id: barbearia.id }, data: { ativa: false } });
    return false;
  }
  return true;
}
