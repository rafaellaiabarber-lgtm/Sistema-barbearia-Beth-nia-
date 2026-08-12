"use server";

import { revalidatePath } from "next/cache";
import type { TipoMeta } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { reaisParaCentavos } from "@/lib/format";
import { TIPOS_META_EM_CENTAVOS } from "@/lib/metas";

export type MetaState = { erro?: string };

const TIPOS_VALIDOS: TipoMeta[] = [
  "FATURAMENTO",
  "ATENDIMENTOS",
  "TICKET_MEDIO",
  "CLIENTES_NOVOS",
  "VENDAS_PRODUTO",
];

function revalidar() {
  revalidatePath("/admin/metas");
  revalidatePath("/admin/barbeiros");
  revalidatePath("/admin/comissoes");
  revalidatePath("/fila");
}

export async function salvarMeta(_prevState: MetaState, formData: FormData): Promise<MetaState> {
  await requireSession(["ADMIN"]);

  const metaId = String(formData.get("metaId") ?? "").trim();

  const barbeiroId = String(formData.get("barbeiroId") ?? "").trim();
  if (!barbeiroId) return { erro: "Escolha o barbeiro." };

  const tipoRaw = String(formData.get("tipo") ?? "");
  if (!TIPOS_VALIDOS.includes(tipoRaw as TipoMeta)) return { erro: "Tipo de meta inválido." };
  const tipo = tipoRaw as TipoMeta;
  const emCentavos = TIPOS_META_EM_CENTAVOS.has(tipo);

  const dataInicioRaw = String(formData.get("dataInicio") ?? "").trim();
  const dataFimRaw = String(formData.get("dataFim") ?? "").trim();
  if ((dataInicioRaw && !dataFimRaw) || (!dataInicioRaw && dataFimRaw)) {
    return { erro: "Informe as duas datas do período (início e fim), ou deixe as duas em branco pra usar o mês atual." };
  }
  const dataInicio = dataInicioRaw ? new Date(`${dataInicioRaw}T00:00:00`) : null;
  const dataFim = dataFimRaw ? new Date(`${dataFimRaw}T23:59:59.999`) : null;
  if (dataInicio && dataFim && dataFim < dataInicio) {
    return { erro: "A data final do período não pode ser antes da data inicial." };
  }

  const servicoId = tipo !== "VENDAS_PRODUTO" ? String(formData.get("servicoId") ?? "").trim() || null : null;
  const produtoId = tipo === "VENDAS_PRODUTO" ? String(formData.get("produtoId") ?? "").trim() || null : null;

  const nomes = formData.getAll("nivelNome").map(String);
  const valores = formData.getAll("nivelValor").map(String);
  const bonificacoes = formData.getAll("nivelBonificacao").map(String);

  if (nomes.length === 0) return { erro: "Adicione ao menos um nível de meta." };

  const niveis: { ordem: number; nome: string; valorAlvo: number; bonificacaoCentavos: number }[] = [];
  for (let i = 0; i < nomes.length; i++) {
    const nome = nomes[i].trim();
    if (!nome) return { erro: `Informe o nome do nível ${i + 1}.` };

    const valorAlvo = emCentavos ? reaisParaCentavos(valores[i] ?? "") : Number.parseInt(valores[i] ?? "", 10);
    if (!Number.isFinite(valorAlvo) || valorAlvo <= 0) return { erro: `Informe um valor válido para "${nome}".` };

    const bonificacaoCentavos = reaisParaCentavos(bonificacoes[i] ?? "0");
    if (bonificacaoCentavos < 0) return { erro: `Informe uma bonificação válida para "${nome}".` };

    niveis.push({ ordem: i + 1, nome, valorAlvo, bonificacaoCentavos });
  }

  for (let i = 1; i < niveis.length; i++) {
    if (niveis[i].valorAlvo <= niveis[i - 1].valorAlvo) {
      return { erro: "Cada nível deve ter um alvo maior que o nível anterior." };
    }
  }

  const dadosMeta = { barbeiroId, tipo, dataInicio, dataFim, servicoId, produtoId };

  await prisma.$transaction(async (tx) => {
    const meta = metaId
      ? await tx.meta.update({ where: { id: metaId }, data: dadosMeta })
      : await tx.meta.create({ data: dadosMeta });
    await tx.nivelMeta.deleteMany({ where: { metaId: meta.id } });
    await tx.nivelMeta.createMany({
      data: niveis.map((n) => ({ ...n, metaId: meta.id })),
    });
  });

  revalidar();
  return {};
}

export async function excluirMeta(metaId: string) {
  await requireSession(["ADMIN"]);
  await prisma.meta.delete({ where: { id: metaId } });
  revalidar();
}

export async function alternarAtivaMeta(metaId: string, ativa: boolean) {
  await requireSession(["ADMIN"]);
  await prisma.meta.update({ where: { id: metaId }, data: { ativa } });
  revalidar();
}
