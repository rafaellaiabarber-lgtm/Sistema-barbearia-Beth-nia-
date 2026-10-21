"use client";

import { useActionState, useEffect, useState } from "react";
import { buscarSlotsDisponiveis, criarAgendamento, type AgendarState } from "@/lib/actions/agenda";
import { formatarReais } from "@/lib/format";

type Barbeiro = { id: string; nome: string };
type Servico = { id: string; nome: string; duracaoMinutos: number; precoCentavos: number };

const estadoInicial: AgendarState = {};

function proximosDias(qtd: number) {
  const dias: { chave: string; label: string }[] = [];
  const hoje = new Date();
  for (let i = 0; i < qtd; i++) {
    const data = new Date(hoje);
    data.setDate(data.getDate() + i);
    const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
    const label =
      i === 0
        ? "Hoje"
        : i === 1
          ? "Amanhã"
          : data.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
    dias.push({ chave, label });
  }
  return dias;
}

export function AgendaWizard({
  barbeariaSlug,
  barbeariaNome,
  barbeiros,
  servicos,
}: {
  barbeariaSlug: string;
  barbeariaNome: string;
  barbeiros: Barbeiro[];
  servicos: Servico[];
}) {
  const [etapa, setEtapa] = useState<"servico" | "barbeiro" | "horario" | "dados">("servico");
  const [servicoId, setServicoId] = useState<string | null>(null);
  const [barbeiroId, setBarbeiroId] = useState<string | null>(null);
  const [diaSelecionado, setDiaSelecionado] = useState(proximosDias(1)[0].chave);
  const [slots, setSlots] = useState<string[]>([]);
  const [carregandoSlots, setCarregandoSlots] = useState(false);
  const [slotSelecionado, setSlotSelecionado] = useState<string | null>(null);

  const acaoAgendar = criarAgendamento;
  const [estado, formAction, pendente] = useActionState(acaoAgendar, estadoInicial);

  const servico = servicos.find((s) => s.id === servicoId) ?? null;
  const barbeiro = barbeiros.find((b) => b.id === barbeiroId) ?? null;
  const dias = proximosDias(14);

  useEffect(() => {
    if (etapa !== "horario" || !servicoId || !barbeiroId) return;
    let cancelado = false;
    setCarregandoSlots(true);
    setSlotSelecionado(null);
    buscarSlotsDisponiveis(barbeariaSlug, barbeiroId, servicoId, diaSelecionado).then((res) => {
      if (cancelado) return;
      setSlots(res.slots ?? []);
      setCarregandoSlots(false);
    });
    return () => {
      cancelado = true;
    };
  }, [etapa, servicoId, barbeiroId, diaSelecionado, barbeariaSlug]);

  if (estado.sucesso) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="bg-lime-400 rounded-2xl p-6">
          <p className="text-black font-bold text-xl mb-2">Agendado! 🎉</p>
          <p className="text-black text-sm">
            {servico?.nome} com {barbeiro?.nome} —{" "}
            {slotSelecionado &&
              new Date(slotSelecionado).toLocaleString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
          </p>
          <p className="text-black/70 text-xs mt-3">Chegue uns minutinhos antes do horário. Até lá!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm flex flex-col items-center text-center">
      <p className="text-neutral-400 text-sm mb-1">Agendar horário em</p>
      <h1 className="text-white text-2xl font-bold mb-6">{barbeariaNome}</h1>

      <div className="flex items-center gap-1.5 mb-6">
        {(["servico", "barbeiro", "horario", "dados"] as const).map((e, i) => (
          <div
            key={e}
            className={`h-1.5 rounded-full ${
              i <= (["servico", "barbeiro", "horario", "dados"] as const).indexOf(etapa) ? "bg-lime-400" : "bg-neutral-700"
            } w-8`}
          />
        ))}
      </div>

      {etapa === "servico" && (
        <div className="w-full space-y-2">
          <p className="text-white font-semibold mb-2">Qual serviço?</p>
          {servicos.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setServicoId(s.id);
                setEtapa("barbeiro");
              }}
              className="w-full flex items-center justify-between rounded-xl bg-neutral-900 border border-neutral-700 hover:border-lime-400 text-white px-4 py-3 text-left"
            >
              <span>{s.nome}</span>
              <span className="text-neutral-400 text-sm">{formatarReais(s.precoCentavos)}</span>
            </button>
          ))}
          {servicos.length === 0 && <p className="text-neutral-400 text-sm">Nenhum serviço disponível no momento.</p>}
        </div>
      )}

      {etapa === "barbeiro" && (
        <div className="w-full space-y-2">
          <p className="text-white font-semibold mb-2">Com quem?</p>
          {barbeiros.map((b) => (
            <button
              key={b.id}
              onClick={() => {
                setBarbeiroId(b.id);
                setEtapa("horario");
              }}
              className="w-full rounded-xl bg-neutral-900 border border-neutral-700 hover:border-lime-400 text-white px-4 py-3 text-left"
            >
              {b.nome}
            </button>
          ))}
          {barbeiros.length === 0 && <p className="text-neutral-400 text-sm">Nenhum barbeiro disponível no momento.</p>}
          <button onClick={() => setEtapa("servico")} className="text-neutral-400 text-sm mt-2">
            ← Voltar
          </button>
        </div>
      )}

      {etapa === "horario" && (
        <div className="w-full">
          <p className="text-white font-semibold mb-2">Quando?</p>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-1 px-1">
            {dias.map((d) => (
              <button
                key={d.chave}
                onClick={() => setDiaSelecionado(d.chave)}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap ${
                  diaSelecionado === d.chave ? "bg-lime-400 text-black" : "bg-neutral-900 border border-neutral-700 text-white"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {carregandoSlots ? (
            <p className="text-neutral-400 text-sm py-6">Buscando horários...</p>
          ) : slots.length === 0 ? (
            <p className="text-neutral-400 text-sm py-6">Sem horários livres nesse dia — tenta outro dia ali em cima.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {slots.map((s) => {
                const hora = new Date(s).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                return (
                  <button
                    key={s}
                    onClick={() => {
                      setSlotSelecionado(s);
                      setEtapa("dados");
                    }}
                    className="rounded-lg bg-neutral-900 border border-neutral-700 hover:border-lime-400 text-white text-sm py-2"
                  >
                    {hora}
                  </button>
                );
              })}
            </div>
          )}
          <button onClick={() => setEtapa("barbeiro")} className="text-neutral-400 text-sm">
            ← Voltar
          </button>
        </div>
      )}

      {etapa === "dados" && (
        <form action={formAction} className="w-full space-y-3">
          <input type="hidden" name="barbeariaSlug" value={barbeariaSlug} />
          <input type="hidden" name="barbeiroId" value={barbeiroId ?? ""} />
          <input type="hidden" name="servicoId" value={servicoId ?? ""} />
          <input type="hidden" name="horario" value={slotSelecionado ?? ""} />

          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-3 text-left text-sm text-neutral-300 mb-1">
            <p className="text-white font-semibold">{servico?.nome}</p>
            <p>
              {barbeiro?.nome} ·{" "}
              {slotSelecionado &&
                new Date(slotSelecionado).toLocaleString("pt-BR", {
                  weekday: "short",
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
            </p>
          </div>

          <input
            name="nome"
            required
            placeholder="Seu nome"
            className="w-full rounded-xl bg-neutral-900 border border-neutral-700 text-white placeholder:text-neutral-500 px-4 py-3 text-center"
          />
          <input
            name="telefone"
            required
            placeholder="Seu telefone (WhatsApp)"
            className="w-full rounded-xl bg-neutral-900 border border-neutral-700 text-white placeholder:text-neutral-500 px-4 py-3 text-center"
          />
          {estado.erro && <p className="text-red-400 text-sm">{estado.erro}</p>}
          <button
            type="submit"
            disabled={pendente}
            className="w-full rounded-xl bg-lime-400 hover:bg-lime-300 disabled:opacity-60 text-black font-bold text-lg py-4"
          >
            {pendente ? "Confirmando..." : "Confirmar agendamento"}
          </button>
          <button type="button" onClick={() => setEtapa("horario")} className="text-neutral-400 text-sm">
            ← Voltar
          </button>
        </form>
      )}
    </div>
  );
}
