export type Periodo = "hoje" | "semana" | "mes" | "personalizado";

export type IntervaloPersonalizado = { dataInicio?: string; dataFim?: string };

export function calcularIntervalo(
  periodo: Periodo,
  agora: Date = new Date(),
  personalizado?: IntervaloPersonalizado
) {
  if (periodo === "personalizado" && personalizado?.dataInicio) {
    const inicio = new Date(`${personalizado.dataInicio}T00:00:00`);
    const fim = personalizado.dataFim ? new Date(`${personalizado.dataFim}T23:59:59.999`) : agora;
    return { inicio, fim };
  }

  const inicio = new Date(agora);
  inicio.setHours(0, 0, 0, 0);

  if (periodo === "semana") {
    const diaSemana = inicio.getDay();
    inicio.setDate(inicio.getDate() - diaSemana);
  } else if (periodo === "mes") {
    inicio.setDate(1);
  }

  return { inicio, fim: agora };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function chavePeriodo(periodo: "hoje" | "semana" | "mes", agora: Date = new Date()): string {
  const { inicio } = calcularIntervalo(periodo, agora);
  return `${inicio.getFullYear()}-${pad(inicio.getMonth() + 1)}-${pad(inicio.getDate())}`;
}
