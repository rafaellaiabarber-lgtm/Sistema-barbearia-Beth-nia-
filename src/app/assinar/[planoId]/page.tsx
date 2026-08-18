import { prisma } from "@/lib/prisma";
import { formatarReais } from "@/lib/format";
import { formatarDiasSemana } from "@/lib/assinaturas";
import { AssinarForm } from "./assinar-form";

export const dynamic = "force-dynamic";

export default async function AssinarPlanoPage({ params }: { params: Promise<{ planoId: string }> }) {
  const { planoId } = await params;

  const plano = await prisma.plano.findFirst({ where: { id: planoId, ativo: true } });

  if (!plano) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <p className="text-white text-center">Esse plano não está disponível no momento.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        <p className="text-slate-400 text-sm mb-1">Assinatura da barbearia</p>
        <h1 className="text-white text-2xl font-bold mb-4">{plano.nome}</h1>

        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full mb-6">
          <p className="text-3xl font-bold text-lime-400">{formatarReais(plano.precoCentavos)}</p>
          <p className="text-slate-400 text-sm mt-1">por mês</p>
          <p className="text-slate-300 text-sm mt-3">
            {plano.servicosIncluidosPorMes} serviço(s) incluído(s) por mês · cobre {formatarDiasSemana(plano.diasSemana)}
          </p>
        </div>

        <AssinarForm planoId={plano.id} />
      </div>
    </div>
  );
}
