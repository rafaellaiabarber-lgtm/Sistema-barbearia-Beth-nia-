import { prisma } from "@/lib/prisma";
import { formatarReais } from "@/lib/format";
import { excluirMovimentoCaixa } from "@/lib/actions/caixa";
import { NovoMovimentoForm } from "./novo-movimento-form";
import { NovoAtendimentoForm } from "./novo-atendimento-form";
import { BotaoExcluirAtendimento } from "../excluir-atendimento-button";

function inicioDoDia() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

type Lancamento = {
  id: string;
  tipo: "atendimento" | "movimento";
  horario: Date;
  descricao: string;
  valorCentavos: number;
};

export default async function CaixaPage() {
  const inicio = inicioDoDia();

  const [atendimentosHoje, movimentosHoje, barbeiros, servicos] = await Promise.all([
    prisma.atendimento.findMany({
      where: { status: "CONCLUIDO", concluidoEm: { gte: inicio } },
      include: { cliente: true, barbeiro: true },
      orderBy: { concluidoEm: "asc" },
    }),
    prisma.movimentoCaixa.findMany({
      where: { criadoEm: { gte: inicio } },
      orderBy: { criadoEm: "asc" },
    }),
    prisma.barbeiro.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.servico.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  const lancamentos: Lancamento[] = [
    ...atendimentosHoje.map((a) => ({
      id: a.id,
      tipo: "atendimento" as const,
      horario: a.concluidoEm!,
      descricao: `Atendimento — ${a.cliente.nome}${a.barbeiro ? ` (${a.barbeiro.nome})` : ""}`,
      valorCentavos: a.precoTotalCentavos,
    })),
    ...movimentosHoje.map((m) => ({
      id: m.id,
      tipo: "movimento" as const,
      horario: m.criadoEm,
      descricao: m.descricao,
      valorCentavos: m.tipo === "ENTRADA" ? m.valorCentavos : -m.valorCentavos,
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

      <NovoAtendimentoForm barbeiros={barbeiros} servicos={servicos} />
      <NovoMovimentoForm />

      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
        <p className="text-slate-500 text-sm">Total no caixa hoje</p>
        <p className={`text-3xl font-bold ${totalDoDia < 0 ? "text-red-600" : "text-blue-600"}`}>
          {formatarReais(totalDoDia)}
        </p>
      </div>

      {linhas.length === 0 ? (
        <p className="text-slate-400">Nenhum lançamento hoje ainda.</p>
      ) : (
        <div className="space-y-2">
          {linhas.map((l) => (
            <div
              key={`${l.tipo}-${l.id}`}
              className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
            >
              <div>
                <p className="font-medium">{l.descricao}</p>
                <p className="text-slate-400 text-xs">
                  {l.horario.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · saldo:{" "}
                  {formatarReais(l.saldo)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-semibold ${l.valorCentavos < 0 ? "text-red-600" : "text-green-600"}`}>
                  {l.valorCentavos < 0 ? "-" : "+"}
                  {formatarReais(Math.abs(l.valorCentavos))}
                </span>
                {l.tipo === "atendimento" ? (
                  <BotaoExcluirAtendimento atendimentoId={l.id} />
                ) : (
                  <form action={excluirMovimentoCaixa.bind(null, l.id)}>
                    <button className="text-slate-400 hover:text-red-600 text-sm">Excluir</button>
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
