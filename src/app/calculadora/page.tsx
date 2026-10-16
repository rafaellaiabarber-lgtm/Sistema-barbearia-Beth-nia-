import type { Metadata } from "next";
import { connection } from "next/server";
import { buscarConfiguracao } from "@/lib/cronometro-server";
import { CalculadoraGanho } from "@/components/calculadora-ganho";

export const metadata: Metadata = {
  title: "Quanto você ganha cortando mais rápido?",
  description: "Calcule quanto dinheiro a mais por mês você fatura reduzindo o tempo de cada corte.",
};

// Página aberta (sem login) pra divulgar o curso: o barbeiro coloca os números dele e vê o ganho.
export default async function CalculadoraPublicaPage() {
  await connection(); // nome do curso sempre atualizado (e o build não precisa de banco pronto)
  const config = await buscarConfiguracao();
  return (
    <main className="flex-1 p-4 sm:p-6">
      <div className="max-w-xl mx-auto space-y-4">
        <header className="text-center pt-4">
          <p className="text-orange-400 text-sm font-semibold">{config.nomeCurso}</p>
          <h1 className="text-3xl font-bold mt-1">Quanto você ganha cortando mais rápido?</h1>
          <p className="text-neutral-400 text-sm mt-2">
            Coloque o seu tempo médio por corte e o valor que você cobra. O resto a gente calcula.
          </p>
        </header>
        <CalculadoraGanho
          tempoAtualMinutos={45}
          ticketMedioReais={45}
          comissaoPercentual={100}
          origemTempo="Quanto tempo leva hoje, do início ao fim"
          origemTicket="Valor médio do seu corte"
        />
      </div>
    </main>
  );
}
