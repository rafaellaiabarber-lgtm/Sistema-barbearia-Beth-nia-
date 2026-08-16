import { prisma } from "@/lib/prisma";
import { NovoServicoForm } from "./novo-servico-form";
import { ServicoRow } from "./servico-row";

export default async function ServicosPage() {
  const [servicos, barbeiros] = await Promise.all([
    prisma.servico.findMany({ orderBy: [{ ativo: "desc" }, { nome: "asc" }] }),
    prisma.barbeiro.findMany({ where: { ativo: true }, select: { comissaoPercentual: true } }),
  ]);
  const comissoesPadrao = barbeiros.map((b) => b.comissaoPercentual);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Serviços</h1>

      <NovoServicoForm />

      <div className="space-y-2">
        {servicos.map((s) => (
          <ServicoRow key={s.id} servico={s} comissoesPadrao={comissoesPadrao} />
        ))}
      </div>
    </div>
  );
}
