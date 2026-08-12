"use server";

import { revalidatePath } from "next/cache";
import type { TipoMeta } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { reaisParaCentavos } from "@/lib/format";

export type MetaState = { erro?: string };

const TIPOS_VALIDOS: TipoMeta[] = ["FATURAMENTO", "ATENDIMENTOS", "TICKET_MEDIO", "CLIENTES_NOVOS"];
const TIPOS_EM_CENTAVOS: TipoMeta[] = ["FATURAMENTO", "TICKET_MEDIO"];

function revalidar() {
  revalidatePath("/admin/metas");
  revalidatePath("/admin/barbeiros");
  revalidatePath("/admin/comissoes");
  revalidatePath("/fila");
}

export async function salvarMeta(_prevState: MetaState, formData: FormData): Promise<MetaState> {
  await requireSession(["ADMIN"]);

  const barbeiroId = String(formData.get("barbeiroId") ?? "").trim();
  if (!barbeiroId) return { erro: "Escolha o barbeiro." };

  const tipoRaw = String(formData.get("tipo") ?? "");
  if (!TIPOS_VALIDOS.includes(tipoRaw as TipoMeta)) return { erro: "Tipo de meta inválido." };
  const tipo = tipoRaw as TipoMeta;
  const emCentavos = TIPOS_EM_CENTAVOS.includes(tipo);

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

  await prisma.$transaction(async (tx) => {
    const meta = await tx.meta.upsert({
      where: { barbeiroId_tipo: { barbeiroId, tipo } },
      create: { barbeiroId, tipo },
      update: {},
    });
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
