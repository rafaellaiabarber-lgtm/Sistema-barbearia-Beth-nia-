import { prisma } from "@/lib/prisma";
import { RoletaWheel } from "./roleta-wheel";

export const dynamic = "force-dynamic";

export default async function RoletaPage({ params }: { params: Promise<{ barbeiroId: string }> }) {
  const { barbeiroId } = await params;

  const [barbeiro, ofertas] = await Promise.all([
    prisma.barbeiro.findFirst({ where: { id: barbeiroId, ativo: true } }),
    prisma.ofertaRoleta.findMany({ where: { ativo: true }, orderBy: { ordem: "asc" } }),
  ]);

  if (!barbeiro) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <p className="text-white text-center">Essa roleta não está disponível no momento.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <RoletaWheel barbeiroId={barbeiro.id} barbeiroNome={barbeiro.nome} ofertas={ofertas} />
    </div>
  );
}
