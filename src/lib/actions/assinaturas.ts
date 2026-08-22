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
  const dataPagamentoStr = String(formData.get("dataPagamento") ?? "").trim();

  if (!nome) return { erro: "Informe o nome do cliente." };
  if (!telefone) return { erro: "Informe o telefone do cliente." };
  if (!planoId) return { erro: "Escolha um plano." };
  if (!Number.isFinite(diaVencimento) || diaVencimento < 1 || diaVencimento > 31) {
    return { erro: "Dia de vencimento deve ser entre 1 e 31." };
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

  const novaAssinatura = await prisma.assinatura.create({
    data: { clienteId: cliente.id, planoId, barbeiroId, diaVencimento: Math.round(diaVencimento), status: "ATIVA" },
  });

  if (dataPagamentoStr) {
    const pagoEm = new Date(`${dataPagamentoStr}T12:00:00`);
    if (!Number.isNaN(pagoEm.getTime())) {
      const comp = `${pagoEm.getFullYear()}-${String(pagoEm.getMonth() + 1).padStart(2, "0")}`;
      await prisma.pagamentoAssinatura.create({
        data: { assinaturaId: novaAssinatura.id, competencia: comp, valorCentavos: plano.precoCentavos, pagoEm },
      });
    }
  }

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

export type AlterarPlanoState = { erro?: string; sucesso?: boolean };

// Deixa trocar o plano de uma assinatura já ativa (ex.: cliente que era segunda a sexta
// e agora quer segunda a sábado) sem precisar cancelar e criar uma assinatura nova.
export async function alterarPlanoAssinatura(
  assinaturaId: string,
  _prevState: AlterarPlanoState,
  formData: FormData
): Promise<AlterarPlanoState> {
  await requireSession(["ADMIN"]);

  const planoId = String(formData.get("planoId") ?? "").trim();
  if (!planoId) return { erro: "Escolha um plano." };

  const plano = await prisma.plano.findFirst({ where: { id: planoId, ativo: true } });
  if (!plano) return { erro: "Plano inválido." };

  await prisma.assinatura.update({ where: { id: assinaturaId }, data: { planoId } });

  revalidarPaginas();
  return { sucesso: true };
}

const COMPETENCIA_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export async function marcarPagamentoAssinatura(assinaturaId: string, valorCentavos: number, competencia?: string) {
  await requireSession(["ADMIN"]);
  const comp = competencia ?? competenciaAtual();
  if (!COMPETENCIA_REGEX.test(comp)) return;
  await prisma.pagamentoAssinatura.upsert({
    where: { assinaturaId_competencia: { assinaturaId, competencia: comp } },
    update: {},
    create: { assinaturaId, competencia: comp, valorCentavos },
  });
  revalidarPaginas();
}

export async function desmarcarPagamentoAssinatura(assinaturaId: string, competencia?: string) {
  await requireSession(["ADMIN"]);
  const comp = competencia ?? competenciaAtual();
  if (!COMPETENCIA_REGEX.test(comp)) return;
  await prisma.pagamentoAssinatura.deleteMany({ where: { assinaturaId, competencia: comp } });
  revalidarPaginas();
}

// Deixa registrar um pagamento numa data específica (passada ou futura) — pra assinantes que já vinham pagando
// antes de entrar no sistema, o dia real do pagamento importa, não só "hoje".
export async function marcarPagamentoComData(formData: FormData) {
  await requireSession(["ADMIN"]);

  const assinaturaId = String(formData.get("assinaturaId") ?? "");
  const valorCentavos = Number(formData.get("valorCentavos") ?? 0);
  const dataStr = String(formData.get("data") ?? "");
  if (!assinaturaId || !Number.isFinite(valorCentavos) || valorCentavos <= 0) return;

  const pagoEm = new Date(`${dataStr}T12:00:00`);
  if (Number.isNaN(pagoEm.getTime())) return;
  const competencia = `${pagoEm.getFullYear()}-${String(pagoEm.getMonth() + 1).padStart(2, "0")}`;

  await prisma.pagamentoAssinatura.upsert({
    where: { assinaturaId_competencia: { assinaturaId, competencia } },
    update: { pagoEm },
    create: { assinaturaId, competencia, valorCentavos, pagoEm },
  });
  revalidarPaginas();
}
