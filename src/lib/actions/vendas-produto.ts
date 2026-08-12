"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export type VendaProdutoState = { erro?: string; sucesso?: boolean };

function revalidarRelatorios() {
  revalidatePath("/admin/caixa");
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin/fluxo-caixa");
  revalidatePath("/admin/dre");
  revalidatePath("/admin/metas");
}

export async function registrarVendaProduto(
  _prevState: VendaProdutoState,
  formData: FormData
): Promise<VendaProdutoState> {
  await requireSession(["ADMIN"]);

  const produtoId = String(formData.get("produtoId") ?? "").trim();
  const barbeiroId = String(formData.get("barbeiroId") ?? "").trim();
  const quantidade = Number.parseInt(String(formData.get("quantidade") ?? "1"), 10);
  const formaPagamento = String(formData.get("formaPagamento") ?? "");

  if (!produtoId) return { erro: "Escolha o produto." };
  if (!barbeiroId) return { erro: "Escolha o barbeiro." };
  if (!Number.isFinite(quantidade) || quantidade <= 0) return { erro: "Informe uma quantidade válida." };
  if (formaPagamento !== "DINHEIRO" && formaPagamento !== "PIX" && formaPagamento !== "CARTAO") {
    return { erro: "Escolha a forma de pagamento." };
  }

  const [produto, barbeiro] = await Promise.all([
    prisma.produto.findFirst({ where: { id: produtoId, ativo: true } }),
    prisma.barbeiro.findFirst({ where: { id: barbeiroId, ativo: true } }),
  ]);
  if (!produto) return { erro: "Produto inválido." };
  if (!barbeiro) return { erro: "Barbeiro inválido." };

  const totalCentavos = produto.precoCentavos * quantidade;

  await prisma.$transaction(async (tx) => {
    await tx.vendaProduto.create({
      data: {
        produtoId: produto.id,
        barbeiroId: barbeiro.id,
        quantidade,
        precoUnitarioCentavos: produto.precoCentavos,
        totalCentavos,
        formaPagamento,
      },
    });
    await tx.movimentoCaixa.create({
      data: {
        tipo: "ENTRADA",
        descricao: `Venda de produto — ${produto.nome} x${quantidade} (${barbeiro.nome})`,
        valorCentavos: totalCentavos,
        formaPagamento,
      },
    });
  });

  revalidarRelatorios();
  return { sucesso: true };
}
