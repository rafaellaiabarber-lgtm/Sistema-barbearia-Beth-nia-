import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { calcularIntervalo } from "@/lib/periodo";
import { formatarReais } from "@/lib/format";
import { Valor } from "../../valor";
import { NovaDespesaForm } from "./nova-despesa-form";
import { DespesaRow } from "./despesa-row";

export default async function DespesasPage() {
  const session = await requireSession(["ADMIN", "BARBEIRO"]);

  if (!session.barbeiroId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">Minhas despesas</h1>
        <p className="text-neutral-500 dark:text-neutral-400">Essa área é só para o perfil de barbeiro.</p>
      </div>
    );
  }

  const despesas = await prisma.despesaBarbeiro.findMany({
    where: { barbeiroId: session.barbeiroId },
    orderBy: { data: "desc" },
  });

  const mes = calcularIntervalo("mes", new Date());
  const totalMesCentavos = despesas
    .filter((d) => d.data >= mes.inicio && d.data <= mes.fim)
    .reduce((s, d) => s + d.valorCentavos, 0);

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Minhas despesas</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          Um controle pessoal das suas despesas — só você vê, não afeta comissão nem nenhum relatório.
        </p>
      </header>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 mb-6 max-w-xs shadow-sm">
        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
          <Valor>{formatarReais(totalMesCentavos)}</Valor>
        </p>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Gasto esse mês</p>
      </div>

      <NovaDespesaForm />

      <div className="space-y-2">
        {despesas.map((d) => (
          <DespesaRow key={d.id} id={d.id} descricao={d.descricao} valorCentavos={d.valorCentavos} data={d.data} />
        ))}
        {despesas.length === 0 && <p className="text-neutral-400 dark:text-neutral-500">Nenhuma despesa lançada ainda.</p>}
      </div>
    </div>
  );
}
