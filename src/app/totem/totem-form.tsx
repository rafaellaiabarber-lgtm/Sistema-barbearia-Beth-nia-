"use client";

import { useActionState, useState } from "react";
import type { Barbeiro } from "@prisma/client";
import { entrarNaFila, type EntrarFilaState } from "@/lib/actions/fila";

const estadoInicial: EntrarFilaState = {};

type Etapa = "telefone" | "nome" | "barbeiro";

export function TotemForm({ barbeiros }: { barbeiros: Barbeiro[] }) {
  const [estado, formAction, pendente] = useActionState(entrarNaFila, estadoInicial);
  const [etapa, setEtapa] = useState<Etapa>("telefone");
  const [telefone, setTelefone] = useState("");
  const [nome, setNome] = useState("");
  const [barbeiroPreferidoId, setBarbeiroPreferidoId] = useState<string | null>(null);
  const [erroLocal, setErroLocal] = useState("");

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
    <div className="w-full max-w-xl bg-neutral-900 rounded-3xl shadow-xl p-8 border border-neutral-800">
      <h1 className="text-3xl font-black text-white text-center mb-1">Barbearia Bethânia</h1>
      <p className="text-neutral-400 text-center mb-8">Toque para entrar na fila</p>

      {etapa === "telefone" && (
        <div>
          <p className="text-neutral-200 text-xl font-semibold mb-4 text-center">
            Qual é o seu telefone?
          </p>
          <input
            type="tel"
            inputMode="numeric"
            autoFocus
            placeholder="(11) 99999-9999"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full rounded-xl bg-neutral-800 border border-neutral-700 text-white text-2xl text-center px-4 py-4 mb-6 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="button"
            onClick={() => {
              if (!telefone.trim()) {
                setErroLocal("Informe seu telefone.");
                return;
              }
              setErroLocal("");
              setEtapa("nome");
            }}
            className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-lg py-4 transition-colors"
          >
            Continuar
          </button>
        </div>
      )}

      {etapa === "nome" && (
        <div>
          <p className="text-neutral-200 text-xl font-semibold mb-4 text-center">
            Como te chamamos?
          </p>
          <input
            type="text"
            autoFocus
            placeholder="Seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full rounded-xl bg-neutral-800 border border-neutral-700 text-white text-2xl text-center px-4 py-4 mb-6 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setEtapa("telefone")}
              className="rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 font-semibold px-6 py-4"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={() => {
                if (!nome.trim()) {
                  setErroLocal("Informe seu nome.");
                  return;
                }
                setErroLocal("");
                setEtapa("barbeiro");
              }}
              className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-lg py-4 transition-colors"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {etapa === "barbeiro" && (
        <form action={formAction}>
          <input type="hidden" name="telefone" value={telefone} />
          <input type="hidden" name="nome" value={nome} />
          {barbeiroPreferidoId && (
            <input type="hidden" name="barbeiroPreferidoId" value={barbeiroPreferidoId} />
          )}

          <p className="text-neutral-200 text-xl font-semibold mb-4 text-center">
            Escolha seu barbeiro
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setBarbeiroPreferidoId(null)}
              className={`rounded-2xl border-2 p-4 flex flex-col items-center gap-2 transition-colors ${
                barbeiroPreferidoId === null
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-neutral-700 bg-neutral-800 hover:border-neutral-600"
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-neutral-700 flex items-center justify-center text-2xl">
                🤝
              </div>
              <span className="text-white font-semibold text-sm">Sem preferência</span>
            </button>

            {barbeiros.map((b) => (
              <button
                type="button"
                key={b.id}
                onClick={() => setBarbeiroPreferidoId(b.id)}
                className={`rounded-2xl border-2 p-4 flex flex-col items-center gap-2 transition-colors ${
                  barbeiroPreferidoId === b.id
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-neutral-700 bg-neutral-800 hover:border-neutral-600"
                }`}
              >
                {b.fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.fotoUrl}
                    alt={b.nome}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-neutral-700 flex items-center justify-center text-2xl">
                    💈
                  </div>
                )}
                <span className="text-white font-semibold text-sm">{b.nome}</span>
              </button>
            ))}
          </div>

          {(erroLocal || estado.erro) && (
            <p className="text-red-400 text-sm mb-4 text-center">{erroLocal || estado.erro}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setEtapa("nome")}
              className="rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 font-semibold px-6 py-4"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={pendente}
              className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-neutral-950 font-bold text-lg py-4 transition-colors"
            >
              {pendente ? "Entrando na fila..." : "Entrar na fila"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
