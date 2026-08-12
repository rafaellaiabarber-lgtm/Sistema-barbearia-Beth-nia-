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
