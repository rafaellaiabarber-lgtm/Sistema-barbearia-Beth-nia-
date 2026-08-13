import { prisma } from "@/lib/prisma";
import { NovaCampanhaForm } from "./nova-campanha-form";
import { CampanhaRow } from "./campanha-row";
import type { ItemProgresso } from "@/lib/campanhas";
import { buscarQuantidadeAtualItem } from "@/lib/campanhas-server";

export default async function CampanhasPage() {
  const [barbeirosAtivos, produtosAtivos, servicosAtivos, campanhas] = await Promise.all([
    prisma.barbeiro.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.produto.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.servico.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.campanhaVenda.findMany({
      include: { barbeiro: true, itens: { include: { produto: true, servico: true } } },
      orderBy: [{ ativa: "desc" }, { criadoEm: "desc" }],
    }),
  ]);

  const campanhasComProgresso = await Promise.all(
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
      return { id: c.id, titulo: c.titulo, ativa: c.ativa, barbeiroNome: c.barbeiro.nome, criadoEm: c.criadoEm, itens };
    })
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Campanhas de venda</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        Monte uma lista de produtos e serviços com quantidade alvo pra um barbeiro — aparece pra ele assim que começa a
        atender um cliente, lembrando o que ainda falta vender.
      </p>

      <NovaCampanhaForm barbeiros={barbeirosAtivos} produtos={produtosAtivos} servicos={servicosAtivos} />

      <div className="space-y-3">
        {campanhasComProgresso.map((c) => (
          <CampanhaRow key={c.id} {...c} />
        ))}
        {campanhasComProgresso.length === 0 && (
          <p className="text-slate-400 dark:text-slate-500">Nenhuma campanha criada ainda.</p>
        )}
      </div>
    </div>
  );
}
