import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatarReais } from "@/lib/format";

function inicioDoDia() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function AdminHomePage() {
  const inicio = inicioDoDia();

  const [aguardando, emAtendimento, atendimentosHoje, barbeirosAtivos] = await Promise.all([
    prisma.atendimento.count({ where: { status: "AGUARDANDO" } }),
    prisma.atendimento.count({ where: { status: "EM_ATENDIMENTO" } }),
    prisma.atendimento.findMany({
      where: { status: "CONCLUIDO", concluidoEm: { gte: inicio } },
    }),
    prisma.barbeiro.count({ where: { ativo: true } }),
  ]);

  const faturamentoHoje = atendimentosHoje.reduce((s, a) => s + a.precoTotalCentavos, 0);

  const cards = [
    { label: "Faturamento hoje", valor: formatarReais(faturamentoHoje) },
    { label: "Atendimentos hoje", valor: String(atendimentosHoje.length) },
    { label: "Na fila agora", valor: String(aguardando) },
    { label: "Em atendimento", valor: String(emAtendimento) },
    { label: "Barbeiros ativos", valor: String(barbeirosAtivos) },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Visão geral</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <p className="text-neutral-400 text-sm">{c.label}</p>
            <p className="text-2xl font-bold text-amber-400">{c.valor}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <Link href="/admin/financeiro" className="text-amber-400 hover:underline text-sm">
          Ver relatório financeiro completo →
        </Link>
        <Link href="/fila" className="text-amber-400 hover:underline text-sm">
          Abrir painel da fila →
        </Link>
      </div>
    </div>
  );
}
