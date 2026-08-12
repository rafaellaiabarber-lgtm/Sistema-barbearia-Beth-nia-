"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { reaisParaCentavos } from "@/lib/format";

export type MovimentoCaixaState = { erro?: string };

export async function criarMovimentoCaixa(
  _prevState: MovimentoCaixaState,
  formData: FormData
): Promise<MovimentoCaixaState> {
  await requireSession(["ADMIN"]);

  const tipo = String(formData.get("tipo") ?? "");
  const descricao = String(formData.get("descricao") ?? "").trim();
  const valor = String(formData.get("valor") ?? "");

  if (tipo !== "ENTRADA" && tipo !== "SAIDA") return { erro: "Tipo inválido." };
  if (!descricao) return { erro: "Informe uma descrição." };

  const valorCentavos = reaisParaCentavos(valor);
  if (valorCentavos <= 0) return { erro: "Informe um valor válido." };

  await prisma.movimentoCaixa.create({
    data: { tipo, descricao, valorCentavos },
  });

  revalidatePath("/admin/caixa");
  return {};
}

export async function excluirMovimentoCaixa(id: string) {
  await requireSession(["ADMIN"]);
  await prisma.movimentoCaixa.delete({ where: { id } });
  revalidatePath("/admin/caixa");
}
