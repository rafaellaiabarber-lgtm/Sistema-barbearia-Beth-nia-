"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function buscarNomePorTelefone(telefone: string): Promise<string | null> {
  if (!telefone) return null;
  const cliente = await prisma.cliente.findUnique({ where: { telefone } });
  return cliente?.nome ?? null;
}

export type EntrarFilaState = { erro?: string; sucesso?: boolean; posicao?: number };

export async function entrarNaFila(
  _prevState: EntrarFilaState,
  formData: FormData
): Promise<EntrarFilaState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const barbeiroPreferidoId = String(formData.get("barbeiroPreferidoId") ?? "").trim() || null;

  if (!telefone) return { erro: "Informe seu telefone." };
  if (!nome) return { erro: "Informe seu nome." };

  if (barbeiroPreferidoId) {
    const barbeiro = await prisma.barbeiro.findFirst({
      where: { id: barbeiroPreferidoId, ativo: true },
    });
    if (!barbeiro) return { erro: "Barbeiro inválido." };
  }

  const cliente = await prisma.cliente.upsert({
    where: { telefone },
    update: { nome },
    create: { nome, telefone },
  });

  await prisma.atendimento.create({
    data: {
      clienteId: cliente.id,
      status: "AGUARDANDO",
      barbeiroPreferidoId,
    },
  });

  const posicao = await prisma.atendimento.count({ where: { status: "AGUARDANDO" } });

  revalidatePath("/fila");
  return { sucesso: true, posicao };
}

export async function chamarProximo(barbeiroIdSelecionado?: string) {
  const session = await requireSession(["ADMIN", "BARBEIRO"]);
  const barbeiroId = session.role === "BARBEIRO" ? session.barbeiroId : barbeiroIdSelecionado;
  if (!barbeiroId) return;

  const emAndamento = await prisma.atendimento.findFirst({
    where: { barbeiroId, status: "EM_ATENDIMENTO" },
  });
  if (emAndamento) return;

  const proximo = await prisma.atendimento.findFirst({
    where: { status: "AGUARDANDO" },
    orderBy: { criadoEm: "asc" },
  });
  if (!proximo) return;

  await prisma.atendimento.update({
    where: { id: proximo.id },
    data: { status: "EM_ATENDIMENTO", barbeiroId, chamadoEm: new Date() },
  });

  revalidatePath("/fila");
}

export async function chamarCliente(atendimentoId: string) {
  const session = await requireSession(["ADMIN", "BARBEIRO"]);
  if (session.role !== "BARBEIRO" || !session.barbeiroId) return;
  const barbeiroId = session.barbeiroId;

  const emAndamento = await prisma.atendimento.findFirst({
    where: { barbeiroId, status: "EM_ATENDIMENTO" },
  });
  if (emAndamento) return;

  const atendimento = await prisma.atendimento.findFirst({
    where: { id: atendimentoId, status: "AGUARDANDO" },
  });
  if (!atendimento) return;

  await prisma.atendimento.update({
    where: { id: atendimentoId },
    data: { status: "EM_ATENDIMENTO", barbeiroId, chamadoEm: new Date() },
  });

  revalidatePath("/fila");
}

export type ConcluirState = { erro?: string };

export async function concluirAtendimento(
  atendimentoId: string,
  _prevState: ConcluirState,
  formData: FormData
): Promise<ConcluirState> {
  await requireSession(["ADMIN", "BARBEIRO"]);

  const servicoIds = formData.getAll("servicoIds").map(String);
  if (servicoIds.length === 0) {
    return { erro: "Escolha ao menos um serviço realizado." };
  }

  const [servicos, atendimento] = await Promise.all([
    prisma.servico.findMany({ where: { id: { in: servicoIds } } }),
    prisma.atendimento.findUnique({ where: { id: atendimentoId }, include: { barbeiro: true } }),
  ]);
  if (servicos.length === 0) return { erro: "Serviços inválidos." };

  const comissaoPadrao = atendimento?.barbeiro?.comissaoPercentual ?? 0;
  const precoTotalCentavos = servicos.reduce((soma, s) => soma + s.precoCentavos, 0);

  await prisma.atendimento.update({
    where: { id: atendimentoId },
    data: {
      status: "CONCLUIDO",
      concluidoEm: new Date(),
      precoTotalCentavos,
      servicos: {
        create: servicos.map((s) => ({
          servicoId: s.id,
          nomeSnapshot: s.nome,
          precoCentavos: s.precoCentavos,
          custoCentavos: s.custoCentavos,
          comissaoPercentual: s.comissaoPercentual ?? comissaoPadrao,
        })),
      },
    },
  });

  revalidatePath("/fila");
  revalidatePath("/admin/financeiro");
  return {};
}

export async function cancelarAtendimento(atendimentoId: string) {
  await requireSession(["ADMIN", "BARBEIRO"]);
  await prisma.atendimento.update({
    where: { id: atendimentoId },
    data: { status: "CANCELADO" },
  });
  revalidatePath("/fila");
}

export async function desfazerInicioAtendimento(atendimentoId: string) {
  const session = await requireSession(["ADMIN", "BARBEIRO"]);

  const atendimento = await prisma.atendimento.findFirst({
    where: { id: atendimentoId, status: "EM_ATENDIMENTO" },
  });
  if (!atendimento) return;
  if (session.role === "BARBEIRO" && atendimento.barbeiroId !== session.barbeiroId) return;

  await prisma.atendimento.update({
    where: { id: atendimentoId },
    data: { status: "AGUARDANDO", barbeiroId: null, chamadoEm: null },
  });
  revalidatePath("/fila");
}
