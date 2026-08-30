import { prisma } from "@/lib/prisma";
import { ClienteAvaliacaoRow } from "./cliente-avaliacao-row";

const MINUTOS_MINIMO = 45;
const HORAS_MAXIMO = 12;

export const dynamic = "force-dynamic";

export default async function PedirAvaliacaoPage() {
  const agora = new Date();
  const limiteMinimo = new Date(agora.getTime() - MINUTOS_MINIMO * 60 * 1000);
  const limiteMaximo = new Date(agora.getTime() - HORAS_MAXIMO * 60 * 60 * 1000);

  const atendimentos = await prisma.atendimento.findMany({
    where: {
      status: "CONCLUIDO",
      concluidoEm: { lte: limiteMinimo, gte: limiteMaximo },
      barbeiroId: { not: null },
      cliente: { telefone: { not: null } },
    },
    include: { cliente: true, barbeiro: true, servicos: true },
    orderBy: { concluidoEm: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Pedir Avaliação</h1>
      <p className="text-neutral-400 dark:text-neutral-500 text-sm mb-6">
        Clientes que terminaram o atendimento entre {MINUTOS_MINIMO} minutos e {HORAS_MAXIMO} horas atrás — a hora
        certa de pedir pra eles avaliarem o serviço, com uma mensagem já pronta pra mandar no WhatsApp.
      </p>

      <div className="space-y-2">
        {atendimentos.map((a) => (
          <ClienteAvaliacaoRow
            key={a.id}
            nome={a.cliente.nome}
            telefone={a.cliente.telefone!}
            barbeiroNome={a.barbeiro!.nome}
            servicos={a.servicos.map((s) => s.nomeSnapshot)}
            minutosAtras={Math.floor((agora.getTime() - a.concluidoEm!.getTime()) / 60000)}
          />
        ))}
        {atendimentos.length === 0 && (
          <p className="text-neutral-400 dark:text-neutral-500 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
            Nenhum cliente nessa janela de tempo agora — volte a checar daqui a pouco.
          </p>
        )}
      </div>
    </div>
  );
}
