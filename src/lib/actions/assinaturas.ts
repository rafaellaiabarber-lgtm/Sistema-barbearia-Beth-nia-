"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { competenciaAtual } from "@/lib/assinaturas";
import { normalizarTelefone } from "@/lib/format";

export type AssinaturaState = { erro?: string; sucesso?: boolean };

function revalidarPaginas() {
  revalidatePath("/admin/assinaturas");
  revalidatePath("/admin");
  revalidatePath("/ranking");
}

export async function criarAssinatura(
  _prevState: AssinaturaState,
  formData: FormData
): Promise<AssinaturaState> {
  await requireSession(["ADMIN"]);

  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = normalizarTelefone(String(formData.get("telefone") ?? ""));
  const planoId = String(formData.get("planoId") ?? "").trim();
  const barbeiroId = String(formData.get("barbeiroId") ?? "").trim() || null;
  const diaVencimento = Number(formData.get("diaVencimento") ?? 5);

  if (!nome) return { erro: "Informe o nome do cliente." };
  if (!telefone) return { erro: "Informe o telefone do cliente." };
  if (!planoId) return { erro: "Escolha um plano." };
  if (!Number.isFinite(diaVencimento) || diaVencimento < 1 || diaVencimento > 28) {
    return { erro: "Dia de vencimento deve ser entre 1 e 28." };
  }

  const plano = await prisma.plano.findFirst({ where: { id: planoId, ativo: true } });
  if (!plano) return { erro: "Plano inválido." };

  const cliente = await prisma.cliente.upsert({
    where: { telefone },
    update: { nome },
    create: { nome, telefone },
  });

  const jaTemAtiva = await prisma.assinatura.findFirst({
    where: { clienteId: cliente.id, status: "ATIVA" },
  });
  if (jaTemAtiva) return { erro: "Esse cliente já tem uma assinatura ativa." };

  await prisma.assinatura.create({
    data: { clienteId: cliente.id, planoId, barbeiroId, diaVencimento: Math.round(diaVencimento), status: "ATIVA" },
  });

  revalidarPaginas();
  return { sucesso: true };
}

export async function cancelarAssinatura(id: string) {
  await requireSession(["ADMIN"]);
  await prisma.assinatura.update({
    where: { id },
    data: { status: "CANCELADA", canceladaEm: new Date() },
  });
  revalidarPaginas();
}

export async function reativarAssinatura(id: string) {
  await requireSession(["ADMIN"]);
  await prisma.assinatura.update({
    where: { id },
    data: { status: "ATIVA", canceladaEm: null },
  });
  revalidarPaginas();
}

export async function marcarPagamentoAssinatura(assinaturaId: string, valorCentavos: number) {
  await requireSession(["ADMIN"]);
  const competencia = competenciaAtual();
  await prisma.pagamentoAssinatura.upsert({
    where: { assinaturaId_competencia: { assinaturaId, competencia } },
    update: {},
    create: { assinaturaId, competencia, valorCentavos },
  });
  revalidarPaginas();
}

export async function desmarcarPagamentoAssinatura(assinaturaId: string) {
  await requireSession(["ADMIN"]);
  const competencia = competenciaAtual();
  await prisma.pagamentoAssinatura.deleteMany({ where: { assinaturaId, competencia } });
  revalidarPaginas();
}
