import { prisma } from "@/lib/prisma";
import { formatarReais } from "@/lib/format";
import { excluirMovimentoCaixa } from "@/lib/actions/caixa";
import { NovoMovimentoForm } from "./novo-movimento-form";

function inicioDoDia() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

type Lancamento = {
  id: string;
  horario: Date;
  descricao: string;
  valorCentavos: number;
  excluivel: boolean;
};

export default async function CaixaPage() {
  const inicio = inicioDoDia();

  const [atendimentosHoje, movimentosHoje] = await Promise.all([
    prisma.atendimento.findMany({
      where: { status: "CONCLUIDO", concluidoEm: { gte: inicio } },
      include: { cliente: true, barbeiro: true },
      orderBy: { concluidoEm: "asc" },
    }),
    prisma.movimentoCaixa.findMany({
      where: { criadoEm: { gte: inicio } },
      orderBy: { criadoEm: "asc" },
    }),
  ]);

  const lancamentos: Lancamento[] = [
    ...atendimentosHoje.map((a) => ({
      id: `atendimento-${a.id}`,
      horario: a.concluidoEm!,
      descricao: `Atendimento — ${a.cliente.nome}${a.barbeiro ? ` (${a.barbeiro.nome})` : ""}`,
      valorCentavos: a.precoTotalCentavos,
      excluivel: false,
    })),
    ...movimentosHoje.map((m) => ({
      id: m.id,
      horario: m.criadoEm,
      descricao: m.descricao,
      valorCentavos: m.tipo === "ENTRADA" ? m.valorCentavos : -m.valorCentavos,
      excluivel: true,
    })),
  ].sort((a, b) => a.horario.getTime() - b.horario.getTime());

  let saldo = 0;
  const linhas = lancamentos.map((l) => {
    saldo += l.valorCentavos;
    return { ...l, saldo };
  });

  const totalDoDia = saldo;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Caixa do dia</h1>

      <NovoMovimentoForm />

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 mb-6">
        <p className="text-neutral-400 text-sm">Total no caixa hoje</p>
        <p className={`text-3xl font-bold ${totalDoDia < 0 ? "text-red-400" : "text-amber-400"}`}>
          {formatarReais(totalDoDia)}
        </p>
      </div>

      {linhas.length === 0 ? (
        <p className="text-neutral-500">Nenhum lançamento hoje ainda.</p>
      ) : (
        <div className="space-y-2">
          {linhas.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-xl p-4"
            >
              <div>
                <p className="font-medium">{l.descricao}</p>
                <p className="text-neutral-500 text-xs">
                  {l.horario.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · saldo:{" "}
                  {formatarReais(l.saldo)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-semibold ${l.valorCentavos < 0 ? "text-red-400" : "text-green-400"}`}>
                  {l.valorCentavos < 0 ? "-" : "+"}
                  {formatarReais(Math.abs(l.valorCentavos))}
                </span>
                {l.excluivel && (
                  <form action={excluirMovimentoCaixa.bind(null, l.id)}>
                    <button className="text-neutral-500 hover:text-red-400 text-sm">Excluir</button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
