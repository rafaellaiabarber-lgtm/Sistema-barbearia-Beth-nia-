"use client";

import { useMemo, useState } from "react";
import { formatarReais, reaisParaCentavos } from "@/lib/format";

function paraNumero(valor: string): number {
  const normalizado = valor.replace(",", ".");
  const numero = Number.parseFloat(normalizado);
  return Number.isNaN(numero) ? 0 : numero;
}

type ServicoOpcao = { id: string; nome: string; custoCentavos: number; comissaoPercentual: number | null };

export function Simulador({
  ticketAvulsoDefault,
  servicos,
  comissaoPadrao,
}: {
  ticketAvulsoDefault: string;
  servicos: ServicoOpcao[];
  comissaoPadrao: number;
}) {
  const [ticketAvulso, setTicketAvulso] = useState(ticketAvulsoDefault);
  const [frequencia, setFrequencia] = useState("4");
  const [descontoMin, setDescontoMin] = useState("5");
  const [descontoMax, setDescontoMax] = useState("35");
  const [conversaoMin, setConversaoMin] = useState("10");
  const [conversaoMax, setConversaoMax] = useState("60");
  const [slider, setSlider] = useState(50);
  const [servicoId, setServicoId] = useState("");

  const servicoEscolhido = servicos.find((s) => s.id === servicoId) ?? null;

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
    if (servicoEscolhido) {
      const comissaoPercentual = servicoEscolhido.comissaoPercentual ?? comissaoPadrao;
      const comissaoCentavos = Math.round((ticketPorCorteAssinaturaCentavos * comissaoPercentual) / 100);
      lucroPorCorteCentavos = ticketPorCorteAssinaturaCentavos - servicoEscolhido.custoCentavos - comissaoCentavos;
      lucroMensalPlanoCentavos = lucroPorCorteCentavos * freq;
    }

    return {
      desconto,
      conversao,
      valorCheioCentavos,
      precoAssinaturaCentavos,
      ticketPorCorteAssinaturaCentavos,
      novoTicketMedioGeralCentavos,
      lucroPorCorteCentavos,
      lucroMensalPlanoCentavos,
    };
  }, [ticketAvulso, frequencia, descontoMin, descontoMax, conversaoMin, conversaoMax, slider, servicoEscolhido, comissaoPadrao]);

  const limitesInvalidos = paraNumero(descontoMax) < paraNumero(descontoMin);

  return (
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
            Ticket avulso é calculado automaticamente com base nos atendimentos não cobertos por assinatura dos
            últimos 90 dias — mas você pode editar.
          </p>

          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
              Serviço equivalente ao corte da assinatura (pra calcular o lucro)
            </label>
            <select
              value={servicoId}
              onChange={(e) => setServicoId(e.target.value)}
              className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
            >
              <option value="">Não calcular lucro</option>
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </div>

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

            {resultado.lucroPorCorteCentavos !== null && resultado.lucroMensalPlanoCentavos !== null ? (
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-sm">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Lucro (custo e comissão do serviço selecionado)
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
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
                Escolha um serviço equivalente ao lado pra ver o lucro descontando custo e comissão do barbeiro.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
