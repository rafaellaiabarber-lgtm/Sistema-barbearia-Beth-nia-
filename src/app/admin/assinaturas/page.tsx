import { prisma } from "@/lib/prisma";
import { competenciaAtual, estaInadimplente, prestesAVencer } from "@/lib/assinaturas";
import { NovaAssinaturaForm } from "./nova-assinatura-form";
import { ListaAssinaturas } from "./lista-assinaturas";

function paraCampoData(data: Date) {
  return data.toISOString().slice(0, 10);
}

export default async function AssinaturasPage({
  searchParams,
}: {
  searchParams: Promise<{ telefone?: string; nome?: string }>;
}) {
  const sp = await searchParams;
  const competencia = competenciaAtual();
  const hoje = paraCampoData(new Date());

  const [assinaturas, planosAtivos, barbeirosAtivos] = await Promise.all([
    prisma.assinatura.findMany({
      include: {
        cliente: true,
        plano: true,
        barbeiro: true,
        pagamentos: { orderBy: { competencia: "desc" } },
      },
      orderBy: [{ cliente: { nome: "asc" } }],
    }),
    prisma.plano.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.barbeiro.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  const ativas = assinaturas.filter((a) => a.status === "ATIVA");

  const linhas = assinaturas.map((a) => {
    const pagamentoAtual = a.pagamentos.find((p) => p.competencia === competencia);
    const pago = !!pagamentoAtual;
    const outrosPagamentos = a.pagamentos.filter((p) => p.competencia !== competencia);
    const inadimplente = a.status === "ATIVA" && estaInadimplente(a.diaVencimento, pago);
    const vencendo = a.status === "ATIVA" && prestesAVencer(a.diaVencimento, pago);
    return { assinatura: a, pagamentoAtual, pago, outrosPagamentos, inadimplente, vencendo };
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Assinaturas</h1>

      <NovaAssinaturaForm
        planos={planosAtivos}
        barbeiros={barbeirosAtivos}
        telefoneInicial={sp.telefone}
        nomeInicial={sp.nome}
      />

      <ListaAssinaturas
        linhas={linhas}
        competencia={competencia}
        hoje={hoje}
        totalAtivas={ativas.length}
        planos={planosAtivos}
      />
    </div>
  );
}
