"use client";

import { excluirDespesaBarbeiro } from "@/lib/actions/despesas-barbeiro";
import { formatarReais } from "@/lib/format";
import { Valor } from "../../valor";

export function DespesaRow({
  id,
  descricao,
  valorCentavos,
  data,
}: {
  id: string;
  descricao: string;
  valorCentavos: number;
  data: Date;
}) {
  return (
    <div className="flex items-center justify-between gap-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
      <div>
        <p className="font-semibold">{descricao}</p>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">{data.toLocaleDateString("pt-BR")}</p>
      </div>
      <div className="flex items-center gap-3">
        <p className="text-red-600 dark:text-red-400 font-semibold">
          <Valor>-{formatarReais(valorCentavos)}</Valor>
        </p>
        <form action={excluirDespesaBarbeiro.bind(null, id)}>
          <button className="text-sm text-neutral-400 dark:text-neutral-500 hover:text-red-600">Excluir</button>
        </form>
      </div>
    </div>
  );
}
