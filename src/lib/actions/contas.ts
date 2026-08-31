"use server";

import { revalidatePath } from "next/cache";
import type { CategoriaDespesa, FormaPagamento } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { reaisParaCentavos } from "@/lib/format";

export type ContaState = { erro?: string };

function revalidar() {
  revalidatePath("/admin/contas");
  revalidatePath("/admin/caixa");
  revalidatePath("/admin/financeiro");
}

export async function criarConta(
  tipo: "PAGAR" | "RECEBER",
  _prevState: ContaState,
  formData: FormData
): Promise<ContaState> {
  const session = await requireSession(["ADMIN"]);

  const descricao = String(formData.get("descricao") ?? "").trim();
  const valor = String(formData.get("valor") ?? "");
  const vencimentoRaw = String(formData.get("vencimento") ?? "");
  const categoriaRaw = String(formData.get("categoria") ?? "");

  if (!descricao) return { erro: "Informe uma descrição." };

  const valorCentavos = reaisParaCentavos(valor);
  if (valorCentavos <= 0) return { erro: "Informe um valor válido." };

  if (!vencimentoRaw) return { erro: "Informe a data de vencimento." };
  const vencimento = new Date(`${vencimentoRaw}T12:00:00`);
  if (Number.isNaN(vencimento.getTime())) return { erro: "Data de vencimento inválida." };

  const categoriasValidas = ["FIXA", "VARIAVEL", "TAXA_CARTAO", "PRO_LABORE", "IMPOSTO", "OUTRA"];
  const categoria =
    tipo === "PAGAR" && categoriasValidas.includes(categoriaRaw) ? (categoriaRaw as CategoriaDespesa) : null;

  await prisma.contaFinanceira.create({
    data: { barbeariaId: session.barbeariaId, tipo, descricao, valorCentavos, vencimento, categoria },
  });

  revalidar();
  return {};
}

export async function marcarContaPaga(id: string, _prevState: ContaState, formData: FormData): Promise<ContaState> {
  const session = await requireSession(["ADMIN"]);

  const formaPagamentoRaw = String(formData.get("formaPagamento") ?? "");
  if (formaPagamentoRaw !== "DINHEIRO" && formaPagamentoRaw !== "PIX" && formaPagamentoRaw !== "CARTAO") {
    return { erro: "Escolha a forma de pagamento." };
  }
  const formaPagamento = formaPagamentoRaw as FormaPagamento;

  const conta = await prisma.contaFinanceira.findUnique({ where: { id } });
  if (!conta || conta.status === "PAGO") return {};

  const movimento = await prisma.movimentoCaixa.create({
    data: {
      barbeariaId: session.barbeariaId,
      tipo: conta.tipo === "PAGAR" ? "SAIDA" : "ENTRADA",
      descricao: conta.descricao,
      valorCentavos: conta.valorCentavos,
      formaPagamento,
      categoria: conta.tipo === "PAGAR" ? conta.categoria : null,
    },
  });

  await prisma.contaFinanceira.update({
    where: { id },
    data: { status: "PAGO", pagoEm: new Date(), movimentoId: movimento.id },
  });

  revalidar();
  return {};
}

export async function excluirConta(id: string) {
  await requireSession(["ADMIN"]);
  await prisma.contaFinanceira.delete({ where: { id } });
  revalidar();
}
