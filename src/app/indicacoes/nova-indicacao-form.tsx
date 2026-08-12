"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { Barbeiro } from "@prisma/client";
import { criarIndicacao, type IndicacaoState } from "@/lib/actions/indicacoes";

const estadoInicial: IndicacaoState = {};

export function NovaIndicacaoForm({ barbeiros, souAdmin }: { barbeiros: Barbeiro[]; souAdmin: boolean }) {
  const [estado, formAction, pendente] = useActionState(criarIndicacao, estadoInicial);
  const [barbeiroId, setBarbeiroId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const barbeiroSelectRef = useRef<HTMLSelectElement>(null);
  const barbeiroIdRef = useRef(barbeiroId);
  barbeiroIdRef.current = barbeiroId;

  useEffect(() => {
    if (estado.erro) {
      if (barbeiroSelectRef.current) barbeiroSelectRef.current.value = barbeiroIdRef.current;
      return;
    }
    if (!pendente) {
      formRef.current?.reset();
      setBarbeiroId("");
    }
  }, [estado, pendente]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6 shadow-sm">
      <p className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Nova indicação</p>
      <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Nome</label>
          <input
            name="nome"
            required
            placeholder="Nome da pessoa indicada"
            className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-48"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Telefone (com DDD)</label>
          <input
            name="telefone"
            required
            placeholder="11999999999"
            className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-40"
          />
        </div>
        {souAdmin && (
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Barbeiro responsável</label>
            <select
              ref={barbeiroSelectRef}
              name="barbeiroId"
              required
              value={barbeiroId}
              onChange={(e) => setBarbeiroId(e.target.value)}
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
            >
              <option value="" disabled>
                Escolha
              </option>
              {barbeiros.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          type="submit"
          disabled={pendente}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-4 py-2 text-sm"
        >
          {pendente ? "Salvando..." : "Salvar indicação"}
        </button>
        {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
      </form>
    </div>
  );
}
