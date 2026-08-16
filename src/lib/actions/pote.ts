"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { calcularPote } from "@/lib/pote";

export type DistribuirPoteState = { erro?: string; sucesso?: boolean };

export async function distribuirPote(
  competencia: string,
  _prevState: DistribuirPoteState
): Promise<DistribuirPoteState> {
  await requireSession(["ADMIN"]);

  const existente = await prisma.distribuicaoPote.findUnique({ where: { competencia } });
  if (existente) return { erro: "Essa competência já foi distribuída." };

  const { totalPoteCentavos, totalFichas, itens } = await calcularPote(competencia);

  if (totalPoteCentavos <= 0) return { erro: "Não há pagamentos de assinatura registrados nessa competência." };
  if (totalFichas <= 0) return { erro: "Nenhum atendimento com serviço de ficha registrado nessa competência." };

  await prisma.distribuicaoPote.create({
    data: {
      competencia,
      totalPoteCentavos,
      totalFichas,
      itens: {
        create: itens.map((i) => ({ barbeiroId: i.barbeiroId, fichas: i.fichas, valorCentavos: i.valorCentavos })),
      },
    },
  });

  revalidatePath("/admin/rateio-assinatura");
  return { sucesso: true };
}

export async function excluirDistribuicaoPote(id: string) {
  await requireSession(["ADMIN"]);
  await prisma.distribuicaoPote.delete({ where: { id } });
  revalidatePath("/admin/rateio-assinatura");
}
