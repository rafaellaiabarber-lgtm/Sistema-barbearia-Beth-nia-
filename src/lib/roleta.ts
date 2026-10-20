export function textoPremioRoleta(oferta: { nome: string; descontoPercentual: number | null }): string {
  // Sempre mostra o nome do prêmio — só o percentual (sem dizer em quê) deixa a roleta e os
  // resultados confusos quando há mais de um prêmio com desconto, porque todos ficam com o
  // mesmo texto ("10% de desconto") e não dá pra saber qual fatia é qual.
  return oferta.descontoPercentual != null ? `${oferta.nome} (${oferta.descontoPercentual}%)` : oferta.nome;
}
