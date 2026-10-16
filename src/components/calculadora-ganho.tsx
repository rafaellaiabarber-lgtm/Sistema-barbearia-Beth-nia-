"use client";

import { useState } from "react";
import { calcularGanho } from "@/lib/cronometro";

function Campo({
  label,
  valor,
  onChange,
  sufixo,
  passo = 1,
  ajuda,
}: {
  label: string;
  valor: number;
  onChange: (v: number) => void;
  sufixo?: string;
  passo?: number;
  ajuda?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs text-neutral-400 mb-1">{label}</span>
      <div className="flex items-center rounded-lg border border-neutral-600 bg-neutral-900 focus-within:border-orange-500">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={passo}
          value={Number.isFinite(valor) ? valor : ""}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-transparent px-3 py-2 text-sm outline-none"
        />
        {sufixo && <span className="pr-3 text-xs text-neutral-400 shrink-0">{sufixo}</span>}
      </div>
      {ajuda && <span className="block text-[11px] text-neutral-400 mt-1">{ajuda}</span>}
    </label>
  );
}

const reais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function CalculadoraGanho({
  tempoAtualMinutos,
  ticketMedioReais,
  comissaoPercentual,
  origemTempo,
  origemTicket,
}: {
  tempoAtualMinutos: number;
  ticketMedioReais: number;
  comissaoPercentual: number;
  origemTempo: string;
  origemTicket: string;
}) {
  const [tempoAtual, setTempoAtual] = useState(tempoAtualMinutos);
  const [economia, setEconomia] = useState(10);
  const [horas, setHoras] = useState(8);
  const [dias, setDias] = useState(24);
  const [ticket, setTicket] = useState(ticketMedioReais);
  const [comissao, setComissao] = useState(comissaoPercentual);
  const [ocupacao, setOcupacao] = useState(80);

  const r = calcularGanho({
    tempoAtualMinutos: tempoAtual,
    minutosEconomizados: economia,
    horasPorDia: horas,
    diasPorMes: dias,
    ticketMedioReais: ticket,
    comissaoPercentual: comissao,
    ocupacaoPercentual: ocupacao,
  });

  return (
    <div className="space-y-5">
      <div className="bg-neutral-950 text-white rounded-2xl p-5 shadow-lg text-center">
        {r ? (
          <>
            <p className="text-orange-300 text-sm">
              Cortando {economia} min mais rápido ({tempoAtual} → {r.tempoNovoMinutos} min)
            </p>
            <p className="text-4xl sm:text-5xl font-bold my-2">+{reais(r.ganhoBarbeiroMes)}</p>
            <p className="text-sm text-white/70">por mês no seu bolso · {reais(r.ganhoBarbeiroAno)} por ano</p>
            <div className="grid grid-cols-3 gap-2 mt-5 text-left">
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[11px] text-white/60">Cortes/mês hoje</p>
                <p className="text-xl font-bold">{r.cortesPorMesAtual}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[11px] text-white/60">Cortes/mês novo</p>
                <p className="text-xl font-bold">{r.cortesPorMesNovo}</p>
              </div>
              <div className="rounded-xl bg-orange-600/30 p-3">
                <p className="text-[11px] text-orange-200">Cortes extras</p>
                <p className="text-xl font-bold">+{r.cortesExtrasPorMes}</p>
              </div>
            </div>
            {comissao < 100 && (
              <p className="text-xs text-white/50 mt-3">
                Faturamento extra da barbearia: {reais(r.ganhoBrutoMes)}/mês (você fica com {comissao}%).
              </p>
            )}
          </>
        ) : (
          <p className="text-white/70">Preencha os campos abaixo com valores válidos.</p>
        )}
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-sm">
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-semibold">Minutos a menos por corte</span>
            <span className="font-bold text-orange-400">{economia} min</span>
          </div>
          <input
            type="range"
            min={1}
            max={Math.max(Math.floor(tempoAtual) - 5, 1)}
            value={economia}
            onChange={(e) => setEconomia(Number(e.target.value))}
            className="w-full accent-orange-600"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Seu tempo médio hoje" valor={tempoAtual} onChange={setTempoAtual} sufixo="min" ajuda={origemTempo} />
          <Campo label="Ticket médio" valor={ticket} onChange={setTicket} sufixo="R$" passo={0.5} ajuda={origemTicket} />
          <Campo label="Horas atendendo por dia" valor={horas} onChange={setHoras} sufixo="h" passo={0.5} />
          <Campo label="Dias trabalhados no mês" valor={dias} onChange={setDias} sufixo="dias" />
          <Campo label="Sua comissão" valor={comissao} onChange={setComissao} sufixo="%" ajuda="100% se for autônomo/dono" />
          <Campo
            label="Agenda ocupada"
            valor={ocupacao}
            onChange={setOcupacao}
            sufixo="%"
            ajuda="Tempo livre só vira dinheiro se tiver cliente"
          />
        </div>
      </div>
    </div>
  );
}
