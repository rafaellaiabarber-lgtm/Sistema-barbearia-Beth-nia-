"use client";

import { excluirAtendimento } from "@/lib/actions/atendimentos";

export function BotaoExcluirAtendimento({ atendimentoId }: { atendimentoId: string }) {
  return (
    <form
      action={excluirAtendimento.bind(null, atendimentoId)}
      onSubmit={(e) => {
        if (!confirm("Excluir este atendimento? Essa ação não pode ser desfeita.")) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="text-neutral-400 dark:text-neutral-500 hover:text-red-600 text-sm">
        Excluir
      </button>
    </form>
  );
}
