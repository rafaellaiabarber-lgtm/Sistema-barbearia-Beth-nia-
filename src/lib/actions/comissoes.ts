"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
type PeriodoComissao = "hoje" | "semana" | "mes";

export async function marcarComissaoPaga(
  barbeiroId: string,
  periodo: PeriodoComissao,
  chave: string,
  valorCentavos: number
) {
  await requireSession(["ADMIN"]);

  await prisma.pagamentoComissao.upsert({
    where: {
      barbeiroId_periodo_chave: {
        barbeiroId,
        periodo: periodo.toUpperCase() as "HOJE" | "SEMANA" | "MES",
        chave,
      },
    },
    update: { valorCentavos },
    create: {
      barbeiroId,
      periodo: periodo.toUpperCase() as "HOJE" | "SEMANA" | "MES",
      chave,
      valorCentavos,
    },
  });

  revalidatePath("/admin/comissoes");
}

export async function desmarcarComissaoPaga(barbeiroId: string, periodo: PeriodoComissao, chave: string) {
  await requireSession(["ADMIN"]);

  await prisma.pagamentoComissao.deleteMany({
    where: { barbeiroId, periodo: periodo.toUpperCase() as "HOJE" | "SEMANA" | "MES", chave },
  });

  revalidatePath("/admin/comissoes");
}
