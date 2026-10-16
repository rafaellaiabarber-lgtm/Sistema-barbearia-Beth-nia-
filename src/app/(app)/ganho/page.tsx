import { requireUsuario } from "@/lib/session";
import { buscarRegistros, diasAtras } from "@/lib/cronometro-server";
import { CalculadoraGanho } from "@/components/calculadora-ganho";

export default async function GanhoPage() {
  const eu = await requireUsuario();
  const registros = await buscarRegistros({ usuarioId: eu.id, desde: diasAtras(30) });
  const mediaSegundos = registros.length > 0 ? registros.reduce((s, r) => s + r.segundosTotal, 0) / registros.length : null;

  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-300">
        Quanto você fatura a mais por mês cortando mais rápido — com o mesmo dia de trabalho.
      </p>
      <CalculadoraGanho
        tempoAtualMinutos={mediaSegundos ? Math.round(mediaSegundos / 60) : 45}
        ticketMedioReais={45}
        comissaoPercentual={50}
        origemTempo={
          mediaSegundos ? `Sua média em ${registros.length} cortes (30 dias)` : "Exemplo — cronometre cortes pra usar o seu"
        }
        origemTicket="Ajuste pro valor do seu corte"
      />
    </div>
  );
}
