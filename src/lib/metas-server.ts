import "server-only";
import { prisma } from "@/lib/prisma";
import { calcularIntervalo } from "@/lib/periodo";
import { valorAtualPorTipo, type ProgressoBarbeiro } from "@/lib/metas";
import { comissaoServicos, comissaoProdutos } from "@/lib/comissao";

export type MetaComNiveis = {
  id: string;
  barbeariaId: string | null;
  barbeiroId: string;
  tipo: string;
  ativa: boolean;
  dataInicio: Date | null;
  dataFim: Date | null;
  servicoId: string | null;
  produtoId: string | null;
  niveis: { id: string; ordem: number; nome: string; valorAlvo: number; bonificacaoCentavos: number }[];
};

export async function calcularProgressoMeta(meta: MetaComNiveis, comissaoPadraoBarbeiro: number): Promise<number> {
  const periodo =
    meta.dataInicio && meta.dataFim
      ? { inicio: meta.dataInicio, fim: meta.dataFim }
      : calcularIntervalo("mes", new Date());

  if (meta.tipo === "VENDAS_PRODUTO") {
    const resultado = await prisma.vendaProduto.aggregate({
      where: {
        barbeariaId: meta.barbeariaId,
        barbeiroId: meta.barbeiroId,
        criadoEm: { gte: periodo.inicio, lte: periodo.fim },
        ...(meta.produtoId ? { produtoId: meta.produtoId } : {}),
      },
      _sum: { totalCentavos: true },
    });
    return resultado._sum.totalCentavos ?? 0;
  }

  const progresso: ProgressoBarbeiro = {
    faturamentoCentavos: 0,
    comissaoCentavos: 0,
    qtdAtendimentos: 0,
    clientesNovos: 0,
    vendasProdutoCentavos: 0,
  };

  if (meta.servicoId) {
    // Meta restrita a um serviço específico: soma só a fatia daquele serviço
    // dentro dos atendimentos, não o total do atendimento (que pode incluir outros serviços).
    const itens = await prisma.atendimentoServico.findMany({
      where: {
        barbeariaId: meta.barbeariaId,
        servicoId: meta.servicoId,
        atendimento: {
          status: "CONCLUIDO",
          barbeiroId: meta.barbeiroId,
          concluidoEm: { gte: periodo.inicio, lte: periodo.fim },
        },
      },
      include: { atendimento: { include: { cliente: true } } },
    });
    const clientesNovosIds = new Set<string>();
    for (const item of itens) {
      progresso.faturamentoCentavos += item.precoCentavos;
      progresso.comissaoCentavos += comissaoServicos([item], comissaoPadraoBarbeiro);
      progresso.qtdAtendimentos += 1;
      const cliente = item.atendimento.cliente;
      if (cliente.criadoEm >= periodo.inicio && cliente.criadoEm <= periodo.fim) {
        clientesNovosIds.add(cliente.id);
      }
    }
    progresso.clientesNovos = clientesNovosIds.size;
  } else {
    const atendimentos = await prisma.atendimento.findMany({
      where: {
        barbeariaId: meta.barbeariaId,
        status: "CONCLUIDO",
        barbeiroId: meta.barbeiroId,
        concluidoEm: { gte: periodo.inicio, lte: periodo.fim },
      },
      include: { cliente: true, servicos: true },
    });
    for (const a of atendimentos) {
      progresso.faturamentoCentavos += a.precoTotalCentavos;
      progresso.comissaoCentavos += comissaoServicos(a.servicos, comissaoPadraoBarbeiro);
      progresso.qtdAtendimentos += 1;
      if (a.cliente.criadoEm >= periodo.inicio && a.cliente.criadoEm <= periodo.fim) {
        progresso.clientesNovos += 1;
      }
    }

    if (meta.tipo === "FATURAMENTO") {
      // A comissão do barbeiro também inclui as vendas de produto, não só os serviços.
      const vendasProduto = await prisma.vendaProduto.findMany({
        where: { barbeariaId: meta.barbeariaId, barbeiroId: meta.barbeiroId, criadoEm: { gte: periodo.inicio, lte: periodo.fim } },
      });
      progresso.comissaoCentavos += comissaoProdutos(vendasProduto);
    }
  }

  return valorAtualPorTipo(meta.tipo, progresso);
}
