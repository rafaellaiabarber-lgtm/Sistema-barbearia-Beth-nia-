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
                ? "bg-blue-600 text-white border-blue-600 font-semibold"
                : "border-slate-300 text-slate-700 hover:bg-slate-100"
            }`}
          >
            {a.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-slate-500 text-sm">Faturamento total</p>
          <p className="text-2xl font-bold text-blue-600">{formatarReais(totalCentavos)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-slate-500 text-sm">Atendimentos concluídos</p>
          <p className="text-2xl font-bold text-blue-600">{atendimentos.length}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3">Por barbeiro</h2>
      <div className="space-y-2 mb-8">
        {[...porBarbeiro.values()].map((b) => {
          const comissao = Math.round((b.totalCentavos * b.comissaoPercentual) / 100);
          return (
            <div
              key={b.nome}
              className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
            >
              <div>
                <p className="font-semibold">{b.nome}</p>
                <p className="text-slate-500 text-sm">
                  {b.qtd} atendimento(s) · comissão {b.comissaoPercentual}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-blue-600 font-semibold">{formatarReais(b.totalCentavos)}</p>
                <p className="text-slate-500 text-sm">comissão: {formatarReais(comissao)}</p>
              </div>
            </div>
          );
        })}
        {porBarbeiro.size === 0 && <p className="text-slate-400">Nenhum atendimento no período.</p>}
      </div>

      <h2 className="text-lg font-semibold mb-3">Atendimentos</h2>
      <div className="space-y-2">
        {atendimentos.map((a) => (
          <div key={a.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 text-sm shadow-sm">
            <div>
              <p className="text-slate-800">
                {a.cliente.nome} — {a.servicos.map((s) => s.nomeSnapshot).join(", ")}
              </p>
              <p className="text-slate-400">
                {a.barbeiro?.nome ?? "—"} · {a.concluidoEm?.toLocaleString("pt-BR")}
              </p>
            </div>
            <p className="text-blue-600 font-semibold">{formatarReais(a.precoTotalCentavos)}</p>
          </div>
        ))}
        {atendimentos.length === 0 && <p className="text-slate-400">Nenhum atendimento no período.</p>}
      </div>
    </div>
  );
}
