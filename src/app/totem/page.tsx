import { prisma } from "@/lib/prisma";
import { TotemForm } from "./totem-form";

export const dynamic = "force-dynamic";

export default async function TotemPage() {
  const barbeiros = await prisma.barbeiro.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <TotemForm barbeiros={barbeiros} />
    </div>
  );
}
