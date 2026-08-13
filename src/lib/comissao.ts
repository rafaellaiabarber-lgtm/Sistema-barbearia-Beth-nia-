export function comissaoServicos(
  servicos: { precoCentavos: number; comissaoPercentual: number | null }[],
  comissaoPadraoBarbeiro: number
) {
  return servicos.reduce(
    (soma, s) => soma + Math.round((s.precoCentavos * (s.comissaoPercentual ?? comissaoPadraoBarbeiro)) / 100),
    0
  );
}

export function comissaoProdutos(vendas: { totalCentavos: number; comissaoPercentual: number | null }[]) {
  return vendas.reduce((soma, v) => soma + Math.round((v.totalCentavos * (v.comissaoPercentual ?? 0)) / 100), 0);
}

export function lucroServicos(
  servicos: { precoCentavos: number; custoCentavos: number; comissaoPercentual: number | null }[],
  comissaoPadraoBarbeiro: number
) {
  return servicos.reduce((soma, s) => {
    const comissaoCentavos = Math.round((s.precoCentavos * (s.comissaoPercentual ?? comissaoPadraoBarbeiro)) / 100);
    return soma + (s.precoCentavos - s.custoCentavos - comissaoCentavos);
  }, 0);
}
