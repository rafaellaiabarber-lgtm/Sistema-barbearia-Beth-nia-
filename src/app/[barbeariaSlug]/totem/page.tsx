import { prisma } from "@/lib/prisma";
import { estaPausadoHoje } from "@/lib/periodo";
import { requireBarbeariaBySlug } from "@/lib/tenant";
import { TotemForm } from "./totem-form";

export const dynamic = "force-dynamic";

export default async function TotemPage({ params }: { params: Promise<{ barbeariaSlug: string }> }) {
  const { barbeariaSlug } = await params;
  const barbearia = await requireBarbeariaBySlug(barbeariaSlug);

  const [todosBarbeiros, configuracao] = await Promise.all([
    prisma.barbeiro.findMany({
      where: { ativo: true, barbeariaId: barbearia.id },
      orderBy: { nome: "asc" },
    }),
    prisma.configuracaoTotem.findUnique({ where: { barbeariaId: barbearia.id } }),
  ]);
  const barbeiros = todosBarbeiros.filter((b) => !estaPausadoHoje(b.pausadoEm));

  return (
    <div
      className="min-h-screen bg-black bg-cover bg-center flex items-center justify-center p-4"
      style={configuracao?.fundoUrl ? { backgroundImage: `url(${configuracao.fundoUrl})` } : undefined}
    >
      <TotemForm barbearia={barbearia} barbeiros={barbeiros} logoUrl={configuracao?.logoUrl ?? null} />
    </div>
  );
}
