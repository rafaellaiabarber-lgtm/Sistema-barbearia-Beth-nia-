export function comissaoServicos(
  servicos: { precoCentavos: number; comissaoPercentual: number | null }[],
  comissaoPadraoBarbeiro: number
) {
  return servicos.reduce(
    (soma, s) => soma + Math.round((s.precoCentavos * (s.comissaoPercentual ?? comissaoPadraoBarbeiro)) / 100),
    0
  );
}
