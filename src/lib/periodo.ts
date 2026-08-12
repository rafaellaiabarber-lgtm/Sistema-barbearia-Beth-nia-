export type Periodo = "hoje" | "semana" | "mes";

export function calcularIntervalo(periodo: Periodo, agora: Date = new Date()) {
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

export function chavePeriodo(periodo: Periodo, agora: Date = new Date()): string {
  const { inicio } = calcularIntervalo(periodo, agora);
  return `${inicio.getFullYear()}-${pad(inicio.getMonth() + 1)}-${pad(inicio.getDate())}`;
}
