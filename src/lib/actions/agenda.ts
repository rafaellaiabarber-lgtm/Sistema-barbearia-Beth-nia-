"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { setCurrentBarbearia } from "@/lib/tenant-context";
import { barbeariaEstaAtiva } from "@/lib/barbearia-status";
import { normalizarTelefone } from "@/lib/format";
import { slotsDisponiveisNoDia } from "@/lib/agenda";
import type { JornadaDia } from "@/lib/jornada";

function parseDataLocal(dataISO: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataISO)) return null;
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date();
  data.setFullYear(ano, mes - 1, dia);
  data.setHours(0, 0, 0, 0);
  return data;
}

export type SlotsState = {
  erro?: string;
  slots?: string[]; // ISO strings
  duracaoMinutos?: number;
};

export async function buscarSlotsDisponiveis(
  barbeariaSlug: string,
  barbeiroId: string,
  servicoId: string,
  dataISO: string
): Promise<SlotsState> {
  const barbearia = await prisma.barbearia.findUnique({ where: { slug: barbeariaSlug } });
  if (!barbearia || !(await barbeariaEstaAtiva(barbearia))) return { erro: "Barbearia não encontrada." };
  setCurrentBarbearia(barbearia.id);

  const data = parseDataLocal(dataISO);
  if (!data) return { erro: "Data inválida." };

  const [barbeiro, servico] = await Promise.all([
    prisma.barbeiro.findFirst({
      where: { id: barbeiroId, ativo: true, barbeariaId: barbearia.id },
      include: { jornadas: true },
    }),
    prisma.servico.findFirst({ where: { id: servicoId, ativo: true, barbeariaId: barbearia.id } }),
  ]);
  if (!barbeiro) return { erro: "Barbeiro inválido." };
  if (!servico) return { erro: "Serviço inválido." };

  const fimDoDia = new Date(data);
  fimDoDia.setHours(23, 59, 59, 999);

  const agendamentosNoDia = await prisma.atendimento.findMany({
    where: {
      barbeariaId: barbearia.id,
      barbeiroId: barbeiro.id,
      horarioAgendado: { gte: data, lte: fimDoDia },
      status: { in: ["AGUARDANDO", "EM_ATENDIMENTO"] },
    },
    include: { servicoAgendado: true },
  });

  const ocupados = agendamentosNoDia
    .filter((a) => a.horarioAgendado)
    .map((a) => {
      const duracao = a.servicoAgendado?.duracaoMinutos ?? 30;
      const inicio = a.horarioAgendado!;
      const fim = new Date(inicio.getTime() + duracao * 60000);
      return { inicio, fim };
    });

  const bloqueiosNoDia = await prisma.bloqueioAgenda.findMany({
    where: { barbeariaId: barbearia.id, barbeiroId: barbeiro.id, inicio: { lte: fimDoDia }, fim: { gte: data } },
  });
  for (const b of bloqueiosNoDia) ocupados.push({ inicio: b.inicio, fim: b.fim });

  const jornadaDoDia: JornadaDia | undefined = barbeiro.jornadas.find((j) => j.diaSemana === data.getDay());

  const slots = slotsDisponiveisNoDia({
    jornadaDoDia,
    duracaoMinutos: servico.duracaoMinutos,
    ocupados,
    data,
    agora: new Date(),
  });

  return { slots: slots.map((s) => s.toISOString()), duracaoMinutos: servico.duracaoMinutos };
}

export type AgendarState = { erro?: string; sucesso?: boolean };

