"use server";

import { revalidatePath } from "next/cache";
import type { CategoriaDespesa } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { reaisParaCentavos, valorParaPercentualX100 } from "@/lib/format";

export type MovimentoCaixaState = { erro?: string };

export async function criarMovimentoCaixa(
  _prevState: MovimentoCaixaState,
  formData: FormData
): Promise<MovimentoCaixaState> {
  const session = await requireSession(["ADMIN"]);

  const tipo = String(formData.get("tipo") ?? "");
  const descricao = String(formData.get("descricao") ?? "").trim();
  const valor = String(formData.get("valor") ?? "");
  const formaPagamentoRaw = String(formData.get("formaPagamento") ?? "");
  const categoriaRaw = String(formData.get("categoria") ?? "");

  if (tipo !== "ENTRADA" && tipo !== "SAIDA") return { erro: "Tipo inválido." };
  if (!descricao) return { erro: "Informe uma descrição." };

  const valorCentavos = reaisParaCentavos(valor);
  if (valorCentavos <= 0) return { erro: "Informe um valor válido." };

  const formasValidas = ["DINHEIRO", "PIX", "CARTAO"];
  if (!formasValidas.includes(formaPagamentoRaw)) return { erro: "Escolha a forma de pagamento." };
  const formaPagamento = formaPagamentoRaw as "DINHEIRO" | "PIX" | "CARTAO";

  const categoriasValidas = ["FIXA", "VARIAVEL", "TAXA_CARTAO", "PRO_LABORE", "IMPOSTO", "OUTRA"];
  if (tipo === "SAIDA" && !categoriasValidas.includes(categoriaRaw)) {
    return { erro: "Escolha a categoria da despesa." };
  }
  const categoria = tipo === "SAIDA" ? (categoriaRaw as CategoriaDespesa) : null;

  await prisma.movimentoCaixa.create({
    data: { barbeariaId: session.barbeariaId, tipo, descricao, valorCentavos, formaPagamento, categoria },
  });

  revalidatePath("/admin/caixa");
  return {};
}

export async function excluirMovimentoCaixa(id: string) {
  await requireSession(["ADMIN"]);
  await prisma.movimentoCaixa.delete({ where: { id } });
  revalidatePath("/admin/caixa");
}

export type ConfiguracaoFinanceiraState = { erro?: string; sucesso?: boolean };

export async function atualizarTaxaCartao(
  _prevState: ConfiguracaoFinanceiraState,
  formData: FormData
): Promise<ConfiguracaoFinanceiraState> {
  const session = await requireSession(["ADMIN"]);

  const taxa = String(formData.get("taxaCartao") ?? "").trim();
  const taxaCartaoPercentualX100 = taxa ? valorParaPercentualX100(taxa) : null;
  if (taxaCartaoPercentualX100 !== null && taxaCartaoPercentualX100 < 0) {
    return { erro: "Informe uma taxa válida." };
  }

  await prisma.configuracaoFinanceira.upsert({
    where: { barbeariaId: session.barbeariaId },
    create: { barbeariaId: session.barbeariaId, taxaCartaoPercentualX100 },
    update: { taxaCartaoPercentualX100 },
  });

  revalidatePath("/admin/financeiro");
  return { sucesso: true };
}

export async function atualizarImpostoPadrao(
  _prevState: ConfiguracaoFinanceiraState,
  formData: FormData
): Promise<ConfiguracaoFinanceiraState> {
  const session = await requireSession(["ADMIN"]);

  const imposto = String(formData.get("imposto") ?? "").trim();
  const impostoPercentualX100 = imposto ? valorParaPercentualX100(imposto) : null;
  if (impostoPercentualX100 !== null && impostoPercentualX100 < 0) {
    return { erro: "Informe um percentual válido." };
  }

  await prisma.configuracaoFinanceira.upsert({
    where: { barbeariaId: session.barbeariaId },
    create: { barbeariaId: session.barbeariaId, impostoPercentualX100 },
    update: { impostoPercentualX100 },
  });

  revalidatePath("/admin/precificacao");
  return { sucesso: true };
}

export async function atualizarMetaFaturamentoMensal(
  _prevState: ConfiguracaoFinanceiraState,
  formData: FormData
): Promise<ConfiguracaoFinanceiraState> {
  const session = await requireSession(["ADMIN"]);

  const meta = String(formData.get("meta") ?? "").trim();
  const metaFaturamentoMensalCentavos = meta ? reaisParaCentavos(meta) : null;
  if (metaFaturamentoMensalCentavos !== null && metaFaturamentoMensalCentavos <= 0) {
    return { erro: "Informe uma meta válida." };
  }

  await prisma.configuracaoFinanceira.upsert({
    where: { barbeariaId: session.barbeariaId },
    create: { barbeariaId: session.barbeariaId, metaFaturamentoMensalCentavos },
    update: { metaFaturamentoMensalCentavos },
  });

  revalidatePath("/admin/gerente-virtual");
  return { sucesso: true };
}
