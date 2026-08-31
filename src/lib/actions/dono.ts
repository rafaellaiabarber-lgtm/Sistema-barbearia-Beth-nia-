"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireDonoPlataforma } from "@/lib/tenant";
import { proximaDataDeVencimento } from "@/lib/barbearia-status";

export async function alternarAtivaBarbearia(barbeariaId: string, ativa: boolean) {
  const session = await requireDonoPlataforma();

  if (barbeariaId === session.barbeariaId) {
    return;
  }

  await prisma.barbearia.update({ where: { id: barbeariaId }, data: { ativa } });
  revalidatePath("/dono");
}

// Renova o acesso por mais 30 dias (a partir de hoje) e reativa a barbearia,
// caso tenha sido desativada automaticamente por vencimento.
export async function renovarBarbearia(barbeariaId: string) {
  const session = await requireDonoPlataforma();

  if (barbeariaId === session.barbeariaId) {
    return;
  }

  await prisma.barbearia.update({
    where: { id: barbeariaId },
    data: { ativa: true, validaAte: proximaDataDeVencimento() },
  });
  revalidatePath("/dono");
}
