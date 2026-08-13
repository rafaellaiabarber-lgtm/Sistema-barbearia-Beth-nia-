import "server-only";
import { prisma } from "@/lib/prisma";
import { type ItemProgresso } from "@/lib/campanhas";

export async function buscarQuantidadeAtualItem(
  item: { produtoId: string | null; servicoId: string | null },
  barbeiroId: string,
  desde: Date
): Promise<number> {
  if (item.produtoId) {
    const resultado = await prisma.vendaProduto.aggregate({
      where: { produtoId: item.produtoId, barbeiroId, criadoEm: { gte: desde } },
      _sum: { quantidade: true },
    });
    return resultado._sum.quantidade ?? 0;
  }
  if (item.servicoId) {
    return prisma.atendimentoServico.count({
      where: {
        servicoId: item.servicoId,
        atendimento: { barbeiroId, status: "CONCLUIDO", concluidoEm: { gte: desde } },
      },
    });
  }
  return 0;
}

export async function buscarCampanhasAtivasComProgresso(barbeiroId: string) {
  const campanhas = await prisma.campanhaVenda.findMany({
    where: { barbeiroId, ativa: true },
    include: { itens: { include: { produto: true, servico: true } } },
    orderBy: { criadoEm: "asc" },
  });

  return Promise.all(
    campanhas.map(async (c) => {
      const itens: ItemProgresso[] = await Promise.all(
        c.itens.map(async (item) => ({
          itemId: item.id,
          nome: item.produto?.nome ?? item.servico?.nome ?? "?",
          quantidadeAlvo: item.quantidadeAlvo,
          quantidadeAtual: await buscarQuantidadeAtualItem(item, barbeiroId, c.criadoEm),
          precoCentavos: item.produto?.precoCentavos ?? item.servico?.precoCentavos ?? 0,
        }))
      );
      return { id: c.id, titulo: c.titulo, itens };
    })
  );
}

export async function buscarTodasCampanhasAtivasComProgresso() {
  const campanhas = await prisma.campanhaVenda.findMany({
    where: { ativa: true },
    include: { barbeiro: true, itens: { include: { produto: true, servico: true } } },
    orderBy: [{ barbeiro: { nome: "asc" } }, { criadoEm: "asc" }],
  });

  return Promise.all(
    campanhas.map(async (c) => {
      const itens: ItemProgresso[] = await Promise.all(
        c.itens.map(async (item) => ({
          itemId: item.id,
          nome: item.produto?.nome ?? item.servico?.nome ?? "?",
          quantidadeAlvo: item.quantidadeAlvo,
          quantidadeAtual: await buscarQuantidadeAtualItem(item, c.barbeiroId, c.criadoEm),
          precoCentavos: item.produto?.precoCentavos ?? item.servico?.precoCentavos ?? 0,
        }))
      );
      return { id: c.id, titulo: c.titulo, barbeiroNome: c.barbeiro.nome, itens };
    })
  );
}
