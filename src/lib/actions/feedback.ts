"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const PERIODICIDADES = ["SEMANAL", "MENSAL", "AVULSO"] as const;

export type TemaState = { erro?: string };

export async function criarTemaFeedback(_prevState: TemaState, formData: FormData): Promise<TemaState> {
  const session = await requireSession(["ADMIN"]);

  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return { erro: "Informe o nome do tema." };

  await prisma.temaFeedback.create({ data: { barbeariaId: session.barbeariaId, nome } });

  revalidatePath("/admin/feedback");
  return {};
}

export async function alternarAtivoTema(id: string, ativo: boolean) {
  await requireSession(["ADMIN"]);
  await prisma.temaFeedback.update({ where: { id }, data: { ativo } });
  revalidatePath("/admin/feedback");
}

export type FeedbackState = { erro?: string; sucesso?: boolean };

export async function criarFeedback(_prevState: FeedbackState, formData: FormData): Promise<FeedbackState> {
  const session = await requireSession(["ADMIN"]);

  const barbeiroId = String(formData.get("barbeiroId") ?? "").trim();
  const temaId = String(formData.get("temaId") ?? "").trim();
  const periodicidade = String(formData.get("periodicidade") ?? "");
  const notaTexto = String(formData.get("nota") ?? "").trim();
  const observacoes = String(formData.get("observacoes") ?? "").trim();

  if (!barbeiroId) return { erro: "Escolha o barbeiro." };
  if (!temaId) return { erro: "Escolha o tema." };
  if (!PERIODICIDADES.includes(periodicidade as (typeof PERIODICIDADES)[number])) {
    return { erro: "Escolha a periodicidade." };
  }
  const nota = Number.parseInt(notaTexto, 10);
  if (Number.isNaN(nota) || nota < 0 || nota > 10) return { erro: "A nota deve ser de 0 a 10." };

  const [barbeiro, tema] = await Promise.all([
    prisma.barbeiro.findUnique({ where: { id: barbeiroId } }),
    prisma.temaFeedback.findUnique({ where: { id: temaId } }),
  ]);
  if (!barbeiro) return { erro: "Barbeiro inválido." };
  if (!tema) return { erro: "Tema inválido." };

  await prisma.feedback.create({
    data: {
      barbeariaId: session.barbeariaId,
      barbeiroId,
      temaId,
      temaNomeSnapshot: tema.nome,
      periodicidade: periodicidade as (typeof PERIODICIDADES)[number],
      nota,
      observacoes: observacoes || null,
    },
  });

  revalidatePath("/admin/feedback");
  return { sucesso: true };
}

export async function excluirFeedback(id: string) {
  await requireSession(["ADMIN"]);
  await prisma.feedback.delete({ where: { id } });
  revalidatePath("/admin/feedback");
}
