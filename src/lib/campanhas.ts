export type ItemProgresso = {
  itemId: string;
  nome: string;
  quantidadeAlvo: number;
  quantidadeAtual: number;
  precoCentavos: number;
  comissaoPercentual: number;
};

export function itemCompleto(item: ItemProgresso): boolean {
  return item.quantidadeAtual >= item.quantidadeAlvo;
}

export function campanhaCompleta(itens: ItemProgresso[]): boolean {
  return itens.length > 0 && itens.every(itemCompleto);
}

export function quantidadeFaltando(item: ItemProgresso): number {
  return Math.max(item.quantidadeAlvo - item.quantidadeAtual, 0);
}

export function valorPotencialCentavos(itens: ItemProgresso[]): number {
  return itens.reduce(
    (soma, item) => soma + Math.round((quantidadeFaltando(item) * item.precoCentavos * item.comissaoPercentual) / 100),
    0
  );
}
