import { headers } from "next/headers";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { iniciarAgendamento } from "@/lib/actions/agenda";
import { cancelarAtendimento } from "@/lib/actions/fila";
import { AgendaQr } from "./agenda-qr";

export const dynamic = "force-dynamic";

function formatarDiaLabel(data: Date, hoje: Date) {
  const diffDias = Math.round((data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  const dataFormatada = data.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
  if (diffDias === 0) return `Hoje — ${dataFormatada}`;
  if (diffDias === 1) return `Amanhã — ${dataFormatada}`;
  return dataFormatada;
}

export default async function AgendaPage() {
  const session = await requireSession(["ADMIN"]);

  const agora = new Date();
  const hoje = new Date(agora);
  hoje.setHours(0, 0, 0, 0);

  const agendamentos = await prisma.atendimento.findMany({
    where: {
      barbeariaId: session.barbeariaId,
      status: { in: ["AGUARDANDO", "EM_ATENDIMENTO"] },
      horarioAgendado: { gte: hoje },
    },
    include: { cliente: true, barbeiro: true, servicoAgendado: true },
    orderBy: { horarioAgendado: "asc" },
  });

  const porDia = new Map<string, typeof agendamentos>();
  for (const a of agendamentos) {
    const chave = a.horarioAgendado!.toISOString().slice(0, 10);
    porDia.set(chave, [...(porDia.get(chave) ?? []), a]);
  }

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocolo = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocolo}://${host}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <Link href="/admin/agenda-configuracoes" className="text-sm text-orange-600 dark:text-orange-400 hover:underline">
          ⚙️ Configurações do agendamento
        </Link>
      </div>
      <p className="text-neutral-400 dark:text-neutral-500 text-sm mb-6">
        Horários marcados pelo link de agendamento. Horário de cada barbeiro e duração de cada serviço ficam em{" "}
        <strong>Configurações do agendamento</strong> — é a partir dos dois que a agenda calcula o que está
        disponível.
      </p>

      <div className="mb-8 max-w-xs">
        <AgendaQr baseUrl={baseUrl} barbeariaSlug={session.barbeariaSlug} />
      </div>

      <div className="space-y-6">
        {[...porDia.entries()].map(([dia, itens]) => (
          <section key={dia}>
            <h2 className="text-lg font-semibold mb-3 capitalize">
              {formatarDiaLabel(new Date(`${dia}T00:00:00`), hoje)}
            </h2>
            <div className="space-y-2">
              {itens.map((a) => {
                const horario = a.horarioAgendado!.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-orange-600 dark:text-orange-400 w-16 shrink-0">{horario}</span>
                      <div>
                        <p className="font-semibold text-neutral-900 dark:text-white">
                          {a.cliente.nome}
                          {a.status === "EM_ATENDIMENTO" && (
                            <span className="ml-2 inline-block rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 text-xs font-medium px-2 py-0.5 align-middle">
                              Em atendimento
                            </span>
                          )}
                        </p>
                        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                          {a.servicoAgendado?.nome ?? "Serviço"} · {a.barbeiro?.nome ?? "—"} · {a.cliente.telefone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {a.status === "AGUARDANDO" && (
                        <form action={iniciarAgendamento.bind(null, a.id)}>
                          <button className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm px-3 py-1.5">
                            Iniciar atendimento
                          </button>
                        </form>
                      )}
                      {a.status === "AGUARDANDO" && (
                        <form action={cancelarAtendimento.bind(null, a.id)}>
                          <button className="text-neutral-400 dark:text-neutral-500 hover:text-red-600 text-sm">Cancelar</button>
                        </form>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
        {porDia.size === 0 && (
          <p className="text-neutral-400 dark:text-neutral-500">Nenhum horário agendado por enquanto.</p>
        )}
      </div>
    </div>
  );
}
