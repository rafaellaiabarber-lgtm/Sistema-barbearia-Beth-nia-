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
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-10 border border-slate-200 text-center">
        <p className="text-slate-500 text-lg mb-2">Você entrou na fila!</p>
        <p className="text-7xl font-black text-blue-600 mb-4">{estado.posicao}º</p>
        <p className="text-slate-700 mb-8">
          Aguarde ser chamado. Fique de olho no painel da barbearia.
        </p>
        <a
          href="/totem"
          className="inline-block rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg px-6 py-3 transition-colors"
        >
          Concluir
        </a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl p-8 border border-slate-200">
      <h1 className="text-3xl font-black text-slate-900 text-center mb-1">Barbearia Bethânia</h1>
      <p className="text-slate-500 text-center mb-8">Toque para entrar na fila</p>

      {etapa === "telefone" && (
        <div>
          <p className="text-slate-800 text-xl font-semibold mb-4 text-center">
            Qual é o seu telefone?
          </p>
          <input
            type="tel"
            inputMode="numeric"
            autoFocus
            placeholder="(11) 99999-9999"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full rounded-xl bg-white border border-slate-300 text-slate-900 text-2xl text-center px-4 py-4 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 transition-colors"
          >
            Continuar
          </button>
        </div>
      )}

      {etapa === "nome" && (
        <div>
          <p className="text-slate-800 text-xl font-semibold mb-4 text-center">
            Como te chamamos?
          </p>
          <input
            type="text"
            autoFocus
            placeholder="Seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full rounded-xl bg-white border border-slate-300 text-slate-900 text-2xl text-center px-4 py-4 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setEtapa("telefone")}
              className="rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-semibold px-6 py-4"
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
              className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 transition-colors"
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

          <p className="text-slate-800 text-xl font-semibold mb-4 text-center">
            Escolha seu barbeiro
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setBarbeiroPreferidoId(null)}
              className={`rounded-2xl border-2 p-4 flex flex-col items-center gap-2 transition-colors ${
                barbeiroPreferidoId === null
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl">
                🤝
              </div>
              <span className="text-slate-900 font-semibold text-sm">Sem preferência</span>
            </button>

            {barbeiros.map((b) => (
              <button
                type="button"
                key={b.id}
                onClick={() => setBarbeiroPreferidoId(b.id)}
                className={`rounded-2xl border-2 p-4 flex flex-col items-center gap-2 transition-colors ${
                  barbeiroPreferidoId === b.id
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
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
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl">
                    💈
                  </div>
                )}
                <span className="text-slate-900 font-semibold text-sm">{b.nome}</span>
              </button>
            ))}
          </div>

          {(erroLocal || estado.erro) && (
            <p className="text-red-600 text-sm mb-4 text-center">{erroLocal || estado.erro}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setEtapa("nome")}
              className="rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-semibold px-6 py-4"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={pendente}
              className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-lg py-4 transition-colors"
            >
              {pendente ? "Entrando na fila..." : "Entrar na fila"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
