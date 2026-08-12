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
