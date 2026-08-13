export type ItemProgresso = {
  itemId: string;
  nome: string;
  quantidadeAlvo: number;
  quantidadeAtual: number;
};

export function itemCompleto(item: ItemProgresso): boolean {
  return item.quantidadeAtual >= item.quantidadeAlvo;
}

export function campanhaCompleta(itens: ItemProgresso[]): boolean {
  return itens.length > 0 && itens.every(itemCompleto);
}
