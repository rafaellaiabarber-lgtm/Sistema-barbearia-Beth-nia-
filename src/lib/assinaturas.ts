function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function competenciaAtual(agora: Date = new Date()): string {
  return `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}`;
}

export function competenciaAnterior(agora: Date = new Date()): string {
  const d = new Date(agora);
  d.setMonth(d.getMonth() - 1);
  return competenciaAtual(d);
}

export function formatarCompetencia(competencia: string): string {
  const [ano, mes] = competencia.split("-");
  const nomes = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  const idx = Number(mes) - 1;
  return `${nomes[idx] ?? mes}/${ano}`;
}

export function estaInadimplente(diaVencimento: number, pagouCompetenciaAtual: boolean, agora: Date = new Date()): boolean {
  if (pagouCompetenciaAtual) return false;
  return agora.getDate() > diaVencimento;
}

export const NOMES_DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function diaCobertoHoje(diasSemana: number[], agora: Date = new Date()): boolean {
  return diasSemana.length === 0 || diasSemana.includes(agora.getDay());
}

export function formatarDiasSemana(diasSemana: number[]): string {
  if (diasSemana.length === 0 || diasSemana.length === 7) return "todos os dias";
  return [...diasSemana].sort((a, b) => a - b).map((d) => NOMES_DIAS_SEMANA[d]).join(", ");
}

/** Link do plano pra QR Code: usa o link externo cadastrado (ex.: de outro banco/app), se houver,
 * senão cai na página interna de autocadastro do plano. */
export function linkPlano(plano: { id: string; linkExterno: string | null }, baseUrl: string): string {
  return plano.linkExterno?.trim() || `${baseUrl}/assinar/${plano.id}`;
}