export async function criarAgendamento(_prevState: AgendarState, formData: FormData): Promise<AgendarState> {
  const barbeariaSlug = String(formData.get("barbeariaSlug") ?? "").trim();
  const barbeiroId = String(formData.get("barbeiroId") ?? "").trim();
  const servicoId = String(formData.get("servicoId") ?? "").trim();
  const horarioIso = String(formData.get("horario") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = normalizarTelefone(String(formData.get("telefone") ?? ""));

  if (!nome) return { erro: "Informe seu nome." };
  if (!telefone) return { erro: "Informe seu telefone." };
  if (!horarioIso) return { erro: "Escolha um horário." };
  const horario = new Date(horarioIso);
  if (Number.isNaN(horario.getTime())) return { erro: "Horário inválido." };
  if (horario.getTime() < Date.now() - 60000) return { erro: "Esse horário já passou — escolha outro." };

  const barbearia = await prisma.barbearia.findUnique({ where: { slug: barbeariaSlug } });
  if (!barbearia || !(await barbeariaEstaAtiva(barbearia))) return { erro: "Barbearia não encontrada." };
  setCurrentBarbearia(barbearia.id);

  const [barbeiro, servico, cliente] = await Promise.all([
    prisma.barbeiro.findFirst({ where: { id: barbeiroId, ativo: true, barbeariaId: barbearia.id }, include: { jornadas: true } }),
    prisma.servico.findFirst({ where: { id: servicoId, ativo: true, barbeariaId: barbearia.id } }),
    prisma.cliente.upsert({
      where: { barbeariaId_telefone: { barbeariaId: barbearia.id, telefone } },
      update: { nome },
      create: { barbeariaId: barbearia.id, nome, telefone },
    }),
  ]);
  if (!barbeiro) return { erro: "Barbeiro inválido." };
  if (!servico) return { erro: "Serviço inválido." };

  // Reconfirma a disponibilidade no momento de salvar — outra pessoa pode ter marcado
  // esse mesmo horário entre o cliente ver a lista e confirmar.
  const inicioDoDia = new Date(horario);
  inicioDoDia.setHours(0, 0, 0, 0);
  const fimDoDia = new Date(horario);
  fimDoDia.setHours(23, 59, 59, 999);
  const agendamentosNoDia = await prisma.atendimento.findMany({
    where: {
      barbeariaId: barbearia.id,
      barbeiroId: barbeiro.id,
      horarioAgendado: { gte: inicioDoDia, lte: fimDoDia },
      status: { in: ["AGUARDANDO", "EM_ATENDIMENTO"] },
    },
    include: { servicoAgendado: true },
  });
  const ocupados = agendamentosNoDia
    .filter((a) => a.horarioAgendado)
    .map((a) => {
      const duracao = a.servicoAgendado?.duracaoMinutos ?? 30;
      const inicio = a.horarioAgendado!;
      return { inicio, fim: new Date(inicio.getTime() + duracao * 60000) };
    });
  const bloqueiosNoDia = await prisma.bloqueioAgenda.findMany({
    where: { barbeariaId: barbearia.id, barbeiroId: barbeiro.id, inicio: { lte: fimDoDia }, fim: { gte: inicioDoDia } },
  });
  for (const b of bloqueiosNoDia) ocupados.push({ inicio: b.inicio, fim: b.fim });

  const jornadaDoDia: JornadaDia | undefined = barbeiro.jornadas.find((j) => j.diaSemana === horario.getDay());
  const slotsValidos = slotsDisponiveisNoDia({
    jornadaDoDia,
    duracaoMinutos: servico.duracaoMinutos,
    ocupados,
    data: inicioDoDia,
    agora: new Date(),
  });
  const continuaDisponivel = slotsValidos.some((s) => s.getTime() === horario.getTime());
  if (!continuaDisponivel) {
    return { erro: "Esse horário acabou de ser ocupado — escolha outro, por favor." };
  }

  await prisma.atendimento.create({
    data: {
      barbeariaId: barbearia.id,
      clienteId: cliente.id,
      barbeiroId: barbeiro.id,
      servicoAgendadoId: servico.id,
      horarioAgendado: horario,
      status: "AGUARDANDO",
    },
  });

  revalidatePath("/admin/agenda");
  return { sucesso: true };
}

export async function iniciarAgendamento(atendimentoId: string) {
  const session = await requireSession(["ADMIN"]);

  const atendimento = await prisma.atendimento.findFirst({
    where: { id: atendimentoId, barbeariaId: session.barbeariaId, status: "AGUARDANDO", horarioAgendado: { not: null } },
  });
  if (!atendimento || !atendimento.barbeiroId) return;

  const emAndamento = await prisma.atendimento.findFirst({
    where: { barbeiroId: atendimento.barbeiroId, status: "EM_ATENDIMENTO", barbeariaId: session.barbeariaId },
  });
  if (emAndamento) return;

  await prisma.atendimento.update({
    where: { id: atendimentoId },
    data: { status: "EM_ATENDIMENTO", chamadoEm: new Date() },
  });

  revalidatePath("/admin/agenda");
  revalidatePath("/fila");
}

export type BloqueioState = { erro?: string; sucesso?: boolean };

export async function criarBloqueioAgenda(_prevState: BloqueioState, formData: FormData): Promise<BloqueioState> {
  const session = await requireSession(["ADMIN", "BARBEIRO"]);

  const barbeiroIdForm = String(formData.get("barbeiroId") ?? "").trim();
  const barbeiroId = session.role === "BARBEIRO" ? session.barbeiroId : barbeiroIdForm || session.barbeiroId;
  if (!barbeiroId) return { erro: "Escolha o barbeiro." };
  if (session.role === "BARBEIRO" && barbeiroId !== session.barbeiroId) {
    return { erro: "Você só pode bloquear a sua própria agenda." };
  }

  const data = String(formData.get("data") ?? "").trim();
  const diaTodo = formData.get("diaTodo") === "on";
  const horaInicio = String(formData.get("horaInicio") ?? "").trim();
  const horaFim = String(formData.get("horaFim") ?? "").trim();
  const motivo = String(formData.get("motivo") ?? "").trim() || null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return { erro: "Escolha uma data." };
  if (!diaTodo && (!horaInicio || !horaFim)) {
    return { erro: "Informe o horário de início e fim, ou marque \"dia todo\"." };
  }

  const inicio = new Date(`${data}T${diaTodo ? "00:00" : horaInicio}:00`);
  const fim = new Date(`${data}T${diaTodo ? "23:59" : horaFim}:59`);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) return { erro: "Horário inválido." };
  if (fim <= inicio) return { erro: "O horário de fim precisa ser depois do início." };

  const barbeiro = await prisma.barbeiro.findFirst({ where: { id: barbeiroId, barbeariaId: session.barbeariaId } });
  if (!barbeiro) return { erro: "Barbeiro inválido." };

  await prisma.bloqueioAgenda.create({
    data: { barbeariaId: session.barbeariaId, barbeiroId, inicio, fim, motivo },
  });

  revalidatePath("/meus-horarios-bloqueados");
  revalidatePath("/admin/agenda-configuracoes");
  return { sucesso: true };
}

export async function excluirBloqueioAgenda(id: string) {
  const session = await requireSession(["ADMIN", "BARBEIRO"]);

  await prisma.bloqueioAgenda.deleteMany({
    where: {
      id,
      barbeariaId: session.barbeariaId,
      ...(session.role === "BARBEIRO" && session.barbeiroId ? { barbeiroId: session.barbeiroId } : {}),
    },
  });

  revalidatePath("/meus-horarios-bloqueados");
  revalidatePath("/admin/agenda-configuracoes");
}
