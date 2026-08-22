"use client";

import { useActionState, useState } from "react";
import { alterarPlanoAssinatura, type AlterarPlanoState } from "@/lib/actions/assinaturas";

const estadoInicial: AlterarPlanoState = {};

type PlanoOpcao = { id: string; nome: string };

export function TrocarPlano({
  assinaturaId,
  planoAtualId,
  planos,
}: {
  assinaturaId: string;
  planoAtualId: string;
  planos: PlanoOpcao[];
}) {
  const [aberto, setAberto] = useState(false);
  const acao = alterarPlanoAssinatura.bind(null, assinaturaId);
  const [estado, formAction, pendente] = useActionState(acao, estadoInicial);

  if (estado.sucesso) {
    return <span className="text-green-600 dark:text-green-400 text-sm">Plano alterado ✓</span>;
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="text-sm text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
      >
        Trocar plano
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <select
        name="planoId"
        defaultValue={planoAtualId}
        className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-sm"
      >
        {planos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pendente}
        className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-3 py-1.5 text-sm"
      >
        {pendente ? "Salvando..." : "Salvar"}
      </button>
      <button type="button" onClick={() => setAberto(false)} className="text-sm text-slate-400 dark:text-slate-500">
        Cancelar
      </button>
      {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
    </form>
  );
}
