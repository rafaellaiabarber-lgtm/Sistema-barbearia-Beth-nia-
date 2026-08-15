import { NOMES_DIAS_SEMANA } from "./assinaturas";

export type JornadaDia = {
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
  almocoInicio?: string | null;
  almocoFim?: string | null;
};

function minutosDoHorario(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** Minutos de trabalho disponíveis no intervalo [inicio, fim], somando dia a dia conforme a jornada cadastrada (descontando o horário de almoço, quando cadastrado). */
export function minutosDisponiveis(jornadas: JornadaDia[], inicio: Date, fim: Date): number {
  if (inicio >= fim) return 0;
  const porDia = new Map(jornadas.map((j) => [j.diaSemana, j]));

  let totalMin = 0;
  const cursor = new Date(inicio);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= fim) {
    const jornada = porDia.get(cursor.getDay());
    if (jornada) {
      const inicioJanela = new Date(cursor);
      inicioJanela.setHours(0, minutosDoHorario(jornada.horaInicio), 0, 0);
      const fimJanela = new Date(cursor);
      fimJanela.setHours(0, minutosDoHorario(jornada.horaFim), 0, 0);

      const janelaInicio = inicioJanela < inicio ? inicio : inicioJanela;
      const janelaFim = fimJanela > fim ? fim : fimJanela;
      if (janelaFim > janelaInicio) {
        let minutosDia = (janelaFim.getTime() - janelaInicio.getTime()) / 60000;

        if (jornada.almocoInicio && jornada.almocoFim) {
          const almocoInicio = new Date(cursor);
          almocoInicio.setHours(0, minutosDoHorario(jornada.almocoInicio), 0, 0);
          const almocoFim = new Date(cursor);
          almocoFim.setHours(0, minutosDoHorario(jornada.almocoFim), 0, 0);

          const sobreposicaoInicio = almocoInicio < janelaInicio ? janelaInicio : almocoInicio;
          const sobreposicaoFim = almocoFim > janelaFim ? janelaFim : almocoFim;
          if (sobreposicaoFim > sobreposicaoInicio) {
            minutosDia -= (sobreposicaoFim.getTime() - sobreposicaoInicio.getTime()) / 60000;
          }
        }

        totalMin += minutosDia;
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return totalMin;
}

/** Formata a jornada agrupando dias consecutivos com o mesmo horário (e almoço). Ex: "Seg–Sex 09:00–18:00 (almoço 12:00–13:00), Sáb 09:00–14:00". */
export function formatarJornada(jornadas: JornadaDia[]): string {
  if (jornadas.length === 0) return "sem horário cadastrado";

  const ordem = [1, 2, 3, 4, 5, 6, 0]; // Seg..Dom
  const porDia = new Map(jornadas.map((j) => [j.diaSemana, j]));

  const grupos: {
    dias: number[];
    horaInicio: string;
    horaFim: string;
    almocoInicio: string | null;
    almocoFim: string | null;
  }[] = [];
  for (const dia of ordem) {
    const jornada = porDia.get(dia);
    if (!jornada) continue;
    const almocoInicio = jornada.almocoInicio ?? null;
    const almocoFim = jornada.almocoFim ?? null;
    const ultimo = grupos[grupos.length - 1];
    if (
      ultimo &&
      ultimo.horaInicio === jornada.horaInicio &&
      ultimo.horaFim === jornada.horaFim &&
      ultimo.almocoInicio === almocoInicio &&
      ultimo.almocoFim === almocoFim
    ) {
      ultimo.dias.push(dia);
    } else {
      grupos.push({ dias: [dia], horaInicio: jornada.horaInicio, horaFim: jornada.horaFim, almocoInicio, almocoFim });
    }
  }

  return grupos
    .map((g) => {
      const nomes =
        g.dias.length > 1
          ? `${NOMES_DIAS_SEMANA[g.dias[0]]}–${NOMES_DIAS_SEMANA[g.dias[g.dias.length - 1]]}`
          : NOMES_DIAS_SEMANA[g.dias[0]];
      const almoco = g.almocoInicio && g.almocoFim ? ` (almoço ${g.almocoInicio}–${g.almocoFim})` : "";
      return `${nomes} ${g.horaInicio}–${g.horaFim}${almoco}`;
    })
    .join(", ");
}
