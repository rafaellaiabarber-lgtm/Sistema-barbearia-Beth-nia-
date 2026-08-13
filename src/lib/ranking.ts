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

export type PremiosPeriodo = { premio1Centavos: number | null; premio2Centavos: number | null; premio3Centavos: number | null };

export function premioPorPosicao(posicao: number, premios: PremiosPeriodo): number | null {
  if (posicao === 1) return premios.premio1Centavos;
  if (posicao === 2) return premios.premio2Centavos;
  if (posicao === 3) return premios.premio3Centavos;
  return null;
}
