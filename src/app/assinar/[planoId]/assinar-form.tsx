"use client";

import { useActionState } from "react";
import { criarAssinaturaPublica, type AssinaturaState } from "@/lib/actions/assinaturas";

const estadoInicial: AssinaturaState = {};

export function AssinarForm({ planoId }: { planoId: string }) {
  const acaoComId = criarAssinaturaPublica.bind(null, planoId);
  const [estado, formAction, pendente] = useActionState(acaoComId, estadoInicial);

  if (estado.sucesso) {
    return (
      <div className="bg-lime-400 rounded-2xl p-5 w-full text-center">
        <p className="text-black font-bold text-lg">Assinatura registrada! 🎉</p>
        <p className="text-black/70 text-sm mt-2">
          A barbearia vai confirmar seu pagamento e ativar seu plano. Qualquer dúvida, fale com a gente por lá.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="w-full space-y-3">
      <input
        name="nome"
        required
        placeholder="Seu nome"
        className="w-full rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 px-4 py-3 text-center"
      />
      <input
        name="telefone"
        required
        placeholder="Seu telefone (WhatsApp)"
        className="w-full rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 px-4 py-3 text-center"
      />
      {estado.erro && <p className="text-red-400 text-sm text-center">{estado.erro}</p>}
      <button
        type="submit"
        disabled={pendente}
        className="w-full rounded-xl bg-lime-400 hover:bg-lime-300 disabled:opacity-60 text-black font-bold text-lg py-4"
      >
        {pendente ? "Enviando..." : "Assinar esse plano"}
      </button>
    </form>
  );
}
