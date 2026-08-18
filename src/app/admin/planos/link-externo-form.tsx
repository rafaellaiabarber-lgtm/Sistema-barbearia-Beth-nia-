"use client";

import { useActionState } from "react";
import { salvarLinkExternoPlano, type PlanoState } from "@/lib/actions/planos";

const estadoInicial: PlanoState = {};

export function LinkExternoForm({ planoId, linkAtual }: { planoId: string; linkAtual: string | null }) {
  const acaoComId = salvarLinkExternoPlano.bind(null, planoId);
  const [estado, formAction, pendente] = useActionState(acaoComId, estadoInicial);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
          Colar link externo de pagamento (de outro app/banco)
        </label>
        <input
          name="linkExterno"
          defaultValue={linkAtual ?? ""}
          placeholder="Cole aqui o link copiado do outro app"
          className="rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm w-64"
        />
      </div>
      <button
        type="submit"
        disabled={pendente}
        className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-3 py-2 text-sm"
      >
        {pendente ? "Salvando..." : "Salvar link"}
      </button>
      {estado.sucesso && <span className="text-green-600 dark:text-green-400 text-sm">Salvo ✓</span>}
      {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
    </form>
  );
}
