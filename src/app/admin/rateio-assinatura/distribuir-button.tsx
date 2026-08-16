"use client";

import { useActionState } from "react";
import { distribuirPote, type DistribuirPoteState } from "@/lib/actions/pote";

const estadoInicial: DistribuirPoteState = {};

export function DistribuirButton({ competencia }: { competencia: string }) {
  const acaoComCompetencia = distribuirPote.bind(null, competencia);
  const [estado, formAction, pendente] = useActionState(acaoComCompetencia, estadoInicial);

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pendente}
        className="rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold px-4 py-2 text-sm"
      >
        {pendente ? "Distribuindo..." : "Distribuir comissão do pote"}
      </button>
      {estado.erro && <p className="text-red-600 text-sm mt-2">{estado.erro}</p>}
    </form>
  );
}
