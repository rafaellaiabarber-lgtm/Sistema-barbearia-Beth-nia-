"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export type JornadaState = { erro?: string; sucesso?: boolean };

const REGEX_HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;

export async function salvarJornada(
  barbeiroId: string,
  _prevState: JornadaState,
  formData: FormData
): Promise<JornadaState> {
  await requireSession(["ADMIN"]);

  const linhas: { diaSemana: number; horaInicio: string; horaFim: string }[] = [];
  for (let dia = 0; dia <= 6; dia++) {
    if (!formData.get(`ativo-${dia}`)) continue;
    const horaInicio = String(formData.get(`inicio-${dia}`) ?? "");
    const horaFim = String(formData.get(`fim-${dia}`) ?? "");
    if (!REGEX_HORA.test(horaInicio) || !REGEX_HORA.test(horaFim)) {
      return { erro: "Informe horários válidos para os dias marcados." };
    }
    if (horaFim <= horaInicio) {
      return { erro: "O horário de fim precisa ser depois do horário de início." };
    }
    linhas.push({ diaSemana: dia, horaInicio, horaFim });
  }

  await prisma.$transaction([
    prisma.jornadaTrabalho.deleteMany({ where: { barbeiroId } }),
    ...linhas.map((l) =>
      prisma.jornadaTrabalho.create({
        data: { barbeiroId, diaSemana: l.diaSemana, horaInicio: l.horaInicio, horaFim: l.horaFim },
      })
    ),
  ]);

  revalidatePath("/admin/barbeiros");
  revalidatePath("/admin/eficiencia");
  return { sucesso: true };
}
