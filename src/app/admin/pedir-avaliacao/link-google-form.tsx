"use client";

import { useActionState, useState } from "react";
import { salvarLinkAvaliacaoGoogle, type ConfiguracaoAvaliacaoState } from "@/lib/actions/avaliacao";

const estadoInicial: ConfiguracaoAvaliacaoState = {};

export function LinkGoogleForm({ linkAtual }: { linkAtual: string | null }) {
  const [estado, formAction, pendente] = useActionState(salvarLinkAvaliacaoGoogle, estadoInicial);
  const [aberto, setAberto] = useState(!linkAtual);

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm mb-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold mb-1">Link de avaliação do Google</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            {linkAtual
              ? "Esse link vai junto na mensagem, pra o cliente avaliar direto no Google."
              : "Ainda não configurado — sem ele, a mensagem só pede a opinião pelo WhatsApp mesmo."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAberto((a) => !a)}
          className="text-orange-600 dark:text-orange-400 text-sm hover:underline shrink-0"
        >
          {aberto ? "Fechar" : linkAtual ? "Trocar link" : "Configurar"}
        </button>
      </div>

      {aberto && (
        <form action={formAction} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              Link de avaliação (do Google Meu Negócio / Google Maps)
            </label>
            <input
              name="linkGoogle"
              defaultValue={linkAtual ?? ""}
              placeholder="https://g.page/r/..."
              className="w-full rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={pendente}
            className="rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-semibold px-4 py-2 text-sm"
          >
            {pendente ? "Salvando..." : "Salvar"}
          </button>
          {estado.erro && <p className="text-red-600 text-sm w-full">{estado.erro}</p>}
          <p className="text-neutral-400 dark:text-neutral-500 text-xs w-full">
            Pra achar esse link: procure "Barbearia Bethânia" no Google, abra o perfil do negócio e clique em
            "Pedir avaliações" (ou, no Google Maps, no botão de compartilhar do local) — copie o link que aparece e
            cole aqui.
          </p>
        </form>
      )}
    </div>
  );
}
