import { prisma } from "@/lib/prisma";
import { setCurrentBarbearia } from "@/lib/tenant-context";
import { RoletaWheel } from "./roleta-wheel";

export const dynamic = "force-dynamic";

export default async function RoletaPage({ params }: { params: Promise<{ barbeiroId: string }> }) {
  const { barbeiroId } = await params;

  const barbeiro = await prisma.barbeiro.findFirst({
    where: { id: barbeiroId, ativo: true },
    include: { barbearia: true },
  });

  if (!barbeiro || !barbeiro.barbearia || !barbeiro.barbearia.ativa) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <p className="text-white text-center">Essa roleta não está disponível no momento.</p>
      </div>
    );
  }
  setCurrentBarbearia(barbeiro.barbeariaId);

  const ofertas = await prisma.ofertaRoleta.findMany({
    where: { ativo: true, barbeariaId: barbeiro.barbeariaId },
    orderBy: { ordem: "asc" },
  });

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <RoletaWheel barbeiroId={barbeiro.id} barbeiroNome={barbeiro.nome} ofertas={ofertas} />
    </div>
  );
}
