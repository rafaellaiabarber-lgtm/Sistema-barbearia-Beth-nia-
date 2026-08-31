"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export type IndicacaoState = { erro?: string };

function revalidar() {
  revalidatePath("/indicacoes");
  revalidatePath("/ranking");
}

export async function criarIndicacao(_prevState: IndicacaoState, formData: FormData): Promise<IndicacaoState> {
  const session = await requireSession(["ADMIN", "BARBEIRO"]);

  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const barbeiroIdForm = String(formData.get("barbeiroId") ?? "").trim();
  const barbeiroId = session.role === "ADMIN" ? barbeiroIdForm : session.barbeiroId;

  if (!nome) return { erro: "Informe o nome da indicação." };
  const digitos = telefone.replace(/\D/g, "");
  if (digitos.length < 10) return { erro: "Informe um telefone válido, com DDD." };
  if (!barbeiroId) return { erro: "Escolha o barbeiro responsável." };

  const barbeiro = await prisma.barbeiro.findFirst({
    where: { id: barbeiroId, ativo: true, barbeariaId: session.barbeariaId },
  });
  if (!barbeiro) return { erro: "Barbeiro inválido." };

  await prisma.indicacao.create({
    data: { barbeariaId: session.barbeariaId, barbeiroId, nome, telefone: digitos },
  });

  revalidar();
  return {};
}

export async function alternarContatada(indicacaoId: string, contatada: boolean) {
  const session = await requireSession(["ADMIN", "BARBEIRO"]);
  const escopo = {
    barbeariaId: session.barbeariaId,
    ...(session.role === "ADMIN" ? {} : { barbeiroId: session.barbeiroId ?? "__nenhum__" }),
  };
  await prisma.indicacao.updateMany({
    where: { id: indicacaoId, ...escopo },
    data: { contatada, contatadaEm: contatada ? new Date() : null },
  });
  revalidar();
}

export async function alternarConvertida(indicacaoId: string, convertida: boolean) {
  const session = await requireSession(["ADMIN", "BARBEIRO"]);
  const escopo = {
    barbeariaId: session.barbeariaId,
    ...(session.role === "ADMIN" ? {} : { barbeiroId: session.barbeiroId ?? "__nenhum__" }),
  };
  await prisma.indicacao.updateMany({
    where: { id: indicacaoId, ...escopo },
    data: { convertida, convertidaEm: convertida ? new Date() : null },
  });
  revalidar();
}

export async function excluirIndicacao(indicacaoId: string) {
  const session = await requireSession(["ADMIN", "BARBEIRO"]);
  const escopo = {
    barbeariaId: session.barbeariaId,
    ...(session.role === "ADMIN" ? {} : { barbeiroId: session.barbeiroId ?? "__nenhum__" }),
  };
  await prisma.indicacao.deleteMany({ where: { id: indicacaoId, ...escopo } });
  revalidar();
}
