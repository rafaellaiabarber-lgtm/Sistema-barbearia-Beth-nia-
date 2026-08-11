import { prisma } from "@/lib/prisma";
import { formatarReais } from "@/lib/format";
import { alternarAtivoServico, excluirServico } from "@/lib/actions/servicos";
import { NovoServicoForm } from "./novo-servico-form";

export default async function ServicosPage() {
  const servicos = await prisma.servico.findMany({ orderBy: [{ ativo: "desc" }, { nome: "asc" }] });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Serviços</h1>

      <NovoServicoForm />

      <div className="space-y-2">
        {servicos.map((s) => (
          <div
            key={s.id}
            className={`flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-xl p-4 ${
              !s.ativo ? "opacity-50" : ""
            }`}
          >
            <div>
              <p className="font-semibold">{s.nome}</p>
              <p className="text-neutral-400 text-sm">
                {formatarReais(s.precoCentavos)} · {s.duracaoMinutos} min
              </p>
            </div>
            <div className="flex items-center gap-3">
              <form action={alternarAtivoServico.bind(null, s.id, !s.ativo)}>
                <button className="text-sm text-neutral-300 hover:text-amber-400">
                  {s.ativo ? "Desativar" : "Ativar"}
                </button>
              </form>
              <form action={excluirServico.bind(null, s.id)}>
                <button className="text-sm text-neutral-500 hover:text-red-400">Excluir</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
