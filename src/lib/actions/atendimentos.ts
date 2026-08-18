"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { normalizarTelefone } from "@/lib/format";

function revalidarRelatorios() {
  revalidatePath("/admin/caixa");
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin/comissoes");
  revalidatePath("/admin/eficiencia");
  revalidatePath("/fila");
}

export type LancarAtendimentoState = { erro?: string; sucesso?: boolean };

export async function lancarAtendimentoManual(
  _prevState: LancarAtendimentoState,
  formData: FormData
): Promise<LancarAtendimentoState> {
  await requireSession(["ADMIN"]);

  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = normalizarTelefone(String(formData.get("telefone") ?? ""));
  const barbeiroId = String(formData.get("barbeiroId") ?? "").trim();
  const servicoIds = formData.getAll("servicoIds").map(String);
  const formaPagamento = String(formData.get("formaPagamento") ?? "");

  if (!nome) return { erro: "Informe o nome do cliente." };
  if (!telefone) return { erro: "Informe o telefone do cliente." };
  if (!barbeiroId) return { erro: "Escolha o barbeiro." };
  if (servicoIds.length === 0) return { erro: "Escolha ao menos um serviço." };
  if (formaPagamento !== "DINHEIRO" && formaPagamento !== "PIX" && formaPagamento !== "CARTAO") {
    return { erro: "Escolha a forma de pagamento." };
  }

  const [barbeiro, servicos] = await Promise.all([
    prisma.barbeiro.findFirst({ where: { id: barbeiroId, ativo: true } }),
    prisma.servico.findMany({ where: { id: { in: servicoIds } } }),
  ]);
  if (!barbeiro) return { erro: "Barbeiro inválido." };
  if (servicos.length === 0) return { erro: "Serviços inválidos." };

  const cliente = await prisma.cliente.upsert({
    where: { telefone },
    update: { nome },
    create: { nome, telefone },
  });

  const precoTotalCentavos = servicos.reduce((soma, s) => soma + s.precoCentavos, 0);
  const agora = new Date();

  await prisma.atendimento.create({
    data: {
      clienteId: cliente.id,
      barbeiroId: barbeiro.id,
      status: "CONCLUIDO",
      criadoEm: agora,
      concluidoEm: agora,
      precoTotalCentavos,
      formaPagamento,
      servicos: {
        create: servicos.map((s) => ({
          servicoId: s.id,
          nomeSnapshot: s.nome,
          precoCentavos: s.precoCentavos,
          custoCentavos: s.custoCentavos,
          comissaoPercentual: s.comissaoPercentual ?? barbeiro.comissaoPercentual,
        })),
      },
    },
  });

  revalidarRelatorios();
  return { sucesso: true };
}

export async function excluirAtendimento(atendimentoId: string) {
  await requireSession(["ADMIN"]);
  await prisma.atendimento.deleteMany({ where: { id: atendimentoId, status: "CONCLUIDO" } });
  revalidarRelatorios();
}

export type EditarHorarioState = { erro?: string; sucesso?: boolean };

export async function editarHorarioAtendimento(
  _prevState: EditarHorarioState,
  formData: FormData
): Promise<EditarHorarioState> {
  await requireSession(["ADMIN"]);

  const atendimentoId = String(formData.get("atendimentoId") ?? "");
  const chamadoEmStr = String(formData.get("chamadoEm") ?? "");
  const concluidoEmStr = String(formData.get("concluidoEm") ?? "");

  const chamadoEm = new Date(chamadoEmStr);
  const concluidoEm = new Date(concluidoEmStr);
  if (!chamadoEmStr || Number.isNaN(chamadoEm.getTime())) return { erro: "Horário de início inválido." };
  if (!concluidoEmStr || Number.isNaN(concluidoEm.getTime())) return { erro: "Horário de término inválido." };
  if (chamadoEm.getTime() > concluidoEm.getTime()) return { erro: "O início não pode ser depois do término." };

  const atualizado = await prisma.atendimento.updateMany({
    where: { id: atendimentoId, status: "CONCLUIDO" },
    data: { chamadoEm, concluidoEm },
  });
  if (atualizado.count === 0) return { erro: "Atendimento não encontrado." };

  revalidarRelatorios();
  return { sucesso: true };
}

export type SugestaoCliente = { nome: string; telefone: string };

export async function buscarClientesPorNome(query: string): Promise<SugestaoCliente[]> {
  await requireSession(["ADMIN"]);
  const termo = query.trim();
  if (termo.length < 2) return [];

  const clientes = await prisma.cliente.findMany({
    where: { nome: { contains: termo, mode: "insensitive" }, telefone: { not: null } },
    orderBy: { nome: "asc" },
    take: 5,
  });
  return clientes.map((c) => ({ nome: c.nome, telefone: c.telefone as string }));
}
