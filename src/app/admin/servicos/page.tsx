import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { NovoServicoForm } from "./novo-servico-form";
import { ServicoRow } from "./servico-row";

export default async function ServicosPage() {
  const session = await requireSession(["ADMIN"]);
  const [servicos, barbeiros] = await Promise.all([
    prisma.servico.findMany({
      where: { barbeariaId: session.barbeariaId },
      orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    }),
    prisma.barbeiro.findMany({
      where: { ativo: true, barbeariaId: session.barbeariaId },
      select: { comissaoPercentual: true },
    }),
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
