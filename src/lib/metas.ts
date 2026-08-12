import { formatarReais } from "@/lib/format";

export const LABEL_TIPO_META: Record<string, string> = {
  FATURAMENTO: "Faturamento",
  ATENDIMENTOS: "Nº de atendimentos",
  TICKET_MEDIO: "Ticket médio",
  CLIENTES_NOVOS: "Clientes novos",
};

export const TIPOS_META_EM_CENTAVOS = new Set(["FATURAMENTO", "TICKET_MEDIO"]);

export function formatarValorMeta(tipo: string, valor: number) {
  if (TIPOS_META_EM_CENTAVOS.has(tipo)) return formatarReais(valor);
  return String(valor);
}

// Versão sem o prefixo "R$", pra pré-preencher inputs editáveis (que passam pelo
// mesmo parser usado no cadastro, `reaisParaCentavos`, que não entende "R$").
export function valorEditavelMeta(tipo: string, valor: number) {
  if (TIPOS_META_EM_CENTAVOS.has(tipo)) return (valor / 100).toFixed(2).replace(".", ",");
  return String(valor);
}

export type ProgressoBarbeiro = {
  faturamentoCentavos: number;
  qtdAtendimentos: number;
  clientesNovos: number;
};

export function valorAtualPorTipo(tipo: string, progresso: ProgressoBarbeiro): number {
  switch (tipo) {
    case "FATURAMENTO":
      return progresso.faturamentoCentavos;
    case "ATENDIMENTOS":
      return progresso.qtdAtendimentos;
    case "TICKET_MEDIO":
      return progresso.qtdAtendimentos > 0
        ? Math.round(progresso.faturamentoCentavos / progresso.qtdAtendimentos)
        : 0;
    case "CLIENTES_NOVOS":
      return progresso.clientesNovos;
    default:
      return 0;
  }
}

export type NivelComProgresso = {
  ordem: number;
  nome: string;
  valorAlvo: number;
  bonificacaoCentavos: number;
  atingido: boolean;
};

export function calcularNiveisAtingidos<T extends { ordem: number; valorAlvo: number }>(
  niveis: T[],
  valorAtual: number
): (T & { atingido: boolean })[] {
  return [...niveis]
    .sort((a, b) => a.ordem - b.ordem)
    .map((n) => ({ ...n, atingido: valorAtual >= n.valorAlvo }));
}

export function nivelAtual<T extends { atingido: boolean }>(niveis: T[]): T | null {
  const atingidos = niveis.filter((n) => n.atingido);
  return atingidos.length > 0 ? atingidos[atingidos.length - 1] : null;
}

export function proximoNivel<T extends { atingido: boolean }>(niveis: T[]): T | null {
  return niveis.find((n) => !n.atingido) ?? null;
}
