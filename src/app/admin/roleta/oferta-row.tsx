"use client";

import type { OfertaRoleta } from "@prisma/client";
import { alternarAtivoOferta, excluirOferta } from "@/lib/actions/roleta";

export function OfertaRow({ oferta }: { oferta: OfertaRoleta }) {
  return (
    <div
      className={`flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm ${
        !oferta.ativo ? "opacity-50" : ""
      }`}
    >
      <div>
        <p className="font-semibold text-slate-900 dark:text-white">{oferta.nome}</p>
        {oferta.descontoPercentual !== null && (
          <p className="text-slate-500 dark:text-slate-400 text-sm">{oferta.descontoPercentual}% de desconto</p>
        )}
      </div>
      <div className="flex items-center gap-4">
        <form action={alternarAtivoOferta.bind(null, oferta.id, !oferta.ativo)}>
          <button className="text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
            {oferta.ativo ? "Desativar" : "Ativar"}
          </button>
        </form>
        <form action={excluirOferta.bind(null, oferta.id)}>
          <button className="text-sm text-slate-400 dark:text-slate-500 hover:text-red-600">Excluir</button>
        </form>
      </div>
    </div>
  );
}
