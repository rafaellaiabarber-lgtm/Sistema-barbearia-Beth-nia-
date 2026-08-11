"use client";

import { useActionState, useState } from "react";
import type { Servico } from "@prisma/client";
import { entrarNaFila, type EntrarFilaState } from "@/lib/actions/fila";
import { formatarReais } from "@/lib/format";

const estadoInicial: EntrarFilaState = {};

export function TotemForm({ servicos }: { servicos: Servico[] }) {
  const [estado, formAction, pendente] = useActionState(entrarNaFila, estadoInicial);
  const [selecionados, setSelecionados] = useState<string[]>([]);

  function alternarServico(id: string) {
    setSelecionados((atual) =>
      atual.includes(id) ? atual.filter((s) => s !== id) : [...atual, id]
    );
  }

  const totalCentavos = servicos
    .filter((s) => selecionados.includes(s.id))
    .reduce((soma, s) => soma + s.precoCentavos, 0);

  if (estado.sucesso) {
    return (
      <div className="w-full max-w-md bg-neutral-900 rounded-3xl shadow-xl p-10 border border-neutral-800 text-center">
        <p className="text-neutral-400 text-lg mb-2">Você entrou na fila!</p>
        <p className="text-7xl font-black text-amber-500 mb-4">{estado.posicao}º</p>
        <p className="text-neutral-300 mb-8">
          Aguarde ser chamado. Fique de olho no painel da barbearia.
        </p>
        <a
          href="/totem"
          className="inline-block rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-lg px-6 py-3 transition-colors"
        >
          Concluir
        </a>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="w-full max-w-xl bg-neutral-900 rounded-3xl shadow-xl p-8 border border-neutral-800"
    >
      <h1 className="text-3xl font-black text-white text-center mb-1">Barbearia Beth Nia</h1>
      <p className="text-neutral-400 text-center mb-8">Toque para entrar na fila</p>

      <p className="text-neutral-300 font-semibold mb-3">Escolha o(s) serviço(s):</p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {servicos.map((s) => {
          const ativo = selecionados.includes(s.id);
          return (
            <button
              type="button"
              key={s.id}
              onClick={() => alternarServico(s.id)}
              className={`rounded-2xl border-2 p-4 text-left transition-colors ${
                ativo
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-neutral-700 bg-neutral-800 hover:border-neutral-600"
              }`}
            >
              <span className="block text-white font-semibold">{s.nome}</span>
              <span className="block text-amber-400 text-sm">{formatarReais(s.precoCentavos)}</span>
            </button>
          );
        })}
      </div>
      {selecionados.map((id) => (
        <input key={id} type="hidden" name="servicoIds" value={id} />
      ))}

      {totalCentavos > 0 && (
        <p className="text-right text-neutral-300 mb-4">
          Total: <span className="text-amber-400 font-bold">{formatarReais(totalCentavos)}</span>
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 mb-6">
        <div>
          <label className="block text-sm text-neutral-300 mb-1" htmlFor="nome">
            Seu nome
          </label>
          <input
            id="nome"
            name="nome"
            type="text"
            required
            className="w-full rounded-xl bg-neutral-800 border border-neutral-700 text-white text-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-300 mb-1" htmlFor="telefone">
            Seu telefone
          </label>
          <input
            id="telefone"
            name="telefone"
            type="tel"
            inputMode="numeric"
            placeholder="(11) 99999-9999"
            required
            className="w-full rounded-xl bg-neutral-800 border border-neutral-700 text-white text-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {estado.erro && <p className="text-red-400 text-sm mb-4 text-center">{estado.erro}</p>}

      <button
        type="submit"
        disabled={pendente}
        className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-neutral-950 font-bold text-lg py-4 transition-colors"
      >
        {pendente ? "Entrando na fila..." : "Entrar na fila"}
      </button>
    </form>
  );
}
