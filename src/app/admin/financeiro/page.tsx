import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatarReais } from "@/lib/format";

type Periodo = "hoje" | "semana" | "mes";

function calcularIntervalo(periodo: Periodo) {
  const agora = new Date();
  const inicio = new Date(agora);
  inicio.setHours(0, 0, 0, 0);

  if (periodo === "semana") {
    const diaSemana = inicio.getDay();
    inicio.setDate(inicio.getDate() - diaSemana);
  } else if (periodo === "mes") {
    inicio.setDate(1);
  }

  return { inicio, fim: agora };
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo: periodoParam } = await searchParams;
  const periodo: Periodo =
    periodoParam === "semana" || periodoParam === "mes" ? periodoParam : "hoje";
  const { inicio, fim } = calcularIntervalo(periodo);

  const atendimentos = await prisma.atendimento.findMany({
    where: { status: "CONCLUIDO", concluidoEm: { gte: inicio, lte: fim } },
    include: { barbeiro: true, cliente: true, servicos: true },
    orderBy: { concluidoEm: "desc" },
  });

  const totalCentavos = atendimentos.reduce((s, a) => s + a.precoTotalCentavos, 0);

  const porBarbeiro = new Map<
    string,
    { nome: string; comissaoPercentual: number; totalCentavos: number; qtd: number }
  >();
  for (const a of atendimentos) {
    if (!a.barbeiro) continue;
    const atual = porBarbeiro.get(a.barbeiro.id) ?? {
      nome: a.barbeiro.nome,
      comissaoPercentual: a.barbeiro.comissaoPercentual,
      totalCentavos: 0,
      qtd: 0,
    };
    atual.totalCentavos += a.precoTotalCentavos;
    atual.qtd += 1;
    porBarbeiro.set(a.barbeiro.id, atual);
  }

  const abas: { valor: Periodo; label: string }[] = [
    { valor: "hoje", label: "Hoje" },
    { valor: "semana", label: "Esta semana" },
    { valor: "mes", label: "Este mês" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Financeiro</h1>

      <div className="flex gap-2 mb-6">
        {abas.map((a) => (
          <Link
            key={a.valor}
            href={`/admin/financeiro?periodo=${a.valor}`}
            className={`rounded-lg px-4 py-2 text-sm border ${
              periodo === a.valor
                ? "bg-amber-500 text-neutral-950 border-amber-500 font-semibold"
                : "border-neutral-700 text-neutral-300 hover:bg-neutral-900"
            }`}
          >
            {a.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <p className="text-neutral-400 text-sm">Faturamento total</p>
          <p className="text-2xl font-bold text-amber-400">{formatarReais(totalCentavos)}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <p className="text-neutral-400 text-sm">Atendimentos concluídos</p>
          <p className="text-2xl font-bold text-amber-400">{atendimentos.length}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3">Por barbeiro</h2>
      <div className="space-y-2 mb-8">
        {[...porBarbeiro.values()].map((b) => {
          const comissao = Math.round((b.totalCentavos * b.comissaoPercentual) / 100);
          return (
            <div
              key={b.nome}
              className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-xl p-4"
            >
              <div>
                <p className="font-semibold">{b.nome}</p>
                <p className="text-neutral-400 text-sm">
                  {b.qtd} atendimento(s) · comissão {b.comissaoPercentual}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-amber-400 font-semibold">{formatarReais(b.totalCentavos)}</p>
                <p className="text-neutral-400 text-sm">comissão: {formatarReais(comissao)}</p>
              </div>
            </div>
          );
        })}
        {porBarbeiro.size === 0 && <p className="text-neutral-500">Nenhum atendimento no período.</p>}
      </div>

      <h2 className="text-lg font-semibold mb-3">Atendimentos</h2>
      <div className="space-y-2">
        {atendimentos.map((a) => (
          <div key={a.id} className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm">
            <div>
              <p className="text-neutral-200">
                {a.cliente.nome} — {a.servicos.map((s) => s.nomeSnapshot).join(", ")}
              </p>
              <p className="text-neutral-500">
                {a.barbeiro?.nome ?? "—"} · {a.concluidoEm?.toLocaleString("pt-BR")}
              </p>
            </div>
            <p className="text-amber-400 font-semibold">{formatarReais(a.precoTotalCentavos)}</p>
          </div>
        ))}
        {atendimentos.length === 0 && <p className="text-neutral-500">Nenhum atendimento no período.</p>}
      </div>
    </div>
  );
}
