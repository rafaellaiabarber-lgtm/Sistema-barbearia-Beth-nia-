export function textoPremioRoleta(oferta: { nome: string; descontoPercentual: number | null }): string {
  return oferta.descontoPercentual != null ? `${oferta.descontoPercentual}% de desconto` : oferta.nome;
}
