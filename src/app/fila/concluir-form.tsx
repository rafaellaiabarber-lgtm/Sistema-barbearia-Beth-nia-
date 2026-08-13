"use client";

import { useActionState, useState } from "react";
import type { Servico } from "@prisma/client";
import { concluirAtendimento, type ConcluirState } from "@/lib/actions/fila";
import { formatarReais } from "@/lib/format";
import { SeletorFormaPagamento } from "../forma-pagamento-selector";

const estadoInicial: ConcluirState = {};

export function ConcluirForm({
  atendimentoId,
  servicos,
}: {
  atendimentoId: string;
  servicos: Servico[];
}) {
  const acaoComId = concluirAtendimento.bind(null, atendimentoId);
  const [estado, formAction, pendente] = useActionState(acaoComId, estadoInicial);
  const [selecionados, setSelecionados] = useState<string[]>([]);

  function alternarServico(id: string) {
    setSelecionados((atual) => (atual.includes(id) ? atual.filter((s) => s !== id) : [...atual, id]));
  }

  const totalCentavos = servicos
    .filter((s) => selecionados.includes(s.id))
    .reduce((soma, s) => soma + s.precoCentavos, 0);

  return (
    <form action={formAction}>
      <p className="text-slate-700 dark:text-slate-200 text-sm font-semibold mb-2">Serviço(s) realizado(s):</p>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {servicos.map((s) => {
          const ativo = selecionados.includes(s.id);
          return (
            <button
              type="button"
              key={s.id}
              onClick={() => alternarServico(s.id)}
              className={`rounded-lg border-2 px-3 py-2 text-left text-sm transition-colors ${
                ativo
                  ? "border-lime-600 bg-lime-50 dark:bg-lime-950"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
              }`}
            >
              <span className="block text-slate-900 dark:text-white font-medium">{s.nome}</span>
              <span className="block text-lime-600 text-xs">{formatarReais(s.precoCentavos)}</span>
            </button>
          );
        })}
      </div>
      {selecionados.map((id) => (
        <input key={id} type="hidden" name="servicoIds" value={id} />
      ))}

      {totalCentavos > 0 && (
        <p className="text-lime-600 font-semibold mb-3">Total: {formatarReais(totalCentavos)}</p>
      )}

      <p className="text-slate-700 dark:text-slate-200 text-sm font-semibold mb-2">Forma de pagamento:</p>
      <div className="mb-3">
        <SeletorFormaPagamento />
      </div>

      {estado.erro && <p className="text-red-600 text-sm mb-3">{estado.erro}</p>}

      <button
        type="submit"
        disabled={pendente}
        className="rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-60 px-4 py-2 font-semibold"
      >
        {pendente ? "Concluindo..." : "Concluir atendimento"}
      </button>
    </form>
  );
}
