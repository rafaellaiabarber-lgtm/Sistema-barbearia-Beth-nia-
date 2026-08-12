import { prisma } from "@/lib/prisma";
import { TotemForm } from "./totem-form";

export const dynamic = "force-dynamic";

export default async function TotemPage() {
  const [barbeiros, configuracao] = await Promise.all([
    prisma.barbeiro.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
    }),
    prisma.configuracaoTotem.findUnique({ where: { id: "singleton" } }),
  ]);

  return (
    <div
      className="min-h-screen bg-slate-50 bg-cover bg-center flex items-center justify-center p-4"
      style={configuracao?.fundoUrl ? { backgroundImage: `url(${configuracao.fundoUrl})` } : undefined}
    >
      <TotemForm barbeiros={barbeiros} logoUrl={configuracao?.logoUrl ?? null} />
    </div>
  );
}
