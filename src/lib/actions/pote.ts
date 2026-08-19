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

export type EditarCompetenciaPagamentoState = { erro?: string; sucesso?: boolean };

// Deixa corrigir a competência (mês) de um pagamento de assinatura já registrado — pra quando ele foi
// marcado com a data errada e acabou entrando no pote do mês errado.
export async function editarCompetenciaPagamento(
  pagamentoId: string,
  _prevState: EditarCompetenciaPagamentoState,
  formData: FormData
): Promise<EditarCompetenciaPagamentoState> {
  await requireSession(["ADMIN"]);

  const dataStr = String(formData.get("data") ?? "");
  const pagoEm = new Date(`${dataStr}T12:00:00`);
  if (Number.isNaN(pagoEm.getTime())) return { erro: "Data inválida." };
  const competencia = `${pagoEm.getFullYear()}-${String(pagoEm.getMonth() + 1).padStart(2, "0")}`;

  const pagamento = await prisma.pagamentoAssinatura.findUnique({ where: { id: pagamentoId } });
  if (!pagamento) return { erro: "Pagamento não encontrado." };

  if (competencia !== pagamento.competencia) {
    const conflito = await prisma.pagamentoAssinatura.findUnique({
      where: { assinaturaId_competencia: { assinaturaId: pagamento.assinaturaId, competencia } },
    });
    if (conflito) return { erro: `Essa assinatura já tem um pagamento registrado em ${competencia}.` };
  }

  await prisma.pagamentoAssinatura.update({ where: { id: pagamentoId }, data: { pagoEm, competencia } });

  revalidatePath("/admin/rateio-assinatura");
  revalidatePath("/admin/assinaturas");
  return { sucesso: true };
}
