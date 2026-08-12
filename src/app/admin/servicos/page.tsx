import { prisma } from "@/lib/prisma";
import { formatarReais } from "@/lib/format";
import { alternarAtivoServico, excluirServico } from "@/lib/actions/servicos";
import { NovoServicoForm } from "./novo-servico-form";
import { ComissaoServicoForm } from "./comissao-servico-form";

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
            className={`flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm ${
              !s.ativo ? "opacity-50" : ""
            }`}
          >
            <div>
              <p className="font-semibold">{s.nome}</p>
              <p className="text-slate-500 text-sm">
                {formatarReais(s.precoCentavos)} · {s.duracaoMinutos} min ·{" "}
                {s.comissaoPercentual !== null
                  ? `comissão própria: ${s.comissaoPercentual}%`
                  : "comissão: padrão do barbeiro"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <ComissaoServicoForm servicoId={s.id} comissaoPercentual={s.comissaoPercentual} />
              <form action={alternarAtivoServico.bind(null, s.id, !s.ativo)}>
                <button className="text-sm text-slate-600 hover:text-blue-600">
                  {s.ativo ? "Desativar" : "Ativar"}
                </button>
              </form>
              <form action={excluirServico.bind(null, s.id)}>
                <button className="text-sm text-slate-400 hover:text-red-600">Excluir</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
