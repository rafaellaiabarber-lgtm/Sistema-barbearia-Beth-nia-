import { prisma } from "@/lib/prisma";
import { percentualX100ParaValor } from "@/lib/format";
import { Calculadora } from "./calculadora";

export default async function PrecificacaoPage() {
  const configuracao = await prisma.configuracaoFinanceira.findUnique({ where: { id: "singleton" } });
  const taxaCartaoDefault =
    configuracao?.taxaCartaoPercentualX100 !== null && configuracao?.taxaCartaoPercentualX100 !== undefined
      ? percentualX100ParaValor(configuracao.taxaCartaoPercentualX100)
      : "";
  const impostoDefault =
    configuracao?.impostoPercentualX100 !== null && configuracao?.impostoPercentualX100 !== undefined
      ? percentualX100ParaValor(configuracao.impostoPercentualX100)
      : "";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Precificação</h1>
      <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6">
        Descubra o preço certo pra cobrar em um produto, serviço ou procedimento químico, já contando a taxa da
        maquininha, o imposto, a comissão do barbeiro e a margem de lucro que você quer ter.
      </p>

      <Calculadora taxaCartaoDefault={taxaCartaoDefault} impostoDefault={impostoDefault} />
    </div>
  );
}
