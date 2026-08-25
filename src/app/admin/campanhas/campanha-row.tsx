"use client";

import { alternarAtivaCampanha, excluirCampanha } from "@/lib/actions/campanhas";
import { itemCompleto, campanhaCompleta, type ItemProgresso } from "@/lib/campanhas";

export function CampanhaRow({
  id,
  titulo,
  ativa,
  barbeiroNome,
  criadoEm,
  itens,
}: {
  id: string;
  titulo: string | null;
  ativa: boolean;
  barbeiroNome: string;
  criadoEm: Date;
  itens: ItemProgresso[];
}) {
  const completa = campanhaCompleta(itens);

  return (
    <div
      className={`bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm ${
        !ativa ? "opacity-50" : ""
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold">
            {barbeiroNome}
            {titulo ? ` — ${titulo}` : ""}
            {completa && ativa && <span className="ml-2 text-green-600 text-sm font-medium">🎉 Completa!</span>}
          </p>
          <p className="text-neutral-500 dark:text-neutral-400 text-xs">
            criada em {criadoEm.toLocaleDateString("pt-BR")} {!ativa && "· encerrada"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <form action={alternarAtivaCampanha.bind(null, id, !ativa)}>
            <button className="text-sm text-neutral-600 dark:text-neutral-300 hover:text-orange-600 dark:hover:text-orange-400">
              {ativa ? "Encerrar" : "Reativar"}
            </button>
          </form>
          <form action={excluirCampanha.bind(null, id)}>
            <button className="text-sm text-neutral-400 dark:text-neutral-500 hover:text-red-600">Excluir</button>
          </form>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {itens.map((item) => {
          const feito = itemCompleto(item);
          return (
            <div
              key={item.itemId}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                feito ? "bg-green-50 dark:bg-green-950 text-green-700" : "bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200"
              }`}
            >
              <span>
                {feito ? "✓ " : ""}
                {item.nome}
              </span>
              <span className="font-semibold">
                {item.quantidadeAtual}/{item.quantidadeAlvo}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
