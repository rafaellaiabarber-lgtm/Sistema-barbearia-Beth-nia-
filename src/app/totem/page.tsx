import { prisma } from "@/lib/prisma";
import { estaPausadoHoje } from "@/lib/periodo";
import { TotemForm } from "./totem-form";

export const dynamic = "force-dynamic";

export default async function TotemPage() {
  const [todosBarbeiros, configuracao] = await Promise.all([
    prisma.barbeiro.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
    }),
    prisma.configuracaoTotem.findUnique({ where: { id: "singleton" } }),
  ]);
  const barbeiros = todosBarbeiros.filter((b) => !estaPausadoHoje(b.pausadoEm));

  return (
    <div
      className="min-h-screen bg-black bg-cover bg-center flex items-center justify-center p-4"
      style={configuracao?.fundoUrl ? { backgroundImage: `url(${configuracao.fundoUrl})` } : undefined}
    >
      <TotemForm barbeiros={barbeiros} logoUrl={configuracao?.logoUrl ?? null} />
    </div>
  );
}
