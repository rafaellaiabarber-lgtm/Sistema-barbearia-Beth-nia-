"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { normalizarTelefone } from "@/lib/format";

const MAX_OFERTAS_ATIVAS = 6;
const HORAS_ENTRE_GIROS = 24;

export type OfertaState = { erro?: string };

export async function criarOferta(_prevState: OfertaState, formData: FormData): Promise<OfertaState> {
  await requireSession(["ADMIN"]);

  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return { erro: "Informe o nome do prêmio." };

  const descontoRaw = String(formData.get("desconto") ?? "").trim();
  let descontoPercentual: number | null = null;
  if (descontoRaw) {
    descontoPercentual = Number(descontoRaw);
    if (Number.isNaN(descontoPercentual) || descontoPercentual <= 0 || descontoPercentual > 100) {
      return { erro: "Desconto deve ser um número entre 1 e 100." };
    }
  }

  const ativos = await prisma.ofertaRoleta.count({ where: { ativo: true } });
  if (ativos >= MAX_OFERTAS_ATIVAS) {
    return { erro: `A roleta aceita no máximo ${MAX_OFERTAS_ATIVAS} prêmios ativos. Desative algum antes de adicionar outro.` };
  }

  const ultima = await prisma.ofertaRoleta.findFirst({ orderBy: { ordem: "desc" } });
  await prisma.ofertaRoleta.create({
    data: { nome, descontoPercentual, ordem: (ultima?.ordem ?? -1) + 1 },
  });

  revalidatePath("/admin/roleta");
  return {};
}

export async function alternarAtivoOferta(id: string, ativo: boolean) {
  await requireSession(["ADMIN"]);

  if (ativo) {
    const ativos = await prisma.ofertaRoleta.count({ where: { ativo: true } });
    if (ativos >= MAX_OFERTAS_ATIVAS) return;
  }

  await prisma.ofertaRoleta.update({ where: { id }, data: { ativo } });
  revalidatePath("/admin/roleta");
}

export async function excluirOferta(id: string) {
  await requireSession(["ADMIN"]);
  const emUso = await prisma.giroRoleta.findFirst({ where: { ofertaId: id } });
  if (emUso) {
    await prisma.ofertaRoleta.update({ where: { id }, data: { ativo: false } });
  } else {
    await prisma.ofertaRoleta.delete({ where: { id } });
  }
  revalidatePath("/admin/roleta");
}

export async function marcarGiroResgatado(id: string) {
  await requireSession(["ADMIN", "BARBEIRO"]);
  await prisma.giroRoleta.update({ where: { id }, data: { resgatadoEm: new Date() } });
  revalidatePath("/admin/roleta");
  revalidatePath("/fila");
}

export type GirarRoletaState = {
  erro?: string;
  sucesso?: boolean;
  ofertaNome?: string;
  ofertaId?: string;
};

export async function girarRoleta(
  barbeiroId: string,
  _prevState: GirarRoletaState,
  formData: FormData
): Promise<GirarRoletaState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = normalizarTelefone(String(formData.get("telefone") ?? ""));

  if (!telefone) return { erro: "Informe seu telefone." };
  if (!nome) return { erro: "Informe seu nome." };

  const barbeiro = await prisma.barbeiro.findFirst({ where: { id: barbeiroId, ativo: true } });
  if (!barbeiro) return { erro: "Link inválido." };

  const cliente = await prisma.cliente.upsert({
    where: { telefone },
    update: { nome },
    create: { nome, telefone },
  });

  const giroRecente = await prisma.giroRoleta.findFirst({
    where: {
      clienteId: cliente.id,
      criadoEm: { gte: new Date(Date.now() - HORAS_ENTRE_GIROS * 60 * 60 * 1000) },
    },
  });
  if (giroRecente) {
    return { erro: `Você já girou a roleta nas últimas ${HORAS_ENTRE_GIROS} horas. Volte outra hora!` };
  }

  const ofertas = await prisma.ofertaRoleta.findMany({ where: { ativo: true } });
  if (ofertas.length === 0) return { erro: "Nenhum prêmio disponível no momento." };

  const sorteada = ofertas[Math.floor(Math.random() * ofertas.length)];

  await prisma.giroRoleta.create({
    data: { barbeiroId, clienteId: cliente.id, ofertaId: sorteada.id },
  });

  revalidatePath("/admin/roleta");
  revalidatePath("/fila");
  return { sucesso: true, ofertaNome: sorteada.nome, ofertaId: sorteada.id };
}
