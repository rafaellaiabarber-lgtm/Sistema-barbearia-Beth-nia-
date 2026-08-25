"use client";

import type { OfertaRoleta } from "@prisma/client";
import { alternarAtivoOferta, excluirOferta } from "@/lib/actions/roleta";

export function OfertaRow({ oferta }: { oferta: OfertaRoleta }) {
  return (
    <div
      className={`flex items-center justify-between bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 shadow-sm ${
        !oferta.ativo ? "opacity-50" : ""
      }`}
    >
      <div>
        <p className="font-semibold text-neutral-900 dark:text-white">{oferta.nome}</p>
        {oferta.descontoPercentual !== null && (
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">{oferta.descontoPercentual}% de desconto</p>
        )}
      </div>
      <div className="flex items-center gap-4">
        <form action={alternarAtivoOferta.bind(null, oferta.id, !oferta.ativo)}>
          <button className="text-sm text-neutral-600 dark:text-neutral-300 hover:text-orange-600 dark:hover:text-orange-400">
            {oferta.ativo ? "Desativar" : "Ativar"}
          </button>
        </form>
        <form action={excluirOferta.bind(null, oferta.id)}>
          <button className="text-sm text-neutral-400 dark:text-neutral-500 hover:text-red-600">Excluir</button>
        </form>
      </div>
    </div>
  );
}
