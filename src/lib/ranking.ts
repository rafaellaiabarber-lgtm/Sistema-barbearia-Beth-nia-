export type PontosPorAcao = {
  pontosPorAtendimento: number;
  pontosPorVendaProduto: number;
  pontosPorAssinatura: number;
  pontosPorIndicacaoConvertida: number;
};

export type ContagemBarbeiro = {
  barbeiroId: string;
  nome: string;
  qtdAtendimentos: number;
  qtdVendasProduto: number;
  qtdAssinaturas: number;
  qtdIndicacoesConvertidas: number;
};

export type PosicaoRanking = ContagemBarbeiro & { pontos: number; posicao: number };

export function calcularPontos(contagem: ContagemBarbeiro, pontos: PontosPorAcao): number {
  return (
    contagem.qtdAtendimentos * pontos.pontosPorAtendimento +
    contagem.qtdVendasProduto * pontos.pontosPorVendaProduto +
    contagem.qtdAssinaturas * pontos.pontosPorAssinatura +
    contagem.qtdIndicacoesConvertidas * pontos.pontosPorIndicacaoConvertida
  );
}

export function montarRanking(contagens: ContagemBarbeiro[], pontos: PontosPorAcao): PosicaoRanking[] {
  return contagens
    .map((c) => ({ ...c, pontos: calcularPontos(c, pontos) }))
    .sort((a, b) => b.pontos - a.pontos)
    .map((c, i) => ({ ...c, posicao: i + 1 }));
}

export type PremiosPeriodo = { premio1: string | null; premio2: string | null; premio3: string | null };

export function premioPorPosicao(
  posicao: number,
  pontos: number,
  premios: PremiosPeriodo,
  pontuacaoMinima: number | null
): string | null {
  if (pontuacaoMinima !== null && pontos < pontuacaoMinima) return null;
  if (posicao === 1) return premios.premio1;
  if (posicao === 2) return premios.premio2;
  if (posicao === 3) return premios.premio3;
  return null;
}
