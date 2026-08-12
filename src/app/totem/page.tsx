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

  const fundoEhVideo = configuracao?.fundoTipo === "video";

  return (
    <div className="relative min-h-screen bg-slate-50 flex items-center justify-center p-4 overflow-hidden">
      {configuracao?.fundoUrl &&
        (fundoEhVideo ? (
          <video
            key={configuracao.fundoUrl}
            src={configuracao.fundoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${configuracao.fundoUrl})` }}
          />
        ))}
      <div className="relative z-10 w-full flex items-center justify-center">
        <TotemForm barbeiros={barbeiros} logoUrl={configuracao?.logoUrl ?? null} />
      </div>
    </div>
  );
}
