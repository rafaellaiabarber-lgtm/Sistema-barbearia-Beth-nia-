"use client";

import { useMemo, useState } from "react";
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

export function Simulador({
  servico,
  comissaoPadrao,
  dadosReais,
  diasPeriodo,
  ticketAvulsoDefault,
}: {
  servico: ServicoSelecionado | null;
  comissaoPadrao: number;
  dadosReais: DadosReais;
  diasPeriodo: number;
  ticketAvulsoDefault: string;
}) {
  const [ticketAvulso, setTicketAvulso] = useState(ticketAvulsoDefault);
  const [frequencia, setFrequencia] = useState("4");
  const [descontoMin, setDescontoMin] = useState("5");
  const [descontoMax, setDescontoMax] = useState("35");
  const [conversaoMin, setConversaoMin] = useState("10");
  const [conversaoMax, setConversaoMax] = useState("60");
  const [slider, setSlider] = useState(50);

  const resultado = useMemo(() => {
    const ticketAvulsoCentavos = reaisParaCentavos(ticketAvulso);
    const freq = paraNumero(frequencia);
    if (ticketAvulsoCentavos <= 0 || freq <= 0) return null;

    const dMin = paraNumero(descontoMin);
    const dMax = paraNumero(descontoMax);
    const cMin = paraNumero(conversaoMin);
    const cMax = paraNumero(conversaoMax);
    const t = slider / 100;

    const desconto = dMin + (dMax - dMin) * t;
    const conversao = cMin + (cMax - cMin) * t;

    const valorCheioCentavos = ticketAvulsoCentavos * freq;
    const precoAssinaturaCentavos = Math.round(valorCheioCentavos * (1 - desconto / 100));
    const ticketPorCorteAssinaturaCentavos = Math.round(ticketAvulsoCentavos * (1 - desconto / 100));
    const novoTicketMedioGeralCentavos = Math.round(
      (conversao / 100) * ticketPorCorteAssinaturaCentavos + (1 - conversao / 100) * ticketAvulsoCentavos
    );

    let lucroPorCorteCentavos: number | null = null;
    let lucroMensalPlanoCentavos: number | null = null;
    if (servico) {
      const comissaoPercentual = servico.comissaoPercentual ?? comissaoPadrao;
      const comissaoCentavos = Math.round((ticketPorCorteAssinaturaCentavos * comissaoPercentual) / 100);
      lucroPorCorteCentavos = ticketPorCorteAssinaturaCentavos - servico.custoCentavos - comissaoCentavos;
      lucroMensalPlanoCentavos = lucroPorCorteCentavos * freq;
    }

    // Compara o faturamento real do período com uma projeção: parte dos clientes vira assinante (pagando a
    // assinatura, prorateada pelos dias do período) e o resto continua avulso, na mesma frequência que já tem hoje.
    const clientesConvertidos = Math.round(dadosReais.clientesUnicos * (conversao / 100));
    const clientesAvulsosRestantes = dadosReais.clientesUnicos - clientesConvertidos;
    const precoAssinaturaProrateadoCentavos = Math.round(precoAssinaturaCentavos * (diasPeriodo / 30));
    const receitaAssinantesCentavos = clientesConvertidos * precoAssinaturaProrateadoCentavos;
    const receitaAvulsosRestantesCentavos = Math.round(
      clientesAvulsosRestantes * dadosReais.frequenciaMediaPorCliente * ticketAvulsoCentavos
    );
    const faturamentoProjetadoCentavos = receitaAssinantesCentavos + receitaAvulsosRestantesCentavos;
    const diferencaCentavos = faturamentoProjetadoCentavos - dadosReais.faturamentoCentavos;

    return {
      desconto,
      conversao,
      valorCheioCentavos,
      precoAssinaturaCentavos,
      ticketPorCorteAssinaturaCentavos,
      novoTicketMedioGeralCentavos,
      lucroPorCorteCentavos,
      lucroMensalPlanoCentavos,
      clientesConvertidos,
      clientesAvulsosRestantes,
      faturamentoProjetadoCentavos,
      diferencaCentavos,
    };
  }, [
    ticketAvulso,
    frequencia,
    descontoMin,
    descontoMax,
    conversaoMin,
    conversaoMax,
    slider,
    servico,
    comissaoPadrao,
    dadosReais,
    diasPeriodo,
  ]);

  const limitesInvalidos = paraNumero(descontoMax) < paraNumero(descontoMin);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-4 mb-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Atendimentos no período</p>
          <p className="text-xl font-bold">{dadosReais.nAtendimentos}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Clientes únicos</p>
          <p className="text-xl font-bold">{dadosReais.clientesUnicos}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Ticket médio real</p>
          <p className="text-xl font-bold">{formatarReais(dadosReais.ticketMedioCentavos)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Faturamento real no período</p>
          <p className="text-xl font-bold">{formatarReais(dadosReais.faturamentoCentavos)}</p>
        </div>
      </div>

      {dadosReais.nAtendimentos === 0 && (
        <p className="text-amber-600 text-sm mb-4">
          Nenhum atendimento desse serviço nesse período. Escolha outro serviço/período acima, ou preencha o ticket
          avulso manualmente pra simular mesmo assim.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Dados do plano</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Ticket médio avulso (R$)</label>
                <input
                  value={ticketAvulso}
                  onChange={(e) => setTicketAvulso(e.target.value)}
                  placeholder="45,00"
                  inputMode="decimal"
                  className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Cortes por mês no plano</label>
                <input
                  value={frequencia}
                  onChange={(e) => setFrequencia(e.target.value)}
                  placeholder="4"
                  inputMode="decimal"
                  className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Ticket avulso já vem preenchido com o valor real do serviço/período escolhidos acima — mas você pode
              editar.
            </p>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Régua de desconto</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Desconto no "Baixo" (%)</label>
                  <input
                    value={descontoMin}
                    onChange={(e) => setDescontoMin(e.target.value)}
                    inputMode="decimal"
                    className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Desconto no "Muito UAU" (%)</label>
                  <input
                    value={descontoMax}
                    onChange={(e) => setDescontoMax(e.target.value)}
                    inputMode="decimal"
                    className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Conversão estimada (clientes avulsos que migram)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Conversão no "Baixo" (%)</label>
                  <input
                    value={conversaoMin}
                    onChange={(e) => setConversaoMin(e.target.value)}
                    inputMode="decimal"
                    className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Conversão no "Muito UAU" (%)</label>
                  <input
                    value={conversaoMax}
                    onChange={(e) => setConversaoMax(e.target.value)}
                    inputMode="decimal"
                    className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Você calibra isso com base no que achar razoável — depois pode ajustar com dados reais.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">Baixo</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Muito UAU</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={slider}
                onChange={(e) => setSlider(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Resultado da simulação</h2>
          {limitesInvalidos ? (
            <p className="text-red-600 text-sm">
              O desconto do "Muito UAU" precisa ser maior ou igual ao do "Baixo".
            </p>
          ) : !resultado ? (
            <p className="text-slate-400 dark:text-slate-500 text-sm">Preencha o ticket avulso e a frequência pra calcular.</p>
          ) : (
            <>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {formatarReais(resultado.precoAssinaturaCentavos)}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">preço sugerido da assinatura no mês</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Valor cheio (sem desconto)</span>
                  <span>{formatarReais(resultado.valorCheioCentavos)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Desconto aplicado</span>
                  <span>{resultado.desconto.toFixed(1).replace(".", ",")}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Ticket por corte na assinatura</span>
                  <span>{formatarReais(resultado.ticketPorCorteAssinaturaCentavos)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Conversão estimada</span>
                  <span>{resultado.conversao.toFixed(1).replace(".", ",")}%</span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 dark:border-slate-800">
                  <span className="font-medium text-green-600">Novo ticket médio geral</span>
                  <span className="font-medium text-green-600">{formatarReais(resultado.novoTicketMedioGeralCentavos)}</span>
                </div>
              </div>

              {resultado.lucroPorCorteCentavos !== null && resultado.lucroMensalPlanoCentavos !== null && (
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-sm">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Lucro (custo e comissão de "{servico?.nome}")
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Lucro por corte na assinatura</span>
                    <span>{formatarReais(resultado.lucroPorCorteCentavos)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-600 dark:text-blue-400">Lucro mensal por assinante</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {formatarReais(resultado.lucroMensalPlanoCentavos)}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-sm">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Faturamento do período, aplicando a assinatura nesses mesmos clientes
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Clientes que virariam assinantes</span>
                  <span>{resultado.clientesConvertidos} de {dadosReais.clientesUnicos}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Faturamento real do período</span>
                  <span>{formatarReais(dadosReais.faturamentoCentavos)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Faturamento projetado com a assinatura</span>
                  <span>{formatarReais(resultado.faturamentoProjetadoCentavos)}</span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 dark:border-slate-800">
                  <span className={`font-medium ${resultado.diferencaCentavos >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {resultado.diferencaCentavos >= 0 ? "Aumento" : "Redução"} no período
                  </span>
                  <span className={`font-medium ${resultado.diferencaCentavos >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatarReais(Math.abs(resultado.diferencaCentavos))}
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
