import { prisma } from "@/lib/prisma";
import { competenciaAtual, formatarCompetencia, estaInadimplente } from "@/lib/assinaturas";
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
  const inadimplentes = ativas.filter((a) =>
    estaInadimplente(a.diaVencimento, a.pagamentos.some((p) => p.competencia === competencia))
  );

  const linhas = assinaturas.map((a) => {
    const pagamentoAtual = a.pagamentos.find((p) => p.competencia === competencia);
    const pago = !!pagamentoAtual;
    const outrosPagamentos = a.pagamentos.filter((p) => p.competencia !== competencia);
    const inadimplente = a.status === "ATIVA" && estaInadimplente(a.diaVencimento, pago);
    return { assinatura: a, pagamentoAtual, pago, outrosPagamentos, inadimplente };
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Assinaturas</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-sm">Assinaturas ativas</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{ativas.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-sm">Inadimplentes ({formatarCompetencia(competencia)})</p>
          <p className={`text-2xl font-bold ${inadimplentes.length > 0 ? "text-red-600" : "text-green-600"}`}>
            {inadimplentes.length}
          </p>
        </div>
      </div>

      <NovaAssinaturaForm
        planos={planosAtivos}
        barbeiros={barbeirosAtivos}
        telefoneInicial={sp.telefone}
        nomeInicial={sp.nome}
      />

      <ListaAssinaturas linhas={linhas} competencia={competencia} hoje={hoje} />
    </div>
  );
}
