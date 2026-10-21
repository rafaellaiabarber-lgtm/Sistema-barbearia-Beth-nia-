import type { JornadaDia } from "./jornada";

// Passo entre um horário disponível e o próximo (independe da duração do serviço — um serviço
// de 45min ainda ocupa só os 45min dele a partir do horário escolhido, não "arredonda" pra 60).
const GRANULARIDADE_MINUTOS = 15;

function minutosDoHorario(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + (m || 0);
}

function horarioNoDia(data: Date, hora: string): Date {
  const resultado = new Date(data);
  resultado.setHours(0, minutosDoHorario(hora), 0, 0);
  return resultado;
}

/**
 * Lista os horários de início disponíveis num dia, pra um barbeiro com uma jornada e um serviço
 * de uma certa duração, descontando almoço e horários já ocupados por outros agendamentos.
 */
export function slotsDisponiveisNoDia({
  jornadaDoDia,
  duracaoMinutos,
  ocupados,
  data,
  agora,
}: {
  jornadaDoDia: JornadaDia | undefined;
  duracaoMinutos: number;
  ocupados: { inicio: Date; fim: Date }[];
  data: Date;
  agora: Date;
}): Date[] {
  if (!jornadaDoDia || duracaoMinutos <= 0) return [];

  const inicioJornada = horarioNoDia(data, jornadaDoDia.horaInicio);
  const fimJornada = horarioNoDia(data, jornadaDoDia.horaFim);
  const almocoInicio = jornadaDoDia.almocoInicio ? horarioNoDia(data, jornadaDoDia.almocoInicio) : null;
  const almocoFim = jornadaDoDia.almocoFim ? horarioNoDia(data, jornadaDoDia.almocoFim) : null;

  const slots: Date[] = [];
  const cursor = new Date(inicioJornada);
  const duracaoMs = duracaoMinutos * 60000;

  while (cursor.getTime() + duracaoMs <= fimJornada.getTime()) {
    const fimSlot = new Date(cursor.getTime() + duracaoMs);

    const jaPassou = cursor < agora;
    const bateComAlmoco = !!almocoInicio && !!almocoFim && cursor < almocoFim && fimSlot > almocoInicio;
    const bateComOcupado = ocupados.some((o) => cursor < o.fim && fimSlot > o.inicio);

    if (!jaPassou && !bateComAlmoco && !bateComOcupado) {
      slots.push(new Date(cursor));
    }
    cursor.setMinutes(cursor.getMinutes() + GRANULARIDADE_MINUTOS);
  }

  return slots;
}
