import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatarReais } from "@/lib/format";
import { formatarDiasSemana } from "@/lib/assinaturas";
import { PlanoLink } from "../../admin/planos/plano-link";
import { Valor } from "../../valor";

export default async function PlanosBarbeiroPage() {
  await requireSession(["ADMIN", "BARBEIRO"]);

  const planos = await prisma.plano.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } });

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Planos de assinatura</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Mostre o QR Code ou mande o link pro cliente assinar um plano.
        </p>
      </header>

      <div className="space-y-3">
        {planos.map((p) => (
          <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <p className="font-semibold">{p.nome}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">
              <Valor>{formatarReais(p.precoCentavos)}</Valor>/mês · {p.servicosIncluidosPorMes} serviço(s) incluído(s) por
              mês · cobre {formatarDiasSemana(p.diasSemana)}
            </p>
            <PlanoLink plano={p} />
          </div>
        ))}
        {planos.length === 0 && <p className="text-slate-400 dark:text-slate-500">Nenhum plano ativo no momento.</p>}
      </div>
    </div>
  );
}
