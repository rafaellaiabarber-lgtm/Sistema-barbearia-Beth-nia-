import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SLUG_BETHANIA = "bethania";
const NOME_BETHANIA = "Barbearia Bethânia";

async function main() {
  const barbearia = await prisma.barbearia.upsert({
    where: { slug: SLUG_BETHANIA },
    update: {},
    create: { slug: SLUG_BETHANIA, nome: NOME_BETHANIA },
  });

  const modelos = [
    { nome: "usuario", cliente: prisma.usuario },
    { nome: "barbeiro", cliente: prisma.barbeiro },
    { nome: "jornadaTrabalho", cliente: prisma.jornadaTrabalho },
    { nome: "indicacao", cliente: prisma.indicacao },
    { nome: "despesaBarbeiro", cliente: prisma.despesaBarbeiro },
    { nome: "meta", cliente: prisma.meta },
    { nome: "nivelMeta", cliente: prisma.nivelMeta },
    { nome: "cliente", cliente: prisma.cliente },
    { nome: "servico", cliente: prisma.servico },
    { nome: "produto", cliente: prisma.produto },
    { nome: "campanhaVenda", cliente: prisma.campanhaVenda },
    { nome: "itemCampanhaVenda", cliente: prisma.itemCampanhaVenda },
    { nome: "vendaProduto", cliente: prisma.vendaProduto },
    { nome: "atendimento", cliente: prisma.atendimento },
    { nome: "movimentoCaixa", cliente: prisma.movimentoCaixa },
    { nome: "pagamentoComissao", cliente: prisma.pagamentoComissao },
    { nome: "atendimentoServico", cliente: prisma.atendimentoServico },
    { nome: "plano", cliente: prisma.plano },
    { nome: "assinatura", cliente: prisma.assinatura },
    { nome: "pagamentoAssinatura", cliente: prisma.pagamentoAssinatura },
    { nome: "distribuicaoPote", cliente: prisma.distribuicaoPote },
    { nome: "itemDistribuicaoPote", cliente: prisma.itemDistribuicaoPote },
    { nome: "contaFinanceira", cliente: prisma.contaFinanceira },
    { nome: "materialTreinamento", cliente: prisma.materialTreinamento },
    { nome: "temaFeedback", cliente: prisma.temaFeedback },
    { nome: "feedback", cliente: prisma.feedback },
    { nome: "ofertaRoleta", cliente: prisma.ofertaRoleta },
    { nome: "giroRoleta", cliente: prisma.giroRoleta },
  ] as const;

  for (const { nome, cliente } of modelos) {
    // @ts-expect-error -- todos os modelos da lista têm updateMany e barbeariaId
    const resultado = await cliente.updateMany({
      where: { barbeariaId: null },
      data: { barbeariaId: barbearia.id },
    });
    console.log(`${nome}: ${resultado.count} linha(s) atualizada(s)`);
  }

  let restantes = 0;
  for (const { cliente } of modelos) {
    // @ts-expect-error -- count existe em todos os modelos da lista
    restantes += await cliente.count({ where: { barbeariaId: null } });
  }
  if (restantes > 0) {
    throw new Error(`Ainda restam ${restantes} linha(s) sem barbeariaId após o backfill.`);
  }
  console.log("Backfill concluído: nenhuma linha ficou sem barbeariaId.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
