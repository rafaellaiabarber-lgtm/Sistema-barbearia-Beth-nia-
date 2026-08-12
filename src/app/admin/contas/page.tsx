import { prisma } from "@/lib/prisma";
import { formatarReais } from "@/lib/format";
import { NovaContaForm } from "./nova-conta-form";
import { ContaRow } from "./conta-row";

function inicioDoDia() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function ContasPage() {
  const hoje = inicioDoDia();

  const [aPagar, aReceber] = await Promise.all([
    prisma.contaFinanceira.findMany({ where: { tipo: "PAGAR" }, orderBy: { vencimento: "asc" } }),
    prisma.contaFinanceira.findMany({ where: { tipo: "RECEBER" }, orderBy: { vencimento: "asc" } }),
  ]);

  function separar(contas: typeof aPagar) {
    const pendentes = contas.filter((c) => c.status === "PENDENTE");
    const pagas = contas.filter((c) => c.status === "PAGO");
    const atrasadas = pendentes.filter((c) => c.vencimento < hoje);
    const totalPendenteCentavos = pendentes.reduce((s, c) => s + c.valorCentavos, 0);
    return { pendentes, pagas, atrasadas, totalPendenteCentavos };
  }

  const pagar = separar(aPagar);
  const receber = separar(aReceber);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Contas a pagar e a receber</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl p-5 shadow-sm bg-red-600 text-white">
          <p className="text-2xl font-bold mb-1">{formatarReais(pagar.totalPendenteCentavos)}</p>
          <p className="text-red-100 text-sm">
            A pagar {pagar.atrasadas.length > 0 && `· ${pagar.atrasadas.length} atrasada(s)`}
          </p>
        </div>
        <div className="rounded-xl p-5 shadow-sm bg-green-600 text-white">
          <p className="text-2xl font-bold mb-1">{formatarReais(receber.totalPendenteCentavos)}</p>
          <p className="text-green-100 text-sm">
            A receber {receber.atrasadas.length > 0 && `· ${receber.atrasadas.length} atrasada(s)`}
          </p>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3">Contas a pagar</h2>
      <NovaContaForm tipo="PAGAR" />
      <div className="space-y-2 mb-4">
        {pagar.pendentes.map((c) => (
          <ContaRow key={c.id} conta={c} atrasada={c.vencimento < hoje} />
        ))}
        {pagar.pendentes.length === 0 && <p className="text-slate-400">Nenhuma conta a pagar pendente.</p>}
      </div>
      {pagar.pagas.length > 0 && (
        <details className="mb-8">
          <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-800 select-none">
            Contas a pagar já pagas ({pagar.pagas.length})
          </summary>
          <div className="space-y-2 mt-3">
            {pagar.pagas.map((c) => (
              <ContaRow key={c.id} conta={c} atrasada={false} />
            ))}
          </div>
        </details>
      )}

      <h2 className="text-lg font-semibold mb-3">Contas a receber</h2>
      <NovaContaForm tipo="RECEBER" />
      <div className="space-y-2 mb-4">
        {receber.pendentes.map((c) => (
          <ContaRow key={c.id} conta={c} atrasada={c.vencimento < hoje} />
        ))}
        {receber.pendentes.length === 0 && <p className="text-slate-400">Nenhuma conta a receber pendente.</p>}
      </div>
      {receber.pagas.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-800 select-none">
            Contas a receber já recebidas ({receber.pagas.length})
          </summary>
          <div className="space-y-2 mt-3">
            {receber.pagas.map((c) => (
              <ContaRow key={c.id} conta={c} atrasada={false} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
