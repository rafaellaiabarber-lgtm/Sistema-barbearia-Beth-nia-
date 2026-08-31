import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

// Compatibilidade com QR codes/links físicos antigos (sem slug). Redireciona
// pro link com o slug da barbearia do próprio barbeiro.
export const dynamic = "force-dynamic";

export default async function RoletaRedirectPage({ params }: { params: Promise<{ barbeiroId: string }> }) {
  const { barbeiroId } = await params;
  const barbeiro = await prisma.barbeiro.findFirst({
    where: { id: barbeiroId, ativo: true },
    include: { barbearia: true },
  });

  if (!barbeiro || !barbeiro.barbearia) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <p className="text-white text-center">Essa roleta não está disponível no momento.</p>
      </div>
    );
  }

  redirect(`/${barbeiro.barbearia.slug}/roleta/${barbeiro.id}`);
}
