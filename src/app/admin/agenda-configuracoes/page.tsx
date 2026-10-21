import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { JornadaForm } from "../barbeiros/jornada-form";
import { DuracaoServicoForm } from "./duracao-servico-form";
import { BloqueioAdminForm } from "./bloqueio-admin-form";
import { BloqueioRow } from "../../(barbeiro)/meus-horarios-bloqueados/bloqueio-row";

export const dynamic = "force-dynamic";

export default async function AgendaConfiguracoesPage() {
  const session = await requireSession(["ADMIN"]);

  const [servicos, barbeiros, bloqueios] = await Promise.all([
    prisma.servico.findMany({
      where: { ativo: true, barbeariaId: session.barbeariaId },
      orderBy: { nome: "asc" },
    }),
    prisma.barbeiro.findMany({
      where: { ativo: true, barbeariaId: session.barbeariaId },
      include: { jornadas: true },
      orderBy: { nome: "asc" },
    }),
    prisma.bloqueioAgenda.findMany({
      where: { barbeariaId: session.barbeariaId, fim: { gte: new Date() } },
      include: { barbeiro: true },
      orderBy: { inicio: "asc" },
    }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h1 className="text-2xl font-bold">Configurações do agendamento</h1>
        <Link href="/admin/agenda" className="text-sm text-orange-600 dark:text-orange-400 hover:underline">
          ← Voltar pra Agenda
        </Link>
      </div>
      <p className="text-neutral-400 dark:text-neutral-500 text-sm mb-8">
        Tudo que a Agenda usa pra calcular os horários disponíveis, num lugar só: quanto tempo cada serviço demora e
        em quais dias/horas cada barbeiro atende.
      </p>

      <h2 className="text-lg font-semibold mb-1">Duração de cada serviço</h2>
      <p className="text-neutral-400 dark:text-neutral-500 text-xs mb-3">
        Define de quanto em quanto tempo os horários se abrem pra cada serviço — se o corte dura 30 min, os
        horários saem de 30 em 30 min, sem bater um em cima do outro.
      </p>
      <div className="space-y-2 mb-10">
        {servicos.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 shadow-sm"
          >
            <p className="font-medium text-sm">{s.nome}</p>
            <DuracaoServicoForm servicoId={s.id} duracaoMinutos={s.duracaoMinutos} />
          </div>
        ))}
        {servicos.length === 0 && (
          <p className="text-neutral-400 dark:text-neutral-500 text-sm">
            Nenhum serviço ativo ainda — cadastre em{" "}
            <Link href="/admin/servicos" className="text-orange-600 dark:text-orange-400 hover:underline">
              Serviços
            </Link>
            .
          </p>
        )}
      </div>

      <h2 className="text-lg font-semibold mb-1">Horário de atendimento de cada barbeiro</h2>
      <p className="text-neutral-400 dark:text-neutral-500 text-xs mb-3">
        Dias da semana, horário de início/fim e almoço — é isso que define quando cada barbeiro aparece disponível
        pra marcar horário.
      </p>
      <div className="space-y-2">
        {barbeiros.map((b) => (
          <div
            key={b.id}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm"
          >
            <p className="font-semibold mb-1">{b.nome}</p>
            <JornadaForm barbeiroId={b.id} jornadas={b.jornadas} />
          </div>
        ))}
        {barbeiros.length === 0 && (
          <p className="text-neutral-400 dark:text-neutral-500 text-sm">
            Nenhum barbeiro ativo ainda — cadastre em{" "}
            <Link href="/admin/barbeiros" className="text-orange-600 dark:text-orange-400 hover:underline">
              Barbeiros
            </Link>
            .
          </p>
        )}
      </div>

      <h2 className="text-lg font-semibold mb-1 mt-10">Bloqueios de agenda</h2>
      <p className="text-neutral-400 dark:text-neutral-500 text-xs mb-3">
        Períodos em que um barbeiro não vai atender (consulta, viagem, folga) — somem da lista de horários livres
        pra quem for marcar pelo link. Cada barbeiro também pode bloquear a própria agenda pelo painel dele.
      </p>
      <BloqueioAdminForm barbeiros={barbeiros.map((b) => ({ id: b.id, nome: b.nome }))} />
      <div className="space-y-2">
        {bloqueios.map((b) => (
          <BloqueioRow key={b.id} id={b.id} inicio={b.inicio} fim={b.fim} motivo={b.motivo} barbeiroNome={b.barbeiro.nome} />
        ))}
        {bloqueios.length === 0 && <p className="text-neutral-400 dark:text-neutral-500 text-sm">Nenhum bloqueio futuro.</p>}
      </div>
    </div>
  );
}
