import Link from "next/link";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { calcularIntervalo } from "@/lib/periodo";
import { NovaIndicacaoForm } from "./nova-indicacao-form";
import { IndicacaoRow } from "./indicacao-row";
import { ThemeToggle } from "../theme-toggle";

export default async function IndicacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; barbeiroId?: string }>;
}) {
  const session = await requireSession(["ADMIN", "BARBEIRO"]);
  const souAdmin = session.role === "ADMIN";

  const { status, barbeiroId: barbeiroIdParam } = await searchParams;
  const statusFiltro = status === "contatadas" || status === "pendentes" ? status : "todas";

  const barbeiros = souAdmin
    ? await prisma.barbeiro.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } })
    : [];

  const barbeiroFiltro = souAdmin ? barbeiroIdParam || undefined : (session.barbeiroId ?? "__nenhum__");

  const indicacoes = await prisma.indicacao.findMany({
    where: {
      barbeiroId: barbeiroFiltro,
      ...(statusFiltro === "contatadas" ? { contatada: true } : {}),
      ...(statusFiltro === "pendentes" ? { contatada: false } : {}),
    },
    include: { barbeiro: true },
    orderBy: { criadoEm: "desc" },
  });

  const semana = calcularIntervalo("semana", new Date());
  const totalPendentes = indicacoes.filter((i) => !i.contatada).length;
  const totalSemana = indicacoes.filter((i) => i.criadoEm >= semana.inicio && i.criadoEm <= semana.fim).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Indicações</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Contatos indicados por clientes — use pra preencher os horários vazios.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800" />
          <Link href="/ranking" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
            Ranking
          </Link>
          <Link href={session.role === "ADMIN" ? "/admin" : "/fila"} className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
            {session.role === "ADMIN" ? "Painel admin" : "Voltar pra fila"}
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-2xl font-bold text-blue-600">{totalPendentes}</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Pendente(s)</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">{totalSemana}</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Indicações essa semana</p>
        </div>
      </div>

      <NovaIndicacaoForm barbeiros={barbeiros} souAdmin={souAdmin} />

      <form method="get" className="flex flex-wrap items-end gap-3 mb-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Status</label>
          <select
            name="status"
            defaultValue={statusFiltro}
            className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900"
          >
            <option value="todas">Todas</option>
            <option value="pendentes">Pendentes</option>
            <option value="contatadas">Já contatadas</option>
          </select>
        </div>
        {souAdmin && (
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Barbeiro</label>
            <select
              name="barbeiroId"
              defaultValue={barbeiroIdParam ?? ""}
              className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900"
            >
              <option value="">Todos</option>
              {barbeiros.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
            </select>
          </div>
        )}
        <button type="submit" className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 text-sm">
          Filtrar
        </button>
      </form>

      <div className="space-y-2">
        {indicacoes.map((i) => (
          <IndicacaoRow
            key={i.id}
            id={i.id}
            nome={i.nome}
            telefone={i.telefone}
            contatada={i.contatada}
            convertida={i.convertida}
            barbeiroNome={souAdmin ? i.barbeiro.nome : null}
            criadoEm={i.criadoEm}
          />
        ))}
        {indicacoes.length === 0 && <p className="text-slate-400 dark:text-slate-500">Nenhuma indicação por aqui ainda.</p>}
      </div>
    </div>
  );
}
