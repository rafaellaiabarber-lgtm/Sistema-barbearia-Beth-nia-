export type EtapaCorte = "MAQUINA" | "TRANSICAO" | "ACABAMENTO" | "FINALIZACAO";

export const ETAPAS: EtapaCorte[] = ["MAQUINA", "TRANSICAO", "ACABAMENTO", "FINALIZACAO"];

export const LABEL_ETAPA: Record<EtapaCorte, string> = {
  MAQUINA: "Máquina",
  TRANSICAO: "Transição",
  ACABAMENTO: "Acabamento",
  FINALIZACAO: "Finalização",
};

// Dica mostrada quando a etapa é o gargalo do barbeiro.
export const DICA_ETAPA: Record<EtapaCorte, string> = {
  MAQUINA: "Defina as alturas de pente antes de começar e faça a base em menos passadas, sem voltar no mesmo lugar.",
  TRANSICAO: "Siga a sequência do checklist sem pular de lado: termine um lado inteiro antes de ir pro outro.",
  ACABAMENTO: "Use a navalha/máquina de acabamento só uma vez por região — confiança no traço economiza retoque.",
  FINALIZACAO: "Deixe produto, secador e espelho prontos antes de chegar nessa etapa.",
};

export type TemposEtapas = Record<EtapaCorte, number>;

export type RegistroParaAnalise = {
  barbeiroId: string;
  tecnicaId: string | null;
  segundosMaquina: number;
  segundosTransicao: number;
  segundosAcabamento: number;
  segundosFinalizacao: number;
  segundosTotal: number;
  concluidoEm: Date;
};

export function temposDoRegistro(r: RegistroParaAnalise): TemposEtapas {
  return {
    MAQUINA: r.segundosMaquina,
    TRANSICAO: r.segundosTransicao,
    ACABAMENTO: r.segundosAcabamento,
    FINALIZACAO: r.segundosFinalizacao,
  };
}

export function formatarDuracao(segundos: number) {
  const s = Math.max(0, Math.round(segundos));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(seg)}` : `${pad(m)}:${pad(seg)}`;
}

export function formatarMinutos(segundos: number) {
  const minutos = segundos / 60;
  return `${minutos.toLocaleString("pt-BR", { maximumFractionDigits: minutos < 10 ? 1 : 0 })} min`;
}

function media(valores: number[]) {
  if (valores.length === 0) return 0;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

export type AnaliseEtapas = {
  quantidade: number;
  mediaTotal: number;
  etapas: { etapa: EtapaCorte; media: number; percentual: number; mediaEquipe: number | null }[];
  gargalo: EtapaCorte | null;
  // Etapa em que o barbeiro está mais acima da média da equipe (em segundos), se houver equipe pra comparar.
  maiorDiferencaEquipe: { etapa: EtapaCorte; segundosAcima: number } | null;
};

/** Média de cada etapa, qual pesa mais no tempo total e como fica em relação à equipe. */
export function analisarEtapas(meus: RegistroParaAnalise[], equipe?: RegistroParaAnalise[]): AnaliseEtapas {
  const mediaTotal = media(meus.map((r) => r.segundosTotal));
  const etapas = ETAPAS.map((etapa) => {
    const m = media(meus.map((r) => temposDoRegistro(r)[etapa]));
    const mediaEquipe = equipe && equipe.length > 0 ? media(equipe.map((r) => temposDoRegistro(r)[etapa])) : null;
    return { etapa, media: m, percentual: mediaTotal > 0 ? (m / mediaTotal) * 100 : 0, mediaEquipe };
  });

  const gargalo =
    meus.length > 0 ? etapas.reduce((maior, e) => (e.media > maior.media ? e : maior), etapas[0]).etapa : null;

  let maiorDiferencaEquipe: AnaliseEtapas["maiorDiferencaEquipe"] = null;
  for (const e of etapas) {
    if (e.mediaEquipe === null) continue;
    const acima = e.media - e.mediaEquipe;
    // Só destaca diferenças que valem a pena (pelo menos 30s acima da equipe).
    if (acima >= 30 && (!maiorDiferencaEquipe || acima > maiorDiferencaEquipe.segundosAcima)) {
      maiorDiferencaEquipe = { etapa: e.etapa, segundosAcima: acima };
    }
  }

  return { quantidade: meus.length, mediaTotal, etapas, gargalo, maiorDiferencaEquipe };
}

export type Evolucao = { inicio: number; atual: number; melhor: number; diferenca: number } | null;

/**
 * Compara a média dos primeiros cortes com a dos últimos (até 3 de cada lado), pra gerar
 * a frase "seu Mid Fade caiu de 45 para 32 minutos". Precisa de pelo menos 2 cortes.
 */
export function calcularEvolucao(registrosEmOrdem: { segundosTotal: number }[]): Evolucao {
  if (registrosEmOrdem.length < 2) return null;
  const janela = Math.min(3, Math.floor(registrosEmOrdem.length / 2));
  const inicio = media(registrosEmOrdem.slice(0, janela).map((r) => r.segundosTotal));
  const atual = media(registrosEmOrdem.slice(-janela).map((r) => r.segundosTotal));
  const melhor = Math.min(...registrosEmOrdem.map((r) => r.segundosTotal));
  return { inicio, atual, melhor, diferenca: inicio - atual };
}

function chaveDia(data: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`;
}

