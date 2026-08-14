export type EntradaPrecificacao = {
  custoCentavos: number;
  taxaCartaoPercentual: number;
  impostoPercentual: number;
  comissaoPercentual: number;
  margemDesejadaPercentual: number;
};

export type ResultadoPrecificacao = {
  precoSugeridoCentavos: number;
  taxaCartaoCentavos: number;
  impostoCentavos: number;
  comissaoCentavos: number;
  margemCentavos: number;
};

// Precificação por margem sobre o preço de venda: cada percentual (taxa, imposto,
// comissão, margem) incide sobre o preço final, não sobre o custo. Por isso o preço
// não é "custo + percentuais", e sim custo dividido pelo que sobra depois de tirar
// todos os percentuais do preço de venda.
export function calcularPrecoSugerido(entrada: EntradaPrecificacao): ResultadoPrecificacao | null {
  const somaPercentual =
    entrada.taxaCartaoPercentual + entrada.impostoPercentual + entrada.comissaoPercentual + entrada.margemDesejadaPercentual;

  if (somaPercentual >= 100) return null;
  if (entrada.custoCentavos < 0) return null;

  const precoSugeridoCentavos = Math.round(entrada.custoCentavos / (1 - somaPercentual / 100));

  return {
    precoSugeridoCentavos,
    taxaCartaoCentavos: Math.round((precoSugeridoCentavos * entrada.taxaCartaoPercentual) / 100),
    impostoCentavos: Math.round((precoSugeridoCentavos * entrada.impostoPercentual) / 100),
    comissaoCentavos: Math.round((precoSugeridoCentavos * entrada.comissaoPercentual) / 100),
    margemCentavos: Math.round((precoSugeridoCentavos * entrada.margemDesejadaPercentual) / 100),
  };
}
