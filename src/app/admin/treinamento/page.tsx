import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { NovoMaterialForm } from "./novo-material-form";
import { MaterialRow } from "./material-row";

export default async function TreinamentoAdminPage() {
  const session = await requireSession(["ADMIN"]);
  const materiais = await prisma.materialTreinamento.findMany({
    where: { barbeariaId: session.barbeariaId },
    orderBy: { ordem: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Treinamento</h1>
      <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6">
        Cronograma, POP, planilhas e vídeo-aulas pra quem está entrando na equipe. Todo barbeiro vê o mesmo conteúdo,
        na ordem que você configurar aqui.
      </p>

      <NovoMaterialForm />

      <div className="space-y-2">
        {materiais.map((m, i) => (
          <MaterialRow key={m.id} material={m} primeiro={i === 0} ultimo={i === materiais.length - 1} />
        ))}
        {materiais.length === 0 && (
          <p className="text-neutral-400 dark:text-neutral-500">Nenhum material cadastrado ainda.</p>
        )}
      </div>
    </div>
  );
}