export type ProgressoDesafio = {
  sequenciaAtual: number;
  melhorSequencia: number;
  concluido: boolean;
  concluidoEm: string | null; // chave do dia (AAAA-MM-DD) em que bateu a meta
  diasNaMeta: number;
};

/**
 * Desafio "N dias seguidos abaixo de X minutos": cada dia em que o barbeiro registrou corte
 * conta como dia de trabalho; o dia está "na meta" se a média dos cortes daquele dia ficou
 * abaixo da meta. Dias sem corte (folga) não quebram a sequência; um dia acima da meta quebra.
 */
export function calcularProgressoDesafio(
  registros: { segundosTotal: number; concluidoEm: Date }[],
  metaMinutos: number,
  diasSeguidos: number
): ProgressoDesafio {
  const porDia = new Map<string, number[]>();
  for (const r of registros) {
    const chave = chaveDia(r.concluidoEm);
    porDia.set(chave, [...(porDia.get(chave) ?? []), r.segundosTotal]);
  }
  const dias = [...porDia.keys()].sort();

  let sequencia = 0;
  let melhor = 0;
  let diasNaMeta = 0;
  let concluidoEm: string | null = null;
  for (const dia of dias) {
    const naMeta = media(porDia.get(dia)!) < metaMinutos * 60;
    if (naMeta) {
      sequencia += 1;
      diasNaMeta += 1;
      if (sequencia > melhor) melhor = sequencia;
      if (!concluidoEm && sequencia >= diasSeguidos) concluidoEm = dia;
    } else {
      sequencia = 0;
    }
  }

  return { sequenciaAtual: sequencia, melhorSequencia: melhor, concluido: concluidoEm !== null, concluidoEm, diasNaMeta };
}

export type EntradaGanho = {
  tempoAtualMinutos: number;
  minutosEconomizados: number;
  horasPorDia: number;
  diasPorMes: number;
  ticketMedioReais: number;
  // Percentual da comissão do barbeiro (0-100). 100 = ele fica com tudo (autônomo/dono).
  comissaoPercentual: number;
  // Quanto da agenda está ocupada hoje (0-100). Corte extra só vira dinheiro se tiver cliente pra ocupar.
  ocupacaoPercentual: number;
};

export type ResultadoGanho = {
  tempoNovoMinutos: number;
  cortesPorMesAtual: number;
  cortesPorMesNovo: number;
  cortesExtrasPorMes: number;
  ganhoBrutoMes: number;
  ganhoBarbeiroMes: number;
  ganhoBarbeiroAno: number;
};

export function calcularGanho(e: EntradaGanho): ResultadoGanho | null {
  const tempoNovo = e.tempoAtualMinutos - e.minutosEconomizados;
  if (e.tempoAtualMinutos <= 0 || tempoNovo <= 0 || e.horasPorDia <= 0 || e.diasPorMes <= 0) return null;

  const minutosNoMes = e.horasPorDia * 60 * e.diasPorMes * (Math.min(Math.max(e.ocupacaoPercentual, 0), 100) / 100);
  const cortesAtual = Math.floor(minutosNoMes / e.tempoAtualMinutos);
  const cortesNovo = Math.floor(minutosNoMes / tempoNovo);
  const extras = Math.max(cortesNovo - cortesAtual, 0);
  const bruto = extras * e.ticketMedioReais;
  const barbeiro = bruto * (Math.min(Math.max(e.comissaoPercentual, 0), 100) / 100);

  return {
    tempoNovoMinutos: tempoNovo,
    cortesPorMesAtual: cortesAtual,
    cortesPorMesNovo: cortesNovo,
    cortesExtrasPorMes: extras,
    ganhoBrutoMes: bruto,
    ganhoBarbeiroMes: barbeiro,
    ganhoBarbeiroAno: barbeiro * 12,
  };
}

export const MINIMO_CORTES_RANKING = 3;

