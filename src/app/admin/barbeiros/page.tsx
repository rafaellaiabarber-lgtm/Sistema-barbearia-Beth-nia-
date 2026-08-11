import { prisma } from "@/lib/prisma";
import { alternarAtivoBarbeiro } from "@/lib/actions/barbeiros";
import { NovoBarbeiroForm } from "./novo-barbeiro-form";
import { FotoBarbeiroForm } from "./foto-barbeiro-form";

export default async function BarbeirosPage() {
  const barbeiros = await prisma.barbeiro.findMany({
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    include: { usuario: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Barbeiros</h1>

      <NovoBarbeiroForm />

      <div className="space-y-2">
        {barbeiros.map((b) => (
          <div
            key={b.id}
            className={`flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-xl p-4 ${
              !b.ativo ? "opacity-50" : ""
            }`}
          >
            <div className="flex items-center gap-4">
              <FotoBarbeiroForm barbeiroId={b.id} nome={b.nome} fotoUrl={b.fotoUrl} />
              <div>
                <p className="font-semibold">{b.nome}</p>
                <p className="text-neutral-400 text-sm">
                  {b.telefone ?? "sem telefone"} · comissão {b.comissaoPercentual}% · login: {b.usuario?.login}
                </p>
              </div>
            </div>
            <form action={alternarAtivoBarbeiro.bind(null, b.id, !b.ativo)}>
              <button className="text-sm text-neutral-300 hover:text-amber-400">
                {b.ativo ? "Desativar" : "Ativar"}
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
