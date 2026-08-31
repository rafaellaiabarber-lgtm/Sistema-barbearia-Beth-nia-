"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { reaisParaCentavos } from "@/lib/format";

export type DespesaBarbeiroState = { erro?: string };

export async function criarDespesaBarbeiro(_prevState: DespesaBarbeiroState, formData: FormData): Promise<DespesaBarbeiroState> {
  const session = await requireSession(["ADMIN", "BARBEIRO"]);
  if (!session.barbeiroId) return { erro: "Essa área é só para o perfil de barbeiro." };

  const descricao = String(formData.get("descricao") ?? "").trim();
  const valorCentavos = reaisParaCentavos(String(formData.get("valor") ?? ""));
  const dataStr = String(formData.get("data") ?? "").trim();

  if (!descricao) return { erro: "Informe a descrição da despesa." };
  if (!valorCentavos || valorCentavos <= 0) return { erro: "Informe um valor válido." };
  if (!dataStr) return { erro: "Informe a data." };

  await prisma.despesaBarbeiro.create({
    data: {
      barbeariaId: session.barbeariaId,
      barbeiroId: session.barbeiroId,
      descricao,
      valorCentavos,
      data: new Date(`${dataStr}T12:00:00`),
    },
  });

  revalidatePath("/despesas");
  return {};
}

export async function excluirDespesaBarbeiro(id: string) {
  const session = await requireSession(["ADMIN", "BARBEIRO"]);
  if (!session.barbeiroId) return;
  await prisma.despesaBarbeiro.deleteMany({
    where: { id, barbeiroId: session.barbeiroId, barbeariaId: session.barbeariaId },
  });
  revalidatePath("/despesas");
}
