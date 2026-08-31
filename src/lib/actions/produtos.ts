"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { reaisParaCentavos } from "@/lib/format";

export type ProdutoState = { erro?: string; sucesso?: boolean };

export async function criarProduto(_prevState: ProdutoState, formData: FormData): Promise<ProdutoState> {
  const session = await requireSession(["ADMIN"]);

  const nome = String(formData.get("nome") ?? "").trim();
  const preco = String(formData.get("preco") ?? "");
  const custo = String(formData.get("custo") ?? "").trim();
  const comissaoRaw = String(formData.get("comissao") ?? "").trim();

  if (!nome) return { erro: "Informe o nome do produto." };
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

  await prisma.produto.create({
    data: { barbeariaId: session.barbeariaId, nome, precoCentavos, custoCentavos, comissaoPercentual },
  });

  revalidatePath("/admin/produtos");
  revalidatePath("/admin/caixa");
  revalidatePath("/admin/metas");
  return {};
}

export async function atualizarComissaoProduto(
  id: string,
  _prevState: ProdutoState,
  formData: FormData
): Promise<ProdutoState> {
  await requireSession(["ADMIN"]);

  const comissaoRaw = String(formData.get("comissao") ?? "").trim();
  let comissaoPercentual: number | null = null;
  if (comissaoRaw) {
    comissaoPercentual = Number(comissaoRaw);
    if (Number.isNaN(comissaoPercentual) || comissaoPercentual < 0 || comissaoPercentual > 100) {
      return { erro: "Comissão deve ser um número entre 0 e 100." };
    }
  }

  await prisma.produto.update({ where: { id }, data: { comissaoPercentual } });
  revalidatePath("/admin/produtos");
  revalidatePath("/admin/caixa");
  revalidatePath("/admin/comissoes");
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin/dre");
  revalidatePath("/fila");
  revalidatePath("/ranking");
  return {};
}

export async function atualizarProduto(
  id: string,
  _prevState: ProdutoState,
  formData: FormData
): Promise<ProdutoState> {
  await requireSession(["ADMIN"]);

  const nome = String(formData.get("nome") ?? "").trim();
  const preco = String(formData.get("preco") ?? "");
  const custo = String(formData.get("custo") ?? "").trim();

  if (!nome) return { erro: "Informe o nome do produto." };
  const precoCentavos = reaisParaCentavos(preco);
  if (precoCentavos <= 0) return { erro: "Informe um preço válido." };

  const custoCentavos = custo ? reaisParaCentavos(custo) : 0;
  if (custoCentavos < 0) return { erro: "Informe um custo válido." };

  await prisma.produto.update({ where: { id }, data: { nome, precoCentavos, custoCentavos } });

  revalidatePath("/admin/produtos");
  revalidatePath("/admin/caixa");
  revalidatePath("/admin/metas");
  return { sucesso: true };
}

export async function alternarAtivoProduto(id: string, ativo: boolean) {
  await requireSession(["ADMIN"]);
  await prisma.produto.update({ where: { id }, data: { ativo } });
  revalidatePath("/admin/produtos");
  revalidatePath("/admin/caixa");
}

export async function excluirProduto(id: string) {
  await requireSession(["ADMIN"]);
  const [venda, meta] = await Promise.all([
    prisma.vendaProduto.findFirst({ where: { produtoId: id } }),
    prisma.meta.findFirst({ where: { produtoId: id } }),
  ]);
  if (venda || meta) {
    await prisma.produto.update({ where: { id }, data: { ativo: false } });
  } else {
    await prisma.produto.delete({ where: { id } });
  }
  revalidatePath("/admin/produtos");
  revalidatePath("/admin/caixa");
}
