"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export type EntrarFilaState = { erro?: string; sucesso?: boolean; posicao?: number };

export async function entrarNaFila(
  _prevState: EntrarFilaState,
  formData: FormData
): Promise<EntrarFilaState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const servicoIds = formData.getAll("servicoIds").map(String);

  if (!nome) return { erro: "Informe seu nome." };
  if (!telefone) return { erro: "Informe seu telefone." };
  if (servicoIds.length === 0) return { erro: "Escolha ao menos um serviço." };

  const servicos = await prisma.servico.findMany({
    where: { id: { in: servicoIds }, ativo: true },
  });
  if (servicos.length === 0) return { erro: "Serviços inválidos." };

  const cliente = await prisma.cliente.upsert({
    where: { telefone },
    update: { nome },
    create: { nome, telefone },
  });

  const precoTotalCentavos = servicos.reduce((soma, s) => soma + s.precoCentavos, 0);

  await prisma.atendimento.create({
    data: {
      clienteId: cliente.id,
      status: "AGUARDANDO",
      precoTotalCentavos,
      servicos: {
        create: servicos.map((s) => ({
          servicoId: s.id,
          nomeSnapshot: s.nome,
          precoCentavos: s.precoCentavos,
        })),
      },
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

export async function concluirAtendimento(atendimentoId: string) {
  await requireSession(["ADMIN", "BARBEIRO"]);
  await prisma.atendimento.update({
    where: { id: atendimentoId },
    data: { status: "CONCLUIDO", concluidoEm: new Date() },
  });
  revalidatePath("/fila");
  revalidatePath("/admin/financeiro");
}

export async function cancelarAtendimento(atendimentoId: string) {
  await requireSession(["ADMIN", "BARBEIRO"]);
  await prisma.atendimento.update({
    where: { id: atendimentoId },
    data: { status: "CANCELADO" },
  });
  revalidatePath("/fila");
}
