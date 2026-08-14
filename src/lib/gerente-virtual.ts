import { formatarReais } from "@/lib/format";

export type ComparativoMes = {
  faturamentoCentavos: number;
  despesasCentavos: number;
  comissoesCentavos: number;
  clientesNovos: number;
  qtdAtendimentos: number;
};

export function calcularMargem(c: ComparativoMes): number {
  if (c.faturamentoCentavos === 0) return 0;
  const lucro = c.faturamentoCentavos - c.despesasCentavos - c.comissoesCentavos;
  return (lucro / c.faturamentoCentavos) * 100;
}

export function calcularTicketMedio(c: ComparativoMes): number {
  return c.qtdAtendimentos > 0 ? Math.round(c.faturamentoCentavos / c.qtdAtendimentos) : 0;
}

export type Alerta = { tipo: "atencao" | "positivo"; texto: string };

// Thresholds escolhidos pra evitar ruído: só aponta o que é uma mudança
// grande o bastante pra valer a atenção do dono.
export function gerarAlertas(atual: ComparativoMes, anterior: ComparativoMes): Alerta[] {
  const alertas: Alerta[] = [];

  if (anterior.faturamentoCentavos > 0) {
    const margemAtual = calcularMargem(atual);
    const margemAnterior = calcularMargem(anterior);
    if (margemAnterior - margemAtual >= 5) {
      alertas.push({
        tipo: "atencao",
        texto: `Sua margem caiu de ${margemAnterior.toFixed(0)}% para ${margemAtual.toFixed(0)}% em relação ao mês passado.`,
      });
    } else if (margemAtual - margemAnterior >= 5) {
      alertas.push({
        tipo: "positivo",
        texto: `Sua margem subiu de ${margemAnterior.toFixed(0)}% para ${margemAtual.toFixed(0)}% em relação ao mês passado.`,
      });
    }
  }

  if (anterior.clientesNovos > 0) {
    const variacao = ((atual.clientesNovos - anterior.clientesNovos) / anterior.clientesNovos) * 100;
    if (variacao <= -20) {
      alertas.push({
        tipo: "atencao",
        texto: `O número de clientes novos caiu ${Math.abs(variacao).toFixed(0)}% em relação ao mês passado (${anterior.clientesNovos} → ${atual.clientesNovos}).`,
      });
    }
  }

  if (anterior.despesasCentavos > 0 && anterior.faturamentoCentavos > 0) {
    const crescimentoDespesas = ((atual.despesasCentavos - anterior.despesasCentavos) / anterior.despesasCentavos) * 100;
    const crescimentoFaturamento =
      ((atual.faturamentoCentavos - anterior.faturamentoCentavos) / anterior.faturamentoCentavos) * 100;
    if (crescimentoDespesas - crescimentoFaturamento >= 15) {
      alertas.push({
        tipo: "atencao",
        texto: "Suas despesas cresceram mais rápido que o faturamento em relação ao mês passado.",
      });
    }
  }

  if (anterior.faturamentoCentavos > 0) {
    const crescimento =
      ((atual.faturamentoCentavos - anterior.faturamentoCentavos) / anterior.faturamentoCentavos) * 100;
    if (crescimento >= 10) {
      alertas.push({
        tipo: "positivo",
        texto: `Faturamento cresceu ${crescimento.toFixed(0)}% em relação ao mês passado.`,
      });
    } else if (crescimento <= -10) {
      alertas.push({
        tipo: "atencao",
        texto: `Faturamento caiu ${Math.abs(crescimento).toFixed(0)}% em relação ao mês passado.`,
      });
    }
  }

  return alertas;
}

const LIMIAR_ABAIXO_MEDIA = 0.15; // 15% abaixo da média da equipe já vale alerta

export function identificarBarbeirosAbaixoMedia(
  qtdPorBarbeiro: { nome: string; qtd: number }[]
): { nome: string; percentualAbaixo: number }[] {
  if (qtdPorBarbeiro.length < 2) return [];
  const total = qtdPorBarbeiro.reduce((s, b) => s + b.qtd, 0);
  const mediaEquipe = total / qtdPorBarbeiro.length;
  if (mediaEquipe <= 0) return [];

  return qtdPorBarbeiro
    .filter((b) => b.qtd < mediaEquipe * (1 - LIMIAR_ABAIXO_MEDIA))
    .map((b) => ({ nome: b.nome, percentualAbaixo: ((mediaEquipe - b.qtd) / mediaEquipe) * 100 }));
}

