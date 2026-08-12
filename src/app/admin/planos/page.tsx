import { prisma } from "@/lib/prisma";
import { NovoPlanoForm } from "./novo-plano-form";
import { PlanoRow } from "./plano-row";

export default async function PlanosPage() {
  const planos = await prisma.plano.findMany({ orderBy: [{ ativo: "desc" }, { nome: "asc" }] });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Planos de assinatura</h1>

      <NovoPlanoForm />

      <div className="space-y-2">
        {planos.map((p) => (
          <PlanoRow key={p.id} plano={p} />
        ))}
        {planos.length === 0 && <p className="text-slate-400">Nenhum plano cadastrado ainda.</p>}
      </div>
    </div>
  );
}
