import { prisma } from "@/lib/prisma";
import { TotemForm } from "./totem-form";

export default async function TotemPage() {
  const servicos = await prisma.servico.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <TotemForm servicos={servicos} />
    </div>
  );
}
