import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { buscarRegistros, diasAtras } from "@/lib/cronometro-server";
import { CalculadoraGanho } from "./calculadora-ganho";

const TEMPO_PADRAO_MINUTOS = 45;
const TICKET_PADRAO_REAIS = 45;

export default async function GanhoPage() {
  const session = await requireSession(["ADMIN", "BARBEIRO"]);
  const barbeiroId = session.barbeiroId;

  const [registros, atendimentos, barbeiro] = await Promise.all([
    barbeiroId ? buscarRegistros(session.barbeariaId, { barbeiroId, desde: diasAtras(30) }) : Promise.resolve([]),
    barbeiroId
      ? prisma.atendimento.aggregate({
          where: {
            barbeariaId: session.barbeariaId,
            barbeiroId,
            status: "CONCLUIDO",
            precoTotalCentavos: { gt: 0 },
            concluidoEm: { gte: diasAtras(60) },
          },
          _avg: { precoTotalCentavos: true },
          _count: { _all: true },
        })
      : Promise.resolve(null),
    barbeiroId
      ? prisma.barbeiro.findFirst({
          where: { id: barbeiroId, barbeariaId: session.barbeariaId },
          select: { comissaoPercentual: true },
        })
      : Promise.resolve(null),
  ]);

  const mediaSegundos = registros.length > 0 ? registros.reduce((s, r) => s + r.segundosTotal, 0) / registros.length : null;
  const ticketCentavos = atendimentos?._avg.precoTotalCentavos ?? null;

  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-600 dark:text-neutral-300">
        Quanto você fatura a mais por mês cortando mais rápido — com o mesmo dia de trabalho.
      </p>
      <CalculadoraGanho
        tempoAtualMinutos={mediaSegundos ? Math.round(mediaSegundos / 60) : TEMPO_PADRAO_MINUTOS}
        ticketMedioReais={ticketCentavos ? Math.round(ticketCentavos) / 100 : TICKET_PADRAO_REAIS}
        comissaoPercentual={barbeiro?.comissaoPercentual ?? 100}
        origemTempo={
          mediaSegundos ? `Sua média em ${registros.length} cortes (30 dias)` : "Exemplo — cronometre cortes pra usar o seu"
        }
        origemTicket={ticketCentavos ? `Sua média em ${atendimentos!._count._all} atendimentos` : "Exemplo — ajuste pro seu"}
      />
    </div>
  );
}
