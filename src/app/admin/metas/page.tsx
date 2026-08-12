import { prisma } from "@/lib/prisma";
import { calcularIntervalo } from "@/lib/periodo";
import { LABEL_TIPO_META, valorAtualPorTipo, type ProgressoBarbeiro } from "@/lib/metas";
import { NovaMetaForm } from "./nova-meta-form";
import { MetaCard } from "./meta-card";

type MetaComNiveis = {
  id: string;
  barbeiroId: string;
  tipo: string;
  ativa: boolean;
  dataInicio: Date | null;
  dataFim: Date | null;
  servicoId: string | null;
  produtoId: string | null;
  niveis: { id: string; ordem: number; nome: string; valorAlvo: number; bonificacaoCentavos: number }[];
};

async function calcularProgresso(meta: MetaComNiveis): Promise<number> {
  const periodo =
    meta.dataInicio && meta.dataFim
      ? { inicio: meta.dataInicio, fim: meta.dataFim }
      : calcularIntervalo("mes", new Date());

  if (meta.tipo === "VENDAS_PRODUTO") {
    const resultado = await prisma.vendaProduto.aggregate({
      where: {
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
    qtdAtendimentos: 0,
    clientesNovos: 0,
    vendasProdutoCentavos: 0,
  };

  if (meta.servicoId) {
    // Meta restrita a um serviço específico: soma só a fatia daquele serviço
    // dentro dos atendimentos, não o total do atendimento (que pode incluir outros serviços).
    const itens = await prisma.atendimentoServico.findMany({
      where: {
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
        status: "CONCLUIDO",
        barbeiroId: meta.barbeiroId,
        concluidoEm: { gte: periodo.inicio, lte: periodo.fim },
      },
      include: { cliente: true },
    });
    for (const a of atendimentos) {
      progresso.faturamentoCentavos += a.precoTotalCentavos;
      progresso.qtdAtendimentos += 1;
      if (a.cliente.criadoEm >= periodo.inicio && a.cliente.criadoEm <= periodo.fim) {
        progresso.clientesNovos += 1;
      }
    }
  }

  return valorAtualPorTipo(meta.tipo, progresso);
}

export default async function MetasPage() {
  const [barbeiros, servicos, produtos] = await Promise.all([
    prisma.barbeiro.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      include: {
        metas: {
          include: { niveis: true, servico: true, produto: true },
          orderBy: { criadoEm: "asc" },
        },
      },
    }),
    prisma.servico.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.produto.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  const todasMetas = barbeiros.flatMap((b) => b.metas);
  const progressos = await Promise.all(todasMetas.map((m) => calcularProgresso(m)));
  const progressoPorMeta = new Map(todasMetas.map((m, i) => [m.id, progressos[i]]));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Metas</h1>
      <p className="text-slate-500 text-sm mb-6">
        Crie metas por barbeiro com vários níveis (ex.: Bronze/Prata/Ouro) e bonificações. Por padrão o progresso é
        calculado no mês atual, mas cada meta pode ter seu próprio período de datas e ser restrita a um serviço ou
        produto específico.
      </p>

      <NovaMetaForm barbeiros={barbeiros} servicos={servicos} produtos={produtos} />

      <div className="space-y-6">
        {barbeiros.map((b) => {
          if (b.metas.length === 0) return null;
          return (
            <div key={b.id}>
              <p className="font-semibold text-slate-700 mb-2">{b.nome}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {b.metas.map((meta) => (
                  <MetaCard
                    key={meta.id}
                    metaId={meta.id}
                    barbeiroId={b.id}
                    tipo={meta.tipo}
                    ativa={meta.ativa}
                    niveis={meta.niveis}
                    valorAtual={progressoPorMeta.get(meta.id) ?? 0}
                    dataInicio={meta.dataInicio}
                    dataFim={meta.dataFim}
                    servicoNome={meta.servico?.nome ?? null}
                    produtoNome={meta.produto?.nome ?? null}
                    servicoId={meta.servicoId}
                    produtoId={meta.produtoId}
                    servicos={servicos}
                    produtos={produtos}
                  />
                ))}
              </div>
            </div>
          );
        })}
        {barbeiros.every((b) => b.metas.length === 0) && (
          <p className="text-slate-400">Nenhuma meta cadastrada ainda.</p>
        )}
      </div>

      <p className="text-slate-300 text-xs mt-8">Tipos disponíveis: {Object.values(LABEL_TIPO_META).join(" · ")}</p>
    </div>
  );
}
