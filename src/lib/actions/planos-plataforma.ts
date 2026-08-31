"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireDonoPlataforma } from "@/lib/tenant";

export type PlanoPlataformaState = { erro?: string };

export async function listarPlanosPlataformaAtivos() {
  return prisma.planoPlataforma.findMany({ where: { ativo: true }, orderBy: { ordem: "asc" } });
}

export async function listarPlanosPlataforma() {
  await requireDonoPlataforma();
  return prisma.planoPlataforma.findMany({ orderBy: { ordem: "asc" } });
}

function lerCampos(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const precoStr = String(formData.get("preco") ?? "").replace(",", ".");
  const periodo = String(formData.get("periodo") ?? "").trim();
  const linkPagamento = String(formData.get("linkPagamento") ?? "").trim();
  return { nome, descricao, precoStr, periodo, linkPagamento };
}

export async function criarPlanoPlataforma(_prevState: PlanoPlataformaState, formData: FormData): Promise<PlanoPlataformaState> {
  await requireDonoPlataforma();
  const { nome, descricao, precoStr, periodo, linkPagamento } = lerCampos(formData);

  if (!nome) return { erro: "Informe o nome do plano." };
  const preco = Number(precoStr);
  if (!precoStr || Number.isNaN(preco) || preco <= 0) return { erro: "Informe um preço válido." };
  if (!periodo) return { erro: "Informe o período (ex: mês, ano)." };
  if (!linkPagamento || !/^https?:\/\//.test(linkPagamento)) {
    return { erro: "Informe um link de pagamento válido (começando com http:// ou https://)." };
  }

  const ultimo = await prisma.planoPlataforma.findFirst({ orderBy: { ordem: "desc" } });

  await prisma.planoPlataforma.create({
    data: {
      nome,
      descricao: descricao || null,
      precoCentavos: Math.round(preco * 100),
      periodo,
      linkPagamento,
      ordem: (ultimo?.ordem ?? -1) + 1,
    },
  });

  revalidatePath("/dono/planos");
  revalidatePath("/assinar");
  return {};
}

export async function atualizarPlanoPlataforma(id: string, _prevState: PlanoPlataformaState, formData: FormData): Promise<PlanoPlataformaState> {
  await requireDonoPlataforma();
  const { nome, descricao, precoStr, periodo, linkPagamento } = lerCampos(formData);

  if (!nome) return { erro: "Informe o nome do plano." };
  const preco = Number(precoStr);
  if (!precoStr || Number.isNaN(preco) || preco <= 0) return { erro: "Informe um preço válido." };
  if (!periodo) return { erro: "Informe o período (ex: mês, ano)." };
  if (!linkPagamento || !/^https?:\/\//.test(linkPagamento)) {
    return { erro: "Informe um link de pagamento válido (começando com http:// ou https://)." };
  }

  await prisma.planoPlataforma.update({
    where: { id },
    data: { nome, descricao: descricao || null, precoCentavos: Math.round(preco * 100), periodo, linkPagamento },
  });

  revalidatePath("/dono/planos");
  revalidatePath("/assinar");
  return {};
}

export async function alternarAtivoPlanoPlataforma(id: string, ativo: boolean) {
  await requireDonoPlataforma();
  await prisma.planoPlataforma.update({ where: { id }, data: { ativo } });
  revalidatePath("/dono/planos");
  revalidatePath("/assinar");
}

export async function excluirPlanoPlataforma(id: string) {
  await requireDonoPlataforma();
  await prisma.planoPlataforma.delete({ where: { id } });
  revalidatePath("/dono/planos");
  revalidatePath("/assinar");
}