export function identificarJanelaBaixaOcupacao(
  contagemPorHora: number[],
  horaMin: number,
  horaMax: number
): { horaInicio: number; horaFim: number } | null {
  if (horaMax - horaMin < 1) return null;

  const horas: number[] = [];
  for (let h = horaMin; h <= horaMax; h++) horas.push(h);

  const total = horas.reduce((s, h) => s + contagemPorHora[h], 0);
  const mediaHora = total / horas.length;
  if (mediaHora <= 0) return null;

  const limiar = mediaHora * 0.5;
  type Grupo = { inicio: number; fim: number };
  const grupos: Grupo[] = [];
  let atual: Grupo | null = null;
  for (const h of horas) {
    if (contagemPorHora[h] <= limiar) {
      if (atual && atual.fim === h - 1) {
        atual.fim = h;
      } else {
        atual = { inicio: h, fim: h };
        grupos.push(atual);
      }
    } else {
      atual = null;
    }
  }

  const candidatos = grupos.filter((g) => g.fim > g.inicio);
  if (candidatos.length === 0) return null;

  const maior = candidatos.reduce((a, b) => (b.fim - b.inicio > a.fim - a.inicio ? b : a));
  return { horaInicio: maior.inicio, horaFim: maior.fim + 1 };
}

function formatarHora(h: number): string {
  return `${String(h).padStart(2, "0")}h`;
}

const LIMIAR_META_RISCO = 0.85; // previsão abaixo de 85% da meta já vale alerta

export function metaEstaEmRisco(previsaoFechamentoCentavos: number, metaCentavos: number | null): boolean {
  if (metaCentavos === null || metaCentavos <= 0) return false;
  return previsaoFechamentoCentavos < metaCentavos * LIMIAR_META_RISCO;
}

const LIMIAR_OCUPACAO_ALTA = 85; // % de ocupação a partir do qual vale considerar contratar

export function identificarBarbeirosSobrecarregados(
  ocupacaoPorBarbeiro: { nome: string; percentual: number | null }[]
): string[] {
  return ocupacaoPorBarbeiro
    .filter((o) => o.percentual !== null && o.percentual >= LIMIAR_OCUPACAO_ALTA)
    .map((o) => o.nome);
}

export function gerarRecomendacoesDia(input: {
  qtdClientesSumidos: number;
  barbeirosAbaixoMedia: { nome: string; percentualAbaixo: number }[];
  janelaBaixaOcupacao: { horaInicio: number; horaFim: number } | null;
  metaCentavos: number | null;
  previsaoFechamentoCentavos: number;
  barbeirosSobrecarregados: string[];
}): string[] {
  const recomendacoes: string[] = [];

  if (input.metaCentavos !== null && metaEstaEmRisco(input.previsaoFechamentoCentavos, input.metaCentavos)) {
    recomendacoes.push(
      `No ritmo atual, você deve fechar o mês em ${formatarReais(input.previsaoFechamentoCentavos)}, abaixo da sua meta de ${formatarReais(input.metaCentavos)}. Vale reforçar vendas ou divulgação.`
    );
  }

  if (input.qtdClientesSumidos > 0) {
    const plural = input.qtdClientesSumidos > 1 ? "s" : "";
    recomendacoes.push(
      `Você tem ${input.qtdClientesSumidos} cliente${plural} inativo${plural}. Recomendo uma campanha de retorno.`
    );
  }

  for (const b of input.barbeirosAbaixoMedia) {
    recomendacoes.push(
      `O barbeiro ${b.nome} está com ${b.percentualAbaixo.toFixed(0)}% menos atendimentos que a média da equipe.`
    );
  }

  for (const nome of input.barbeirosSobrecarregados) {
    recomendacoes.push(`${nome} está com a agenda muito cheia — vale considerar contratar reforço ou ajustar horários.`);
  }

  if (input.janelaBaixaOcupacao) {
    recomendacoes.push(
      `Seus horários das ${formatarHora(input.janelaBaixaOcupacao.horaInicio)} às ${formatarHora(input.janelaBaixaOcupacao.horaFim)} estão com baixa ocupação.`
    );
  }

  return recomendacoes;
}

export type Previsao = {
  ritmoDiarioCentavos: number;
  previsaoFechamentoCentavos: number;
  diasRestantes: number;
  faltamPorDiaCentavos: number | null;
};

export function calcularPrevisao(
  faturamentoAteAgoraCentavos: number,
  diasPassados: number,
  diasNoMes: number,
  metaCentavos: number | null
): Previsao {
  const ritmoDiarioCentavos = diasPassados > 0 ? faturamentoAteAgoraCentavos / diasPassados : 0;
  const previsaoFechamentoCentavos = Math.round(ritmoDiarioCentavos * diasNoMes);
  const diasRestantes = Math.max(diasNoMes - diasPassados, 0);

  let faltamPorDiaCentavos: number | null = null;
  if (metaCentavos !== null) {
    const faltaTotal = metaCentavos - faturamentoAteAgoraCentavos;
    if (diasRestantes > 0) {
      faltamPorDiaCentavos = faltaTotal > 0 ? Math.ceil(faltaTotal / diasRestantes) : 0;
    } else {
      faltamPorDiaCentavos = faltaTotal > 0 ? faltaTotal : 0;
    }
  }

  return {
    ritmoDiarioCentavos: Math.round(ritmoDiarioCentavos),
    previsaoFechamentoCentavos,
    diasRestantes,
    faltamPorDiaCentavos,
  };
}
