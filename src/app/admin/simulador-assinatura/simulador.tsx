"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatarReais, reaisParaCentavos } from "@/lib/format";

function paraNumero(valor: string): number {
  const normalizado = valor.replace(",", ".");
  const numero = Number.parseFloat(normalizado);
  return Number.isNaN(numero) ? 0 : numero;
}

type ServicoSelecionado = { id: string; nome: string; custoCentavos: number; comissaoPercentual: number | null };

type DadosReais = {
  nAtendimentos: number;
  clientesUnicos: number;
  faturamentoCentavos: number;
  ticketMedioCentavos: number;
  frequenciaMediaPorCliente: number;
};

type Agenda = "sobra" | "movimentada" | "lotada";

const POSICAO_POR_AGENDA: Record<Agenda, number> = {
  sobra: 0.7,
  movimentada: 0.85,
  lotada: 1,
};

const LABEL_AGENDA: Record<Agenda, string> = {
  sobra: "Sobra horário",
  movimentada: "Movimentada",
  lotada: "Quase lotada",
};

export function Simulador({
  servico,
  comissaoPadrao,
  dadosReais,
  diasPeriodo,
  ticketAvulsoDefault,
  intervaloMedioDias,
  frequenciaRealCortesPorMes,
}: {
  servico: ServicoSelecionado | null;
  comissaoPadrao: number;
  dadosReais: DadosReais;
  diasPeriodo: number;
  ticketAvulsoDefault: string;
  intervaloMedioDias: number | null;
  frequenciaRealCortesPorMes: number | null;
}) {
  const [ticketAvulso, setTicketAvulso] = useState(ticketAvulsoDefault);
  const [usoEsperado, setUsoEsperado] = useState(
    frequenciaRealCortesPorMes ? frequenciaRealCortesPorMes.toFixed(1).replace(".", ",") : "4"
  );
  const [agenda, setAgenda] = useState<Agenda>("movimentada");
  const [conversaoMin, setConversaoMin] = useState("10");
  const [conversaoMax, setConversaoMax] = useState("60");
  const [slider, setSlider] = useState(50);
  const [faturamentoHistorico, setFaturamentoHistorico] = useState("");
  const [mesesHistorico, setMesesHistorico] = useState("");

  const usandoHistorico = reaisParaCentavos(faturamentoHistorico) > 0 && paraNumero(mesesHistorico) > 0;

  // Ticket avulso e uso esperado vêm preenchidos com o (pouco) dado real do sistema atual. Assim que o admin
  // começa a usar dados históricos de outro sistema, isso fica enganoso — limpa os dois campos (se ele não tiver
  // mexido neles ainda) pra deixar claro que agora precisam refletir o histórico digitado, não o sistema atual.
  const jaLimpouParaHistoricoRef = useRef(false);
  useEffect(() => {
    if (usandoHistorico && !jaLimpouParaHistoricoRef.current) {
      jaLimpouParaHistoricoRef.current = true;
      if (ticketAvulso === ticketAvulsoDefault) setTicketAvulso("");
      const usoEsperadoDefault = frequenciaRealCortesPorMes ? frequenciaRealCortesPorMes.toFixed(1).replace(".", ",") : "4";
      if (usoEsperado === usoEsperadoDefault) setUsoEsperado("");
    }
    if (!usandoHistorico) {
      jaLimpouParaHistoricoRef.current = false;
    }
  }, [usandoHistorico, ticketAvulso, ticketAvulsoDefault, usoEsperado, frequenciaRealCortesPorMes]);

  // Sistema novo, sem histórico suficiente ainda pra calcular nada sozinho: se o admin digitar o faturamento
  // avulso que já tinha em outro sistema (e em quantos meses), usa isso como base em vez dos dados reais do
  // período, estimando clientes/atendimentos a partir do ticket avulso e do uso esperado já informados ao lado.
  const dadosEfetivos = useMemo(() => {
    if (!usandoHistorico) return dadosReais;

    const ticketAvulsoCentavos = reaisParaCentavos(ticketAvulso);
    const uso = paraNumero(usoEsperado);
    const faturamentoHistoricoCentavos = reaisParaCentavos(faturamentoHistorico);
    const meses = paraNumero(mesesHistorico);

    const faturamentoMensalCentavos = faturamentoHistoricoCentavos / meses;
    const faturamentoPeriodoCentavos = Math.round(faturamentoMensalCentavos * (diasPeriodo / 30));
    const clientesUnicos =
      ticketAvulsoCentavos > 0 && uso > 0 ? Math.round(faturamentoMensalCentavos / (ticketAvulsoCentavos * uso)) : 0;
    const nAtendimentos = Math.round(clientesUnicos * uso);

    return {
      nAtendimentos,
      clientesUnicos,
      faturamentoCentavos: faturamentoPeriodoCentavos,
      ticketMedioCentavos: ticketAvulsoCentavos,
      frequenciaMediaPorCliente: uso,
    };
  }, [usandoHistorico, dadosReais, ticketAvulso, usoEsperado, faturamentoHistorico, mesesHistorico, diasPeriodo]);

  const resultado = useMemo(() => {
    const ticketAvulsoCentavos = reaisParaCentavos(ticketAvulso);
    const uso = paraNumero(usoEsperado);
    if (ticketAvulsoCentavos <= 0) return null;

    const cMin = paraNumero(conversaoMin);
    const cMax = paraNumero(conversaoMax);
    const t = slider / 100;
    const conversao = cMin + (cMax - cMin) * t;

    // Teto de um plano ilimitado comum no mercado: 2x o valor do corte avulso. O preço de lançamento fica numa
    // posição dentro dessa faixa de acordo com a agenda de hoje — agenda vazia puxa pra baixo (convida a assinar),
    // agenda cheia sobe até o teto (não precisa de desconto pra vender o que já não tem vaga sobrando).
    const tetoCentavos = ticketAvulsoCentavos * 2;
    const posicaoPercentual = POSICAO_POR_AGENDA[agenda];
    const precoAssinaturaCentavos = Math.round(tetoCentavos * posicaoPercentual);

    const ticketEfetivoPorUsoCentavos = uso > 0 ? Math.round(precoAssinaturaCentavos / uso) : null;

    const novoTicketMedioGeralCentavos =
      ticketEfetivoPorUsoCentavos !== null
        ? Math.round((conversao / 100) * ticketEfetivoPorUsoCentavos + (1 - conversao / 100) * ticketAvulsoCentavos)
        : null;

    let lucroPorUsoCentavos: number | null = null;
    let lucroMensalPorAssinanteCentavos: number | null = null;
    if (servico && ticketEfetivoPorUsoCentavos !== null) {
      const comissaoPercentual = servico.comissaoPercentual ?? comissaoPadrao;
      const comissaoCentavos = Math.round((ticketEfetivoPorUsoCentavos * comissaoPercentual) / 100);
      lucroPorUsoCentavos = ticketEfetivoPorUsoCentavos - servico.custoCentavos - comissaoCentavos;
      lucroMensalPorAssinanteCentavos = lucroPorUsoCentavos * uso;
    }

    // Compara o faturamento do período (real, ou o informado manualmente acima) com uma projeção: parte dos
    // clientes vira assinante (pagando a assinatura, prorateada pelos dias do período) e o resto continua
    // avulso, na mesma frequência que já tem hoje.
    const clientesConvertidos = Math.round(dadosEfetivos.clientesUnicos * (conversao / 100));
    const clientesAvulsosRestantes = dadosEfetivos.clientesUnicos - clientesConvertidos;
    const precoAssinaturaProrateadoCentavos = Math.round(precoAssinaturaCentavos * (diasPeriodo / 30));
    const receitaAssinantesCentavos = clientesConvertidos * precoAssinaturaProrateadoCentavos;
    const receitaAvulsosRestantesCentavos = Math.round(
      clientesAvulsosRestantes * dadosEfetivos.frequenciaMediaPorCliente * ticketAvulsoCentavos
    );
    const faturamentoProjetadoCentavos = receitaAssinantesCentavos + receitaAvulsosRestantesCentavos;
    const diferencaCentavos = faturamentoProjetadoCentavos - dadosEfetivos.faturamentoCentavos;

    // Extrapola o período pra uma base mensal e depois anual, pra dar uma ideia do LTV do grupo de clientes ao
    // longo de 12 meses (mantendo a mesma proporção de conversão e a mesma frequência avulsa observadas no período).
    const fatorMensal = 30 / diasPeriodo;
    const faturamentoAtualAnualCentavos = Math.round(dadosEfetivos.faturamentoCentavos * fatorMensal * 12);
    const faturamentoProjetadoAnualCentavos = Math.round(faturamentoProjetadoCentavos * fatorMensal * 12);
    const diferencaAnualCentavos = faturamentoProjetadoAnualCentavos - faturamentoAtualAnualCentavos;

    return {
      conversao,
      tetoCentavos,
      posicaoPercentual,
      precoAssinaturaCentavos,
      ticketEfetivoPorUsoCentavos,
      novoTicketMedioGeralCentavos,
      lucroPorUsoCentavos,
      lucroMensalPorAssinanteCentavos,
      clientesConvertidos,
      clientesAvulsosRestantes,
      faturamentoProjetadoCentavos,
      diferencaCentavos,
      faturamentoAtualAnualCentavos,
      faturamentoProjetadoAnualCentavos,
      diferencaAnualCentavos,
    };
  }, [ticketAvulso, usoEsperado, agenda, conversaoMin, conversaoMax, slider, servico, comissaoPadrao, dadosEfetivos, diasPeriodo]);

  return (
    <div>
      {usandoHistorico && (
        <p className="text-xs text-orange-600 dark:text-orange-400 mb-2">
          Usando os dados históricos informados abaixo em vez dos dados reais do sistema.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            Atendimentos {usandoHistorico ? "(estimado)" : "no período"}
          </p>
          <p className="text-xl font-bold">{dadosEfetivos.nAtendimentos}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Clientes únicos {usandoHistorico ? "(estimado)" : ""}</p>
          <p className="text-xl font-bold">{dadosEfetivos.clientesUnicos}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Ticket médio {usandoHistorico ? "(informado)" : "real"}</p>
          <p className="text-xl font-bold">{formatarReais(dadosEfetivos.ticketMedioCentavos)}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            Faturamento {usandoHistorico ? "(estimado)" : "real"} no período
          </p>
          <p className="text-xl font-bold">{formatarReais(dadosEfetivos.faturamentoCentavos)}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Ritmo real de retorno (histórico)</p>
          <p className="text-xl font-bold">
            {intervaloMedioDias ? `${Math.round(intervaloMedioDias)} dias` : "—"}
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
            {frequenciaRealCortesPorMes
              ? `≈ ${frequenciaRealCortesPorMes.toFixed(1).replace(".", ",")} cortes/mês`
              : "sem clientes com 2+ visitas ainda"}
          </p>
        </div>
      </div>

      {dadosReais.nAtendimentos === 0 && !usandoHistorico && (
        <p className="text-amber-600 text-sm mb-4">
          Nenhum atendimento desse serviço nesse período. Escolha outro serviço/período acima, ou preencha o ticket
          avulso manualmente pra simular mesmo assim.
        </p>
      )}

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm mb-4">
        <h2 className="font-semibold mb-1">Dados históricos (de antes do sistema atual)</h2>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-3">
          Sistema novo ainda não tem histórico suficiente? Preencha o faturamento avulso que você já tinha em outro
          sistema e em quantos meses isso foi — os cards acima e a simulação passam a usar esses números (junto com
          o ticket avulso e o uso esperado ao lado).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:max-w-md">
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Faturamento avulso total (R$)</label>
            <input
              value={faturamentoHistorico}
              onChange={(e) => setFaturamentoHistorico(e.target.value)}
              placeholder="9.000,00"
              inputMode="decimal"
              className="w-full rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Em quantos meses (aprox.)</label>
            <input
              value={mesesHistorico}
              onChange={(e) => setMesesHistorico(e.target.value)}
              placeholder="2"
              inputMode="decimal"
              className="w-full rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Dados do plano</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Ticket médio avulso (R$)</label>
                <input
                  value={ticketAvulso}
                  onChange={(e) => setTicketAvulso(e.target.value)}
                  placeholder={usandoHistorico ? "informe o ticket desse histórico" : "45,00"}
                  inputMode="decimal"
                  className="w-full rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Uso médio esperado (cortes/mês)</label>
                <input
                  value={usoEsperado}
                  onChange={(e) => setUsoEsperado(e.target.value)}
                  placeholder={usandoHistorico ? "ex: 4" : "4"}
                  inputMode="decimal"
                  className="w-full rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm"
                />
              </div>
            </div>
            {usandoHistorico ? (
              <p className="text-xs text-orange-600 dark:text-orange-400">
                Como você está usando dados históricos, preencha aqui o ticket médio e o uso esperado daquele período
                (do outro sistema) — eles não vêm mais do sistema atual, e são a base pra estimar quantos clientes
                geraram o faturamento histórico informado abaixo.
              </p>
            ) : (
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                Ticket avulso já vem preenchido com o valor real do serviço/período escolhidos acima. Uso esperado já
                vem do ritmo real de retorno dos clientes (card "Ritmo real de retorno" acima) — é só usado pra calcular
                lucro e ticket efetivo, já que o plano é ilimitado (não tem "cortes contratados").
              </p>
            )}

            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">Como está sua agenda hoje?</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(Object.keys(LABEL_AGENDA) as Agenda[]).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAgenda(a)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      agenda === a
                        ? "bg-orange-600 border-orange-600 text-white"
                        : "bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300"
                    }`}
                  >
                    {LABEL_AGENDA[a]}
                  </button>
                ))}
              </div>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                Sobra horário → preço mais convidativo, perto do piso da faixa. Quase lotada → preço perto do teto,
                já que a prioridade deixa de ser encher a agenda.
              </p>
            </div>

            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">Conversão estimada (clientes avulsos que migram)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Conversão no mínimo (%)</label>
                  <input
                    value={conversaoMin}
                    onChange={(e) => setConversaoMin(e.target.value)}
                    inputMode="decimal"
                    className="w-full rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Conversão no máximo (%)</label>
                  <input
                    value={conversaoMax}
                    onChange={(e) => setConversaoMax(e.target.value)}
                    inputMode="decimal"
                    className="w-full rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                Você calibra isso com base no que achar razoável — depois pode ajustar com dados reais.
              </p>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">Mínimo</span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">Máximo</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={slider}
                  onChange={(e) => setSlider(Number(e.target.value))}
                  className="w-full accent-orange-600"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Resultado da simulação</h2>
          {!resultado ? (
            <p className="text-neutral-400 dark:text-neutral-500 text-sm">Preencha o ticket avulso pra calcular.</p>
          ) : (
            <>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                {formatarReais(resultado.precoAssinaturaCentavos)}
              </p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-4">preço sugerido da assinatura ilimitada no mês</p>

              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">Teto do plano (2× o avulso)</span>
                  <span>{formatarReais(resultado.tetoCentavos)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">Posição na faixa ({LABEL_AGENDA[agenda]})</span>
                  <span>{Math.round(resultado.posicaoPercentual * 100)}% do teto</span>
                </div>
                {resultado.ticketEfetivoPorUsoCentavos !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Ticket efetivo por uso</span>
                    <span>{formatarReais(resultado.ticketEfetivoPorUsoCentavos)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">Conversão estimada</span>
                  <span>{resultado.conversao.toFixed(1).replace(".", ",")}%</span>
                </div>
                {resultado.novoTicketMedioGeralCentavos !== null && (
                  <div className="flex items-center justify-between pt-1.5 border-t border-neutral-200 dark:border-neutral-800">
                    <span className="font-medium text-green-600">Novo ticket médio geral</span>
                    <span className="font-medium text-green-600">{formatarReais(resultado.novoTicketMedioGeralCentavos)}</span>
                  </div>
                )}
              </div>

              {resultado.lucroPorUsoCentavos !== null && resultado.lucroMensalPorAssinanteCentavos !== null && (
                <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-1.5 text-sm">
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                    Lucro (custo e comissão de "{servico?.nome}")
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Lucro por uso</span>
                    <span>{formatarReais(resultado.lucroPorUsoCentavos)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-orange-600 dark:text-orange-400">Lucro mensal por assinante</span>
                    <span className="font-medium text-orange-600 dark:text-orange-400">
                      {formatarReais(resultado.lucroMensalPorAssinanteCentavos)}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-1.5 text-sm">
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                  Faturamento do período, aplicando a assinatura nesses mesmos clientes
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">Clientes que virariam assinantes</span>
                  <span>{resultado.clientesConvertidos} de {dadosEfetivos.clientesUnicos}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Faturamento {usandoHistorico ? "(estimado)" : "real"} do período
                  </span>
                  <span>{formatarReais(dadosEfetivos.faturamentoCentavos)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">Faturamento projetado com a assinatura</span>
                  <span>{formatarReais(resultado.faturamentoProjetadoCentavos)}</span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-neutral-200 dark:border-neutral-800">
                  <span className={`font-medium ${resultado.diferencaCentavos >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {resultado.diferencaCentavos >= 0 ? "Aumento" : "Redução"} no período
                  </span>
                  <span className={`font-medium ${resultado.diferencaCentavos >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatarReais(Math.abs(resultado.diferencaCentavos))}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-1.5 text-sm">
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                  Projeção anual (extrapolando o ritmo do período escolhido pra 12 meses)
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">Faturamento anual no ritmo de hoje (avulso)</span>
                  <span>{formatarReais(resultado.faturamentoAtualAnualCentavos)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">Faturamento anual com a assinatura</span>
                  <span>{formatarReais(resultado.faturamentoProjetadoAnualCentavos)}</span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-neutral-200 dark:border-neutral-800">
                  <span className={`font-medium ${resultado.diferencaAnualCentavos >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {resultado.diferencaAnualCentavos >= 0 ? "Aumento" : "Redução"} no ano
                  </span>
                  <span className={`font-medium ${resultado.diferencaAnualCentavos >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatarReais(Math.abs(resultado.diferencaAnualCentavos))}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
