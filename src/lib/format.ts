export function formatarReais(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function reaisParaCentavos(valor: string) {
  const normalizado = valor.replace(/\./g, "").replace(",", ".");
  const numero = Number.parseFloat(normalizado);
  if (Number.isNaN(numero)) return 0;
  return Math.round(numero * 100);
}

export function paraCampoDataHora(data: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}T${pad(data.getHours())}:${pad(data.getMinutes())}`;
}

export const LABEL_FORMA_PAGAMENTO: Record<string, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "Pix",
  CARTAO: "Cartão",
};

export const LABEL_CATEGORIA_DESPESA: Record<string, string> = {
  FIXA: "Despesa fixa",
  VARIAVEL: "Despesa variável",
  TAXA_CARTAO: "Taxa de cartão",
  PRO_LABORE: "Pró-labore",
  IMPOSTO: "Imposto",
  OUTRA: "Outra",
};

export const LABEL_PERIODICIDADE_FEEDBACK: Record<string, string> = {
  SEMANAL: "Semanal",
  MENSAL: "Mensal",
  AVULSO: "Avulsa",
};

// Percentuais são guardados como "percentual × 100" (ex.: 349 = 3,49%) para suportar casas decimais.
export function percentualX100ParaValor(percentualX100: number) {
  return (percentualX100 / 100).toFixed(2).replace(".", ",");
}

export function valorParaPercentualX100(valor: string) {
  const normalizado = valor.replace(/\./g, "").replace(",", ".");
  const numero = Number.parseFloat(normalizado);
  if (Number.isNaN(numero)) return 0;
  return Math.round(numero * 100);
}

export function normalizarTelefone(telefone: string) {
  return telefone.replace(/\D/g, "");
}

export function formatarTelefone(telefone: string) {
  const digitos = telefone.replace(/\D/g, "");
  if (digitos.length === 11) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  if (digitos.length === 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  return telefone;
}

export function linkWhatsApp(telefone: string) {
  const digitos = telefone.replace(/\D/g, "");
  const comDdi = digitos.startsWith("55") ? digitos : `55${digitos}`;
  return `https://wa.me/${comDdi}`;
}
