"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { reaisParaCentavos } from "@/lib/format";

export type ServicoState = { erro?: string };

export async function criarServico(_prevState: ServicoState, formData: FormData): Promise<ServicoState> {
  await requireSession(["ADMIN"]);

  const nome = String(formData.get("nome") ?? "").trim();
  const preco = String(formData.get("preco") ?? "");
  const duracao = Number(formData.get("duracao") ?? 30);

  if (!nome) return { erro: "Informe o nome do serviço." };
  const precoCentavos = reaisParaCentavos(preco);
  if (precoCentavos <= 0) return { erro: "Informe um preço válido." };

  await prisma.servico.create({
    data: { nome, precoCentavos, duracaoMinutos: duracao || 30 },
  });

  revalidatePath("/admin/servicos");
  return {};
}

export async function alternarAtivoServico(id: string, ativo: boolean) {
  await requireSession(["ADMIN"]);
  await prisma.servico.update({ where: { id }, data: { ativo } });
  revalidatePath("/admin/servicos");
}

export async function excluirServico(id: string) {
  await requireSession(["ADMIN"]);
  const emUso = await prisma.atendimentoServico.findFirst({ where: { servicoId: id } });
  if (emUso) {
    await prisma.servico.update({ where: { id }, data: { ativo: false } });
  } else {
    await prisma.servico.delete({ where: { id } });
  }
  revalidatePath("/admin/servicos");
}
