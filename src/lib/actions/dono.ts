"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireDonoPlataforma } from "@/lib/tenant";

export async function alternarAtivaBarbearia(barbeariaId: string, ativa: boolean) {
  const session = await requireDonoPlataforma();

  if (barbeariaId === session.barbeariaId) {
    return;
  }

  await prisma.barbearia.update({ where: { id: barbeariaId }, data: { ativa } });
  revalidatePath("/dono");
}
