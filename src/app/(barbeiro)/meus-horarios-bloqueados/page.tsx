import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NovoBloqueioForm } from "./novo-bloqueio-form";
import { BloqueioRow } from "./bloqueio-row";

export default async function MeusHorariosBloqueadosPage() {
  const session = await requireSession(["ADMIN", "BARBEIRO"]);

  if (!session.barbeiroId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">Bloquear agenda</h1>
        <p className="text-neutral-500 dark:text-neutral-400">Essa área é só para o perfil de barbeiro.</p>
      </div>
    );
  }

  const bloqueios = await prisma.bloqueioAgenda.findMany({
    where: { barbeiroId: session.barbeiroId, barbeariaId: session.barbeariaId, fim: { gte: new Date() } },
    orderBy: { inicio: "asc" },
  });

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Bloquear agenda</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          Marque um período em que você não vai atender (consulta, viagem, folga) — esses horários somem da lista
          de horários livres de quem for marcar pelo link de agendamento.
        </p>
      </header>

      <NovoBloqueioForm />

      <div className="space-y-2">
        {bloqueios.map((b) => (
          <BloqueioRow key={b.id} id={b.id} inicio={b.inicio} fim={b.fim} motivo={b.motivo} />
        ))}
        {bloqueios.length === 0 && <p className="text-neutral-400 dark:text-neutral-500">Nenhum bloqueio futuro.</p>}
      </div>
    </div>
  );
}
