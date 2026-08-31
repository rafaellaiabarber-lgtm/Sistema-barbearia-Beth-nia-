import { prisma } from "@/lib/prisma";

export function limitesCompetencia(competencia: string) {
  const [ano, mes] = competencia.split("-").map(Number);
  const inicio = new Date(ano, mes - 1, 1, 0, 0, 0, 0);
  const fim = new Date(ano, mes, 0, 23, 59, 59, 999);
  return { inicio, fim };
}

export type ItemPote = { barbeiroId: string; nome: string; fichas: number; valorCentavos: number };

export async function calcularPote(
  barbeariaId: string,
  competencia: string
): Promise<{
  totalPoteCentavos: number;
  totalFichas: number;
  itens: ItemPote[];
}> {
  const { inicio, fim } = limitesCompetencia(competencia);

  const [pagamentos, atendimentos, barbeiros] = await Promise.all([
    prisma.pagamentoAssinatura.findMany({ where: { competencia, barbeariaId } }),
    prisma.atendimento.findMany({
      where: { status: "CONCLUIDO", concluidoEm: { gte: inicio, lte: fim }, barbeariaId },
      include: { servicos: { include: { servico: true } } },
    }),
    prisma.barbeiro.findMany({ where: { barbeariaId } }),
  ]);

  const totalPoteCentavos = pagamentos.reduce((s, p) => s + p.valorCentavos, 0);

  // Usa as fichas configuradas hoje em cada serviço (não o valor gravado no momento do atendimento), pra
  // atendimentos já lançados antes de configurar as fichas passarem a contar assim que forem configuradas.
  const fichasPorBarbeiro = new Map<string, number>();
  for (const a of atendimentos) {
    if (!a.barbeiroId) continue;
    const fichas = a.servicos.reduce((s, serv) => s + (serv.servico?.fichas ?? serv.fichas), 0);
    fichasPorBarbeiro.set(a.barbeiroId, (fichasPorBarbeiro.get(a.barbeiroId) ?? 0) + fichas);
  }
  const totalFichas = [...fichasPorBarbeiro.values()].reduce((s, f) => s + f, 0);

  const barbeirosPorId = new Map(barbeiros.map((b) => [b.id, b]));
  const entradas = [...fichasPorBarbeiro.entries()].filter(([, fichas]) => fichas > 0);

  let distribuidoCentavos = 0;
  const itens: ItemPote[] = entradas.map(([barbeiroId, fichas], i) => {
    let valorCentavos: number;
    if (totalFichas === 0) {
      valorCentavos = 0;
    } else if (i === entradas.length - 1) {
      valorCentavos = totalPoteCentavos - distribuidoCentavos;
    } else {
      valorCentavos = Math.round((totalPoteCentavos * fichas) / totalFichas);
      distribuidoCentavos += valorCentavos;
    }
    return { barbeiroId, nome: barbeirosPorId.get(barbeiroId)?.nome ?? "—", fichas, valorCentavos };
  });

  return { totalPoteCentavos, totalFichas, itens };
}
