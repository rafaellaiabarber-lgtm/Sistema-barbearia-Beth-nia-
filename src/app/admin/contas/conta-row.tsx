"use client";

import { useActionState, useState } from "react";
import type { ContaFinanceira } from "@prisma/client";
import { marcarContaPaga, excluirConta, type ContaState } from "@/lib/actions/contas";
import { formatarReais, LABEL_CATEGORIA_DESPESA } from "@/lib/format";
import { SeletorFormaPagamento } from "../../forma-pagamento-selector";

const estadoInicial: ContaState = {};

export function ContaRow({ conta, atrasada }: { conta: ContaFinanceira; atrasada: boolean }) {
  const [pagando, setPagando] = useState(false);
  const acaoComId = marcarContaPaga.bind(null, conta.id);
  const [estado, formAction, pendente] = useActionState(acaoComId, estadoInicial);

  return (
    <div
      className={`bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-sm ${
        atrasada ? "border-red-300" : "border-slate-200 dark:border-slate-800"
      } ${conta.status === "PAGO" ? "opacity-60" : ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">{conta.descricao}</p>
          <p className={`text-xs mt-0.5 ${atrasada ? "text-red-600 font-semibold" : "text-slate-400 dark:text-slate-500"}`}>
            Vence em {conta.vencimento.toLocaleDateString("pt-BR")}
            {atrasada ? " — atrasada" : ""}
            {conta.categoria && ` · ${LABEL_CATEGORIA_DESPESA[conta.categoria]}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700 dark:text-slate-200">{formatarReais(conta.valorCentavos)}</span>
          {conta.status === "PENDENTE" && !pagando && (
            <button
              type="button"
              onClick={() => setPagando(true)}
              className="rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 py-1.5"
            >
              Marcar como pago
            </button>
          )}
          {conta.status === "PAGO" && (
            <span className="text-green-600 text-sm font-medium">
              Pago em {conta.pagoEm?.toLocaleDateString("pt-BR")}
            </span>
          )}
          {conta.status === "PENDENTE" && (
            <form action={excluirConta.bind(null, conta.id)}>
              <button className="text-slate-400 dark:text-slate-500 hover:text-red-600 text-sm">Excluir</button>
            </form>
          )}
        </div>
      </div>

      {pagando && (
        <form action={formAction} className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-slate-600 dark:text-slate-300 text-sm font-medium mb-2">Forma de pagamento:</p>
          <div className="max-w-sm mb-2">
            <SeletorFormaPagamento />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pendente}
              className="rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold px-3 py-1.5"
            >
              {pendente ? "Confirmando..." : "Confirmar pagamento"}
            </button>
            <button
              type="button"
              onClick={() => setPagando(false)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 text-sm"
            >
              Cancelar
            </button>
          </div>
          {estado.erro && <p className="text-red-600 text-sm mt-2">{estado.erro}</p>}
        </form>
      )}
    </div>
  );
}
