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
  const custo = String(formData.get("custo") ?? "").trim();
  const duracao = Number(formData.get("duracao") ?? 30);
  const comissaoRaw = String(formData.get("comissao") ?? "").trim();

  if (!nome) return { erro: "Informe o nome do serviço." };
  const precoCentavos = reaisParaCentavos(preco);
  if (precoCentavos <= 0) return { erro: "Informe um preço válido." };

  const custoCentavos = custo ? reaisParaCentavos(custo) : 0;
  if (custoCentavos < 0) return { erro: "Informe um custo válido." };

  let comissaoPercentual: number | null = null;
  if (comissaoRaw) {
    comissaoPercentual = Number(comissaoRaw);
    if (Number.isNaN(comissaoPercentual) || comissaoPercentual < 0 || comissaoPercentual > 100) {
      return { erro: "Comissão deve ser um número entre 0 e 100." };
    }
  }

  await prisma.servico.create({
    data: { nome, precoCentavos, custoCentavos, duracaoMinutos: duracao || 30, comissaoPercentual },
  });

  revalidatePath("/admin/servicos");
  return {};
}

export async function alternarAtivoServico(id: string, ativo: boolean) {
  await requireSession(["ADMIN"]);
  await prisma.servico.update({ where: { id }, data: { ativo } });
  revalidatePath("/admin/servicos");
}

export async function atualizarComissaoServico(
  id: string,
  _prevState: ServicoState,
  formData: FormData
): Promise<ServicoState> {
  await requireSession(["ADMIN"]);

  const comissaoRaw = String(formData.get("comissao") ?? "").trim();
  let comissaoPercentual: number | null = null;
  if (comissaoRaw) {
    comissaoPercentual = Number(comissaoRaw);
    if (Number.isNaN(comissaoPercentual) || comissaoPercentual < 0 || comissaoPercentual > 100) {
      return { erro: "Comissão deve ser um número entre 0 e 100." };
    }
  }

  await prisma.servico.update({ where: { id }, data: { comissaoPercentual } });
  revalidatePath("/admin/servicos");
  return {};
}

export async function atualizarCustoServico(
  id: string,
  _prevState: ServicoState,
  formData: FormData
): Promise<ServicoState> {
  await requireSession(["ADMIN"]);

  const custo = String(formData.get("custo") ?? "").trim();
  const custoCentavos = custo ? reaisParaCentavos(custo) : 0;
  if (custoCentavos < 0) return { erro: "Informe um custo válido." };

  await prisma.servico.update({ where: { id }, data: { custoCentavos } });
  revalidatePath("/admin/servicos");
  return {};
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
