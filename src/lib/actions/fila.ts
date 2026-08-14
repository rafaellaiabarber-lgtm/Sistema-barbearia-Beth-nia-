"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { normalizarTelefone } from "@/lib/format";
import { diaCobertoHoje, formatarDiasSemana } from "@/lib/assinaturas";

export async function buscarNomePorTelefone(telefone: string): Promise<string | null> {
  if (!telefone) return null;
  const cliente = await prisma.cliente.findUnique({ where: { telefone: normalizarTelefone(telefone) } });
  return cliente?.nome ?? null;
}

export type ClienteInfo = {
  nome: string | null;
  planoAtivo: string | null;
  planoCobertoHoje: boolean;
  planoDiasTexto: string | null;
};

export async function buscarClienteInfoPorTelefone(telefone: string): Promise<ClienteInfo> {
  if (!telefone) return { nome: null, planoAtivo: null, planoCobertoHoje: true, planoDiasTexto: null };
  const cliente = await prisma.cliente.findUnique({
    where: { telefone: normalizarTelefone(telefone) },
    include: { assinaturas: { where: { status: "ATIVA" }, include: { plano: true }, take: 1 } },
  });
  const plano = cliente?.assinaturas[0]?.plano;
  return {
    nome: cliente?.nome ?? null,
    planoAtivo: plano?.nome ?? null,
    planoCobertoHoje: plano ? diaCobertoHoje(plano.diasSemana) : true,
    planoDiasTexto: plano ? formatarDiasSemana(plano.diasSemana) : null,
  };
}

export type EntrarFilaState = {
  erro?: string;
  sucesso?: boolean;
  posicao?: number;
  acompanhanteNome?: string;
  acompanhantePosicao?: number;
};

export async function entrarNaFila(
  _prevState: EntrarFilaState,
  formData: FormData
): Promise<EntrarFilaState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = normalizarTelefone(String(formData.get("telefone") ?? ""));
  const barbeiroPreferidoId = String(formData.get("barbeiroPreferidoId") ?? "").trim() || null;
  const acompanhanteNome = String(formData.get("acompanhanteNome") ?? "").trim();
  const acompanhanteTelefone = normalizarTelefone(String(formData.get("acompanhanteTelefone") ?? ""));

  if (!telefone) return { erro: "Informe seu telefone." };
  if (!nome) return { erro: "Informe seu nome." };

  const [barbeiro, cliente] = await Promise.all([
    barbeiroPreferidoId
      ? prisma.barbeiro.findFirst({ where: { id: barbeiroPreferidoId, ativo: true } })
      : Promise.resolve(null),
    prisma.cliente.upsert({
      where: { telefone },
      update: { nome },
      create: { nome, telefone },
    }),
  ]);
  if (barbeiroPreferidoId && !barbeiro) return { erro: "Barbeiro inválido." };

  await prisma.atendimento.create({
    data: {
      clienteId: cliente.id,
      status: "AGUARDANDO",
      barbeiroPreferidoId,
    },
  });

  const [posicao, acompanhanteCliente] = await Promise.all([
    prisma.atendimento.count({ where: { status: "AGUARDANDO" } }),
    acompanhanteNome
      ? acompanhanteTelefone
        ? prisma.cliente.upsert({
            where: { telefone: acompanhanteTelefone },
            update: { nome: acompanhanteNome },
            create: { nome: acompanhanteNome, telefone: acompanhanteTelefone },
          })
        : prisma.cliente.create({ data: { nome: acompanhanteNome, telefone: null } })
      : Promise.resolve(null),
  ]);

  let acompanhantePosicao: number | undefined;
  if (acompanhanteCliente) {
    await prisma.atendimento.create({
      data: {
        clienteId: acompanhanteCliente.id,
        status: "AGUARDANDO",
        barbeiroPreferidoId,
      },
    });

    acompanhantePosicao = await prisma.atendimento.count({ where: { status: "AGUARDANDO" } });
  }

  revalidatePath("/fila");
  return {
    sucesso: true,
    posicao,
    acompanhanteNome: acompanhanteNome || undefined,
    acompanhantePosicao,
  };
}

export async function chamarProximo(barbeiroIdSelecionado?: string) {
  const session = await requireSession(["ADMIN", "BARBEIRO"]);
  if (barbeiroIdSelecionado && session.role !== "ADMIN") return;
  const barbeiroId = barbeiroIdSelecionado ?? session.barbeiroId;
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
  if (!session.barbeiroId) return;
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

  const formaPagamento = String(formData.get("formaPagamento") ?? "");
  if (formaPagamento !== "DINHEIRO" && formaPagamento !== "PIX" && formaPagamento !== "CARTAO") {
    return { erro: "Escolha a forma de pagamento." };
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
      formaPagamento,
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
  revalidatePath("/ranking");
  revalidatePath("/admin/campanhas");
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

export async function pausarDisponibilidadeHoje() {
  const session = await requireSession(["ADMIN", "BARBEIRO"]);
  if (!session.barbeiroId) return;
  await prisma.barbeiro.update({ where: { id: session.barbeiroId }, data: { pausadoEm: new Date() } });
  revalidatePath("/fila");
  revalidatePath("/totem");
}

export async function retomarDisponibilidadeHoje() {
  const session = await requireSession(["ADMIN", "BARBEIRO"]);
  if (!session.barbeiroId) return;
  await prisma.barbeiro.update({ where: { id: session.barbeiroId }, data: { pausadoEm: null } });
  revalidatePath("/fila");
  revalidatePath("/totem");
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
