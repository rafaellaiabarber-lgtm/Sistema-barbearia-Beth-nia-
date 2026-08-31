import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { LABEL_TIPO_META } from "@/lib/metas";
import { calcularProgressoMeta } from "@/lib/metas-server";
import { NovaMetaForm } from "./nova-meta-form";
import { MetaCard } from "./meta-card";

export default async function MetasPage() {
  const session = await requireSession(["ADMIN"]);
  const [barbeiros, servicos, produtos] = await Promise.all([
    prisma.barbeiro.findMany({
      where: { ativo: true, barbeariaId: session.barbeariaId },
      orderBy: { nome: "asc" },
      include: {
        metas: {
          include: { niveis: true, servico: true, produto: true },
          orderBy: { criadoEm: "asc" },
        },
      },
    }),
    prisma.servico.findMany({ where: { ativo: true, barbeariaId: session.barbeariaId }, orderBy: { nome: "asc" } }),
    prisma.produto.findMany({ where: { ativo: true, barbeariaId: session.barbeariaId }, orderBy: { nome: "asc" } }),
  ]);

  const todasMetas = barbeiros.flatMap((b) => b.metas.map((m) => ({ meta: m, comissaoPadrao: b.comissaoPercentual })));
  const progressos = await Promise.all(
    todasMetas.map(({ meta, comissaoPadrao }) => calcularProgressoMeta(meta, comissaoPadrao))
  );
  const progressoPorMeta = new Map(todasMetas.map(({ meta }, i) => [meta.id, progressos[i]]));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Metas</h1>
      <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6">
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
              <p className="font-semibold text-neutral-700 dark:text-neutral-200 mb-2">{b.nome}</p>
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
          <p className="text-neutral-400 dark:text-neutral-500">Nenhuma meta cadastrada ainda.</p>
        )}
      </div>

      <p className="text-neutral-300 text-xs mt-8">Tipos disponíveis: {Object.values(LABEL_TIPO_META).join(" · ")}</p>
    </div>
  );
}
