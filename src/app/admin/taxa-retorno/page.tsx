import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { ClienteInativoRow } from "../gerente-virtual/cliente-inativo-row";

const PRESETS = [20, 30, 40, 60];

export const dynamic = "force-dynamic";

export default async function TaxaRetornoPage({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string }>;
}) {
  const session = await requireSession(["ADMIN"]);
  const { dias: diasParam } = await searchParams;
  const dias = Math.max(1, Number.parseInt(diasParam ?? "30", 10) || 30);

  const agora = new Date();
  const limite = new Date(agora);
  limite.setDate(limite.getDate() - dias);

  const clientesComAtendimento = await prisma.cliente.findMany({
    where: { barbeariaId: session.barbeariaId, atendimentos: { some: { status: "CONCLUIDO" } } },
    include: { atendimentos: { where: { status: "CONCLUIDO" }, select: { concluidoEm: true } } },
  });

  function diasDesde(data: Date) {
    return Math.floor((agora.getTime() - data.getTime()) / (1000 * 60 * 60 * 24));
  }

  const clientesSemRetorno = clientesComAtendimento
    .map((c) => {
      const ultimaVisita = c.atendimentos.reduce<Date | null>((max, a) => {
        if (!a.concluidoEm) return max;
        return !max || a.concluidoEm > max ? a.concluidoEm : max;
      }, null);
      return { id: c.id, nome: c.nome, telefone: c.telefone, ultimaVisita, qtdVisitas: c.atendimentos.length };
    })
    .filter((c) => c.telefone && c.ultimaVisita && c.ultimaVisita < limite)
    .sort((a, b) => (a.ultimaVisita && b.ultimaVisita ? a.ultimaVisita.getTime() - b.ultimaVisita.getTime() : 0));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Taxa de Retorno</h1>
      <p className="text-neutral-400 dark:text-neutral-500 text-sm mb-6">
        Clientes que já cortaram com a gente antes, mas não voltam há um tempo. Escolha o intervalo e já aparece
        quem entrar em contato — com o link pronto pra chamar no WhatsApp.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        {PRESETS.map((p) => (
          <Link
            key={p}
            href={`/admin/taxa-retorno?dias=${p}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium border ${
              dias === p
                ? "bg-orange-600 border-orange-600 text-white"
                : "bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300 hover:border-neutral-400"
            }`}
          >
            {p} dias
          </Link>
        ))}

        <form method="get" className="flex items-center gap-2 ml-2">
          <label className="text-neutral-500 dark:text-neutral-400 text-sm">Outro:</label>
          <input
            type="number"
            name="dias"
            defaultValue={PRESETS.includes(dias) ? "" : dias}
            min={1}
            placeholder="dias"
            className="w-20 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-2 py-1.5 text-sm"
          />
          <button type="submit" className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-3 py-1.5">
            Filtrar
          </button>
        </form>
      </div>

      <h2 className="text-lg font-semibold mb-3">
        Sem voltar há mais de {dias} dias ({clientesSemRetorno.length})
      </h2>
      <div className="space-y-2">
        {clientesSemRetorno.map((c) => (
          <ClienteInativoRow
            key={c.id}
            nome={c.nome}
            telefone={c.telefone!}
            diasSemVoltar={diasDesde(c.ultimaVisita!)}
            qtdVisitas={c.qtdVisitas}
          />
        ))}
        {clientesSemRetorno.length === 0 && (
          <p className="text-neutral-400 dark:text-neutral-500 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
            Nenhum cliente sem voltar há mais de {dias} dias — ótimo sinal!
          </p>
        )}
      </div>
    </div>
  );
}