export type LinhaRanking = {
  barbeiroId: string;
  nome: string;
  fotoUrl: string | null;
  quantidade: number;
  melhor: number;
  mediaRecente: number; // média dos últimos 5 cortes
};

/** Ranking por técnica: ordena pela média dos últimos 5 cortes (mais justo que o melhor tempo isolado). */
export function montarRankingTempos(
  registros: RegistroParaAnalise[],
  barbeiros: { id: string; nome: string; fotoUrl: string | null }[]
): LinhaRanking[] {
  const linhas: LinhaRanking[] = [];
  for (const b of barbeiros) {
    const meus = registros
      .filter((r) => r.barbeiroId === b.id)
      .sort((a, c) => a.concluidoEm.getTime() - c.concluidoEm.getTime());
    if (meus.length < MINIMO_CORTES_RANKING) continue;
    linhas.push({
      barbeiroId: b.id,
      nome: b.nome,
      fotoUrl: b.fotoUrl,
      quantidade: meus.length,
      melhor: Math.min(...meus.map((r) => r.segundosTotal)),
      mediaRecente: media(meus.slice(-5).map((r) => r.segundosTotal)),
    });
  }
  return linhas.sort((a, b) => a.mediaRecente - b.mediaRecente);
}

// Modelos prontos pro admin começar sem cadastrar tudo do zero.
export const MODELOS_TECNICAS: { nome: string; passos: { etapa: EtapaCorte; texto: string }[] }[] = [
  {
    nome: "Low Fade",
    passos: [
      { etapa: "MAQUINA", texto: "Marcar a linha do degradê baixa, logo acima da orelha" },
      { etapa: "MAQUINA", texto: "Base com pente maior em todo o contorno" },
      { etapa: "MAQUINA", texto: "Pente 0 / 0,5 abaixo da linha" },
      { etapa: "TRANSICAO", texto: "Abrir e fechar a alavanca entre a linha e a base" },
      { etapa: "TRANSICAO", texto: "Fazer um lado inteiro, depois o outro, depois a nuca" },
      { etapa: "ACABAMENTO", texto: "Pezinho e contorno da orelha" },
      { etapa: "ACABAMENTO", texto: "Conferir simetria no espelho" },
      { etapa: "FINALIZACAO", texto: "Tirar resíduos, aplicar produto e finalizar o topo" },
    ],
  },
  {
    nome: "Mid Fade",
    passos: [
      { etapa: "MAQUINA", texto: "Marcar a linha do degradê na altura média da cabeça" },
      { etapa: "MAQUINA", texto: "Base com pente maior em todo o contorno" },
      { etapa: "MAQUINA", texto: "Pente 0 / 0,5 na parte de baixo" },
      { etapa: "TRANSICAO", texto: "Pente 1 abrindo a alavanca, sem passar da linha" },
      { etapa: "TRANSICAO", texto: "Pente 1,5 / 2 fechando a transição" },
      { etapa: "TRANSICAO", texto: "Fazer um lado inteiro, depois o outro, depois a nuca" },
      { etapa: "ACABAMENTO", texto: "Pezinho, costeleta e contorno da orelha" },
      { etapa: "ACABAMENTO", texto: "Conferir simetria no espelho" },
      { etapa: "FINALIZACAO", texto: "Tirar resíduos, aplicar produto e finalizar o topo" },
    ],
  },
  {
    nome: "High Fade",
    passos: [
      { etapa: "MAQUINA", texto: "Marcar a linha do degradê alta, perto da curva da cabeça" },
      { etapa: "MAQUINA", texto: "Pente 0 / 0,5 em toda a lateral abaixo da linha" },
      { etapa: "TRANSICAO", texto: "Subir com pente 1 e 1,5 em faixas curtas" },
      { etapa: "TRANSICAO", texto: "Unir a transição com o topo sem marcar degrau" },
      { etapa: "ACABAMENTO", texto: "Pezinho, costeleta e contorno da orelha" },
      { etapa: "ACABAMENTO", texto: "Conferir simetria no espelho" },
      { etapa: "FINALIZACAO", texto: "Tirar resíduos, aplicar produto e finalizar o topo" },
    ],
  },
];

export const MODELOS_DESAFIOS: { titulo: string; tecnica: string | null; metaMinutos: number; diasSeguidos: number }[] = [
  { titulo: "7 dias abaixo de 35 minutos", tecnica: null, metaMinutos: 35, diasSeguidos: 7 },
  { titulo: "Mid Fade em menos de 30 min por 5 dias", tecnica: "Mid Fade", metaMinutos: 30, diasSeguidos: 5 },
  { titulo: "Primeira semana abaixo de 45 minutos", tecnica: null, metaMinutos: 45, diasSeguidos: 3 },
];
