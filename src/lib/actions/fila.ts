"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { setCurrentBarbearia } from "@/lib/tenant-context";
import { normalizarTelefone } from "@/lib/format";
import { diaCobertoHoje, formatarDiasSemana } from "@/lib/assinaturas";

export async function buscarNomePorTelefone(telefone: string): Promise<string | null> {
  if (!telefone) return null;
  const session = await requireSession(["ADMIN"]);
  const cliente = await prisma.cliente.findFirst({
    where: { telefone: normalizarTelefone(telefone), barbeariaId: session.barbeariaId },
  });
  return cliente?.nome ?? null;
}

export type ClienteInfo = {
  nome: string | null;
  planoAtivo: string | null;
  planoCobertoHoje: boolean;
  planoDiasTexto: string | null;
};

export async function buscarClienteInfoPorTelefone(telefone: string, barbeariaId: string): Promise<ClienteInfo> {
  if (!telefone) return { nome: null, planoAtivo: null, planoCobertoHoje: true, planoDiasTexto: null };
  const cliente = await prisma.cliente.findFirst({
    where: { telefone: normalizarTelefone(telefone), barbeariaId },
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
  const barbeariaSlug = String(formData.get("barbeariaSlug") ?? "").trim();

  if (!telefone) return { erro: "Informe seu telefone." };
  if (!nome) return { erro: "Informe seu nome." };

  const barbearia = barbeariaSlug ? await prisma.barbearia.findUnique({ where: { slug: barbeariaSlug } }) : null;
  if (!barbearia || !barbearia.ativa) return { erro: "Barbearia não encontrada." };
  setCurrentBarbearia(barbearia.id);

  const [barbeiro, cliente] = await Promise.all([
    barbeiroPreferidoId
      ? prisma.barbeiro.findFirst({ where: { id: barbeiroPreferidoId, ativo: true, barbeariaId: barbearia.id } })
      : Promise.resolve(null),
    prisma.cliente.upsert({
      where: { barbeariaId_telefone: { barbeariaId: barbearia.id, telefone } },
      update: { nome },
      create: { barbeariaId: barbearia.id, nome, telefone },
    }),
  ]);
  if (barbeiroPreferidoId && !barbeiro) return { erro: "Barbeiro inválido." };

  await prisma.atendimento.create({
    data: {
      barbeariaId: barbearia.id,
      clienteId: cliente.id,
      status: "AGUARDANDO",
      barbeiroPreferidoId,
    },
  });

  const [posicao, acompanhanteCliente] = await Promise.all([
    prisma.atendimento.count({ where: { status: "AGUARDANDO", barbeariaId: barbearia.id } }),
    acompanhanteNome
      ? acompanhanteTelefone
        ? prisma.cliente.upsert({
            where: { barbeariaId_telefone: { barbeariaId: barbearia.id, telefone: acompanhanteTelefone } },
            update: { nome: acompanhanteNome },
            create: { barbeariaId: barbearia.id, nome: acompanhanteNome, telefone: acompanhanteTelefone },
          })
        : prisma.cliente.create({ data: { barbeariaId: barbearia.id, nome: acompanhanteNome, telefone: null } })
      : Promise.resolve(null),
  ]);

  let acompanhantePosicao: number | undefined;
  if (acompanhanteCliente) {
    await prisma.atendimento.create({
      data: {
        barbeariaId: barbearia.id,
        clienteId: acompanhanteCliente.id,
        status: "AGUARDANDO",
        barbeiroPreferidoId,
      },
    });

    acompanhantePosicao = await prisma.atendimento.count({
      where: { status: "AGUARDANDO", barbeariaId: barbearia.id },
    });
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
    where: { barbeiroId, status: "EM_ATENDIMENTO", barbeariaId: session.barbeariaId },
  });
  if (emAndamento) return;

  const proximo = await prisma.atendimento.findFirst({
    where: { status: "AGUARDANDO", barbeariaId: session.barbeariaId },
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
    where: { barbeiroId, status: "EM_ATENDIMENTO", barbeariaId: session.barbeariaId },
  });
  if (emAndamento) return;

  const atendimento = await prisma.atendimento.findFirst({
    where: { id: atendimentoId, status: "AGUARDANDO", barbeariaId: session.barbeariaId },
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
  const session = await requireSession(["ADMIN", "BARBEIRO"]);

  const servicoIds = formData.getAll("servicoIds").map(String);
  if (servicoIds.length === 0) {
    return { erro: "Escolha ao menos um serviço realizado." };
  }

  const cobertoPorAssinatura = formData.get("cobertoPorAssinatura") === "on";

  const produtoIds = formData.getAll("produtoIds").map(String);
  const produtoQuantidades = formData.getAll("produtoQuantidades").map(String);
  const itensProduto = produtoIds
    .map((id, i) => ({ id, quantidade: Number.parseInt(produtoQuantidades[i] ?? "0", 10) }))
    .filter((item) => item.quantidade > 0);

  const precisaFormaPagamento = !cobertoPorAssinatura || itensProduto.length > 0;
  const formaPagamentoRaw = String(formData.get("formaPagamento") ?? "");
  if (precisaFormaPagamento && formaPagamentoRaw !== "DINHEIRO" && formaPagamentoRaw !== "PIX" && formaPagamentoRaw !== "CARTAO") {
    return { erro: "Escolha a forma de pagamento." };
  }
  const formaPagamento = precisaFormaPagamento
    ? (formaPagamentoRaw as "DINHEIRO" | "PIX" | "CARTAO")
    : null;

  const [servicos, atendimento, produtos] = await Promise.all([
    prisma.servico.findMany({ where: { id: { in: servicoIds }, barbeariaId: session.barbeariaId } }),
    prisma.atendimento.findFirst({
      where: { id: atendimentoId, barbeariaId: session.barbeariaId },
      include: { barbeiro: true },
    }),
    itensProduto.length > 0
      ? prisma.produto.findMany({
          where: { id: { in: itensProduto.map((i) => i.id) }, ativo: true, barbeariaId: session.barbeariaId },
        })
      : Promise.resolve([]),
  ]);
  if (servicos.length === 0) return { erro: "Serviços inválidos." };

  const comissaoPadrao = atendimento?.barbeiro?.comissaoPercentual ?? 0;
  const precoTotalCentavos = cobertoPorAssinatura ? 0 : servicos.reduce((soma, s) => soma + s.precoCentavos, 0);
  const barbeiroId = atendimento?.barbeiroId ?? null;
  const barbeiroNome = atendimento?.barbeiro?.nome ?? "barbeiro";
  const produtosPorId = new Map(produtos.map((p) => [p.id, p]));

  await prisma.$transaction(async (tx) => {
    await tx.atendimento.update({
      where: { id: atendimentoId },
      data: {
        status: "CONCLUIDO",
        concluidoEm: new Date(),
        precoTotalCentavos,
        formaPagamento,
        cobertoPorAssinatura,
        servicos: {
          create: servicos.map((s) => ({
            barbeariaId: session.barbeariaId,
            servicoId: s.id,
            nomeSnapshot: s.nome,
            precoCentavos: cobertoPorAssinatura ? 0 : s.precoCentavos,
            precoComissaoCentavos: s.precoCentavos,
            custoCentavos: s.custoCentavos,
            comissaoPercentual: s.comissaoPercentual ?? comissaoPadrao,
            fichas: s.fichas,
          })),
        },
      },
    });

    for (const item of itensProduto) {
      const produto = produtosPorId.get(item.id);
      if (!produto) continue;
      const totalCentavos = produto.precoCentavos * item.quantidade;
      await tx.vendaProduto.create({
        data: {
          barbeariaId: session.barbeariaId,
          produtoId: produto.id,
          barbeiroId,
          quantidade: item.quantidade,
          precoUnitarioCentavos: produto.precoCentavos,
          totalCentavos,
          comissaoPercentual: produto.comissaoPercentual,
          formaPagamento,
        },
      });
      await tx.movimentoCaixa.create({
        data: {
          barbeariaId: session.barbeariaId,
          tipo: "ENTRADA",
          descricao: `Venda de produto — ${produto.nome} x${item.quantidade} (${barbeiroNome})`,
          valorCentavos: totalCentavos,
          formaPagamento,
        },
      });
    }
  });

  revalidatePath("/fila");
  revalidatePath("/admin/financeiro");
  revalidatePath("/ranking");
  revalidatePath("/admin/campanhas");
  revalidatePath("/admin/caixa");
  revalidatePath("/admin/comissoes");
  revalidatePath("/admin/metas");
  revalidatePath("/admin/fluxo-caixa");
  revalidatePath("/admin/dre");
  return {};
}

export async function cancelarAtendimento(atendimentoId: string) {
  const session = await requireSession(["ADMIN", "BARBEIRO"]);
  await prisma.atendimento.updateMany({
    where: { id: atendimentoId, barbeariaId: session.barbeariaId },
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
    where: { id: atendimentoId, status: "EM_ATENDIMENTO", barbeariaId: session.barbeariaId },
  });
  if (!atendimento) return;
  if (session.role === "BARBEIRO" && atendimento.barbeiroId !== session.barbeiroId) return;

  await prisma.atendimento.update({
    where: { id: atendimentoId },
    data: { status: "AGUARDANDO", barbeiroId: null, chamadoEm: null },
  });
  revalidatePath("/fila");
}
